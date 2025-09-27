const { supabase, supabaseService } = require("../config/config");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");

const advertisementTable = "advertisement";
const analysisResultsTable = "analysis_results";
const mediaTable = "media";
const callLogsTable = "call_logs";
const notificationTable = "notification";

const uploadAdvertisement = async (adData, files) => {
  try {
    // 1. Create Advertisement Entry
    const { data: advertisement, error: adError } = await supabase
      .from(advertisementTable)
      .insert([
        {
          title: adData.title,
          description: adData.description,
          user_id: adData.user_id,
          type: adData.type,
          target_region: adData.target_region,
          language: adData.language,
          landing_url: adData.landing_url,
          target_audience: adData.target_audience,
          target_age_group: adData.target_age_group,
        },
      ])
      .select("advertisement_id")
      .single();

    if (adError) throw adError;

    const advertisementId = advertisement.advertisement_id;

    asyncProcessExecutor(advertisementId, adData, files);

    return { advertisement_id: advertisementId };
  } catch (error) {
    console.error("Error in uploadAdvertisement:", error);
    throw new Error(error.message || "Failed to upload advertisement");
  }
};

const asyncProcessExecutor = async (advertisementId, adData, files) => {
  try {
    // 2. Create Analysis Result Entry
    const { data: analysisResultsData, error: analysisError } = await supabase
      .from(analysisResultsTable)
      .insert([
        {
          advertisement_id: advertisementId,
          user_id: adData.user_id,
          status: 0,
          execution_time: { upload_started: new Date().toISOString() },
        },
      ])
      .select("analysis_results_id");

    const analysisResultsId = analysisResultsData
      ? analysisResultsData[0].analysis_results_id
      : null;

    if (analysisError) throw analysisError;

    // 3. Upload Media Files to Supabase Storage
    const mediaUrls = await uploadMediaToSupabase(
      files,
      adData.user_id,
      advertisementId
    );

    // 4. Store Media URLs in Database
    await storeMediaUrls(
      mediaUrls,
      advertisementId,
      adData.user_id,
      analysisResultsId
    );

    // 5. Update Analysis Result Status
    await updateAnalysisStatus(advertisementId, 1, {
      upload_completed: new Date().toISOString(),
    });

    // 6. Create Success Notification
    await createNotification(
      adData.user_id,
      "upload_success",
      "Ad uploaded successfully. Compliance check will begin shortly."
    );

    // 7. Trigger Compliance Check and get output
    const fastApiOutput = await triggerComplianceCheck(
      advertisementId,
      adData.user_id,
      mediaUrls,
      analysisResultsId
    );

    // 8. Handle Compliance Result with the FastAPI output
    const complianceResult = await handleComplianceResult(
      fastApiOutput,
      advertisementId
    );

    // Store the compliance results in database
    await supabase
      .from(analysisResultsTable)
      .update({
        verdict: complianceResult.compliance_results.verdict,
        reason: complianceResult.compliance_results.reason,
      })
      .eq("advertisement_id", advertisementId);

    // 9. Decision based on verdict
    if (
      complianceResult.compliance_results.verdict === "clarification_needed"
    ) {
      await updateAnalysisStatus(advertisementId, 2, {
        compliance_completed: new Date().toISOString(),
      });

      await createNotification(
        adData.user_id,
        "call_scheduled",
        "Your ad requires clarification. A compliance call has been scheduled."
      );

      // ONLY call scheduleComplianceCall - remove all other manual calls
      await scheduleComplianceCall(
        advertisementId,
        analysisResultsId,
        complianceResult.compliance_results.queries_for_call
      );
    } else if (
      complianceResult.compliance_results.verdict === "pass" ||
      complianceResult.compliance_results.verdict === "fail"
    ) {
      // Direct to report generation
      await updateAnalysisStatus(
        advertisementId,
        complianceResult.compliance_results.verdict === "pass" ? 1 : 2,
        {
          compliance_completed: new Date().toISOString(),
        }
      );

      await generateComplianceReport(
        advertisementId,
        complianceResult.compliance_results
      );
    }
  } catch (error) {
    console.error("Error in asyncProcessExecutor:", error);

    // Handle error case
    await updateAnalysisStatus(advertisementId, 6, {
      error_occurred: new Date().toISOString(),
    });

    await supabase
      .from(analysisResultsTable)
      .update({
        verdict: "error",
        reason: "Processing failed - manual review required",
      })
      .eq("advertisement_id", advertisementId);

    await createNotification(
      adData.user_id,
      "compliance_error",
      "Compliance check failed. Your ad will be reviewed manually."
    );

    await generateComplianceReport(advertisementId, {
      verdict: "error",
      reason: "Processing failed - manual review required",
      error_details: error.message,
    });
  }
};

const uploadMediaToSupabase = async (files, userId, advertisementId) => {
  try {
    const mediaUrls = {
      images: [],
      videos: [],
    };

    for (const file of files) {
      const fileBuffer = fs.readFileSync(file.path);
      const fileName = `${Date.now()}-${file.originalname}`;
      const filePath = `${userId}/${advertisementId}/${fileName}`;

      const { data, error } = await supabaseService.storage
        .from("adguardai")
        .upload(filePath, fileBuffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) throw error;

      const { data: publicUrlData } = supabaseService.storage
        .from("adguardai")
        .getPublicUrl(filePath);

      if (file.mimetype.startsWith("video/")) {
        mediaUrls.videos.push(publicUrlData.publicUrl);
      } else {
        mediaUrls.images.push(publicUrlData.publicUrl);
      }
    }

    return mediaUrls;
  } catch (error) {
    console.error("Error uploading media to Supabase:", error);
    throw new Error("Failed to upload media files");
  }
};

const storeMediaUrls = async (
  mediaUrls,
  advertisementId,
  userId,
  analysisResultsId
) => {
  try {
    const mediaRecord = {
      advertisement_id: advertisementId,
      user_id: userId,
      public_url: {
        video: mediaUrls.videos,
        image: mediaUrls.images,
      },
    };

    const { data, error } = await supabase
      .from(mediaTable)
      .insert([mediaRecord])
      .select("media_id");

    if (error) throw error;
    const mediaId = data[0].media_id;

    // Update analysis_results with media_id
    await supabase
      .from(analysisResultsTable)
      .update({ media_id: mediaId })
      .eq("advertisement_id", advertisementId);

    return mediaId;
  } catch (error) {
    console.error("Error storing media URLs:", error);
    throw new Error("Failed to store media URLs");
  }
};

const updateAnalysisStatus = async (
  advertisementId,
  status,
  executionTimeUpdate = {}
) => {
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const { data: currentData, error: fetchError } = await supabase
        .from(analysisResultsTable)
        .select("execution_time")
        .eq("advertisement_id", advertisementId)
        .single();

      if (fetchError) throw fetchError;

      const updatedExecutionTime = {
        ...currentData.execution_time,
        ...executionTimeUpdate,
      };

      const { error } = await supabase
        .from(analysisResultsTable)
        .update({
          status: status,
          execution_time: updatedExecutionTime,
          updated_at: new Date().toISOString(),
        })
        .eq("advertisement_id", advertisementId);

      if (error) throw error;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

const createNotification = async (userId, type, message) => {
  try {
    const { error } = await supabase.from(notificationTable).insert([
      {
        user_id: userId,
        type: type,
        message: message,
        is_read: false,
      },
    ]);

    if (error) throw error;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

const triggerComplianceCheck = async (
  advertisementId,
  userId,
  mediaUrls,
  analysisResultsId
) => {
  try {
    await updateAnalysisStatus(advertisementId, 1, {
      compliance_started: new Date().toISOString(),
    });

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("name, email, sector, mobile")
      .eq("u_id", userId)
      .single();

    if (userError) throw userError;

    const { data: adData, error: adError } = await supabase
      .from(advertisementTable)
      .select("*")
      .eq("advertisement_id", advertisementId)
      .single();

    if (adError) throw adError;

    const payload = {
      user_data: userData,
      video_links: mediaUrls.videos,
      image_links: mediaUrls.images,
      ad_details: adData,
    };

    const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000";

    // Make synchronous call and return the result
    const response = await axios.post(
      `${fastApiUrl}compliance/check`,
      payload,
      {
        timeout: 300000,
      }
    );

    return response.data;
  } catch (error) {
    console.error("FastAPI compliance check failed:", error);
    // Return error format that handleComplianceResult can process
    return {
      error: true,
      message: "Compliance service error",
      text_op: null,
      image_op: null,
      audio_op: null,
      video_op: null,
      link_op: null,
    };
  }
};

const handleComplianceResult = async (rawOutput, advertisementId) => {
  try {
    // Handle error case from FastAPI
    if (rawOutput.error) {
      return {
        raw_output: rawOutput,
        compliance_results: {
          advertisement_id: advertisementId,
          verdict: "manual_review",
          reason: rawOutput.message || "Compliance service error",
          risk_score: 0.5,
          modalities: {},
          queries_for_call: [],
        },
      };
    }

    // 1. Extract modality-specific results
    const modalityResults = {
      text: extractModalityResult(rawOutput.text_op),
      image: extractModalityResult(rawOutput.image_op),
      audio: extractModalityResult(rawOutput.audio_op),
      video: extractModalityResult(rawOutput.video_op),
      link: extractModalityResult(rawOutput.link_op),
    };

    // 2. Call LLM for final decision
    const llmAnalysis = await callLLMForCompliance(rawOutput, modalityResults);

    // 3. Aggregate risk score (max of all modality risk scores)
    const riskScore = Math.max(
      modalityResults.text.risk_score,
      modalityResults.image.risk_score,
      modalityResults.audio.risk_score,
      modalityResults.video.risk_score,
      modalityResults.link.risk_score
    );

    // 4. Generate queries for call if clarification needed
    let queriesForCall = [];
    if (llmAnalysis.verdict === "clarification_needed") {
      queriesForCall = await generateQueriesForCall(rawOutput, modalityResults);
    }

    // 5. Return structured result
    return {
      raw_output: rawOutput,
      compliance_results: {
        advertisement_id: advertisementId,
        verdict: llmAnalysis.verdict,
        reason: llmAnalysis.reason,
        risk_score: llmAnalysis.overall_risk_score || riskScore,
        modalities: modalityResults,
        queries_for_call: queriesForCall,
      },
    };
  } catch (error) {
    console.error("Error in handleComplianceResult:", error);

    // Return error format
    return {
      raw_output: rawOutput,
      compliance_results: {
        advertisement_id: advertisementId,
        verdict: "manual_review",
        reason: "Error processing compliance results",
        risk_score: 0.5,
        modalities: {},
        queries_for_call: [],
      },
    };
  }
};

const scheduleComplianceCall = async (
  advertisementId,
  analysisResultsId,
  queriesForCall = []
) => {
  try {
    const { data: adData, error: adError } = await supabase
      .from(advertisementTable)
      .select("*, users(name, mobile)")
      .eq("advertisement_id", advertisementId)
      .single();

    if (adError) throw adError;

    const { error: callLogError } = await supabase.from(callLogsTable).insert([
      {
        user_id: adData.user_id,
        advertisement_id: advertisementId,
        analysis_results_id: analysisResultsId,
        status: 0,
        execution_time: { call_scheduled: new Date().toISOString() },
      },
    ]);

    if (callLogError) throw callLogError;

    await updateAnalysisStatus(advertisementId, 3, {
      call_scheduled: new Date().toISOString(),
    });

    // PASS queries to makeComplianceCall:
    await makeComplianceCall(
      adData.users.mobile,
      adData.users.name,
      adData,
      queriesForCall
    );
  } catch (error) {
    console.error("Error scheduling compliance call:", error);
  }
};

const makeComplianceCall = async (
  mobileNo,
  userName,
  adDetails,
  queriesForCall = []
) => {
  try {
    const AUTH_TOKEN = process.env.BLAND_AUTH_TOKEN;
    if (!AUTH_TOKEN) {
      throw new Error("BLAND_AUTH_TOKEN not configured");
    }

    let taskQuestions = "";
    if (queriesForCall.length > 0) {
      taskQuestions =
        "\n\nSpecific questions to ask:\n" +
        queriesForCall.map((q, i) => `${i + 1}. ${q.question}`).join("\n");
    }

    const task = `You are a compliance assistant helping verify advertisement content. The advertiser ${userName} has submitted an ad titled "${adDetails.title}" for review. Your task is to:
1. Ask clarifying questions about the advertisement content and claims
2. Verify any unclear statements or promotional offers
3. Understand the target audience and messaging intent
4. Assess compliance with advertising standards
5. Keep the conversation professional and focused
6. If user asks to explain in native language, accommodate that request.
${taskQuestions}
Please conduct a brief compliance verification call.`;

    const data = {
      phone_number: "+91" + mobileNo,
      task: task,
      model: "enhanced",
      language: "en",
      voice: "d9559963-d372-42c0-b753-30f28b75e1ef",
      max_duration: 3, // 5 minutes
      answered_by_enabled: true,
      wait_for_greeting: false,
      record: true,
    };

    const response = await fetch("https://api.bland.ai/v1/calls", {
      method: "POST",
      headers: {
        Authorization: AUTH_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const callResult = await response.json();

    // Store call_id in call_logs table
    await supabase
      .from(callLogsTable)
      .update({
        external_call_id: callResult.call_id,
        status: 1, // in_call
      })
      .eq("advertisement_id", adDetails.advertisement_id);

    console.log("Call initiated:", callResult);

    pollCallStatus(callResult.call_id, adDetails.advertisement_id);
  } catch (error) {
    console.error("Error making compliance call:", error);

    // Mark call as failed and continue to report generation
    await supabase
      .from(callLogsTable)
      .update({
        status: 2, // completed with error
        execution_time: { call_failed: new Date().toISOString() },
      })
      .eq("advertisement_id", adDetails.advertisement_id);

    // Generate report with error status
    await generateComplianceReport(adDetails.advertisement_id, {
      verdict: "manual_review",
      reason: "Call setup failed - manual review required",
    });
  }
};

const handleCallCompletion = async (advertisementId) => {
  try {
    await supabase
      .from(callLogsTable)
      .update({
        status: 2,
        execution_time: { call_completed: new Date().toISOString() },
      })
      .eq("advertisement_id", advertisementId);

    await updateAnalysisStatus(advertisementId, 4, {
      call_completed: new Date().toISOString(),
    });

    setTimeout(async () => {
      await fetchCallTranscript(advertisementId);
    }, 240000);
  } catch (error) {
    console.error("Error handling call completion:", error);
  }
};

const fetchCallTranscript = async (advertisementId) => {
  try {
    const AUTH_TOKEN = process.env.BLAND_AUTH_TOKEN;

    // Get external call ID
    const { data: callData } = await supabase
      .from(callLogsTable)
      .select("external_call_id")
      .eq("advertisement_id", advertisementId)
      .single();

    if (!callData?.external_call_id) {
      throw new Error("No call ID found");
    }

    // Fetch transcript from Bland AI
    const response = await fetch(
      `https://api.bland.ai/v1/calls/${callData.external_call_id}`,
      {
        method: "GET",
        headers: {
          authorization: AUTH_TOKEN,
        },
      }
    );

    const transcriptData = await response.json();

    // Store transcript
    await supabase
      .from(callLogsTable)
      .update({
        transcript: transcriptData,
      })
      .eq("advertisement_id", advertisementId);

    await postCallCompliance(advertisementId, transcriptData);
  } catch (error) {
    console.error("Error fetching call transcript:", error);
  }
};

const postCallCompliance = async (advertisementId, transcript) => {
  try {
    console.log(
      `Template: Running post-call compliance for advertisement ${advertisementId}`
    );

    const { data: adData, error } = await supabase
      .from(advertisementTable)
      .select("*, users(*)")
      .eq("advertisement_id", advertisementId)
      .single();

    if (error) throw error;

    const mockResult = {
      verdict: "pass",
      reason: "Post-call analysis completed",
      confidence: 0.89,
    };

    await supabase
      .from(analysisResultsTable)
      .update({
        verdict: mockResult.verdict,
        reason: mockResult.reason,
        status: 5,
      })
      .eq("advertisement_id", advertisementId);

    const { data: analysisData } = await supabase
      .from(analysisResultsTable)
      .select("*")
      .eq("advertisement_id", advertisementId)
      .single();

    const initialComplianceResult =
      analysisData.report_data?.compliance_details || {};

    await generateComplianceReport(
      advertisementId,
      initialComplianceResult,
      mockResult
    );
  } catch (error) {
    console.error("Error in post-call compliance:", error);
  }
};

const generateComplianceReport = async (
  advertisementId,
  complianceResult,
  postCallResult = null
) => {
  try {
    const { data: adData, error } = await supabase
      .from(advertisementTable)
      .select("*, users(*)")
      .eq("advertisement_id", advertisementId)
      .single();

    if (error) throw error;

    const reportData = {
      advertisement_id: advertisementId,
      title: adData.title,
      initial_verdict: complianceResult.verdict,
      final_verdict: postCallResult
        ? postCallResult.verdict
        : complianceResult.verdict,
      reason: postCallResult ? postCallResult.reason : complianceResult.reason,
      compliance_check_details: complianceResult,
      post_call_details: postCallResult,
      generated_at: new Date().toISOString(),
    };

    await supabase
      .from(analysisResultsTable)
      .update({
        report_data: reportData,
        status: 6,
        updated_at: new Date().toISOString(),
      })
      .eq("advertisement_id", advertisementId);

    await createNotification(
      adData.user_id,
      "report_ready",
      `Your compliance report is ready for Ad: ${adData.title}`
    );

    console.log(`Report generated for advertisement ${advertisementId}`);
  } catch (error) {
    console.error("Error generating compliance report:", error);
  }
};

const getAdvertisementStatus = async (advertisementId, userId) => {
  try {
    const { data: adData, error: adError } = await supabase
      .from(advertisementTable)
      .select("*")
      .eq("advertisement_id", advertisementId)
      .eq("user_id", userId);

    if (adError || !adData) {
      throw new Error("Advertisement not found");
    }

    const { data: analysisData, error: analysisError } = await supabase
      .from(analysisResultsTable)
      .select("*")
      .eq("advertisement_id", advertisementId)
      .single();

    if (analysisError || !analysisData) {
      // Create default analysis entry if missing
      await supabase.from(analysisResultsTable).insert([
        {
          advertisement_id: advertisementId,
          user_id: userId,
          status: 0,
          execution_time: {},
        },
      ]);

      // Retry the query
      const { data: newAnalysisData } = await supabase
        .from(analysisResultsTable)
        .select("*")
        .eq("advertisement_id", advertisementId)
        .single();

      analysisData = newAnalysisData;
    }

    const statusMap = {
      0: "uploading",
      1: "compliance_in_progress",
      2: "got_doubts",
      3: "calling",
      4: "post_call_compliance",
      5: "generating_reports",
      6: "finished",
    };

    const stages = [
      {
        step: "upload",
        status: analysisData.status >= 1 ? "completed" : "pending",
      },
      {
        step: "media_processing",
        status: analysisData.status >= 1 ? "completed" : "pending",
      },
      {
        step: "compliance_check",
        status:
          analysisData.status >= 2
            ? "completed"
            : analysisData.status === 1
            ? "in_progress"
            : "pending",
      },
      {
        step: "call",
        status:
          analysisData.status >= 4
            ? "completed"
            : analysisData.status === 3
            ? "in_progress"
            : "pending",
      },
      {
        step: "report",
        status:
          analysisData.status === 6
            ? "completed"
            : analysisData.status === 5
            ? "in_progress"
            : "pending",
      },
    ];

    return {
      advertisement_id: advertisementId,
      current_status: statusMap[analysisData.status] || "unknown",
      stages: stages,
      last_updated: analysisData.updated_at,
    };
  } catch (error) {
    console.error("Error getting advertisement status:", error);
    throw new Error(error.message || "Failed to get advertisement status");
  }
};

const pollCallStatus = async (callId, advertisementId, maxAttempts = 60) => {
  const AUTH_TOKEN = process.env.BLAND_AUTH_TOKEN;
  let attempts = 0;

  const checkStatus = async () => {
    try {
      attempts++;

      const response = await fetch(`https://api.bland.ai/v1/calls/${callId}`, {
        method: "GET",
        headers: {
          authorization: AUTH_TOKEN,
        },
      });

      const callData = await response.json();

      if (callData.status === "completed" || callData.status === "ended") {
        console.log("Call completed, processing...");
        await handleCallCompletion(advertisementId);
        return;
      }

      if (attempts >= maxAttempts) {
        console.log("Call polling timeout, marking as completed");
        await handleCallCompletion(advertisementId);
        return;
      }

      // Continue polling every 10 seconds
      setTimeout(checkStatus, 10000);
    } catch (error) {
      console.error("Error polling call status:", error);
      if (attempts >= maxAttempts) {
        await handleCallCompletion(advertisementId);
      } else {
        setTimeout(checkStatus, 5000);
      }
    }
  };

  // Start polling after 10 seconds
  setTimeout(checkStatus, 300000);
};

const extractModalityResult = (modalityOutput) => {
  if (!modalityOutput) {
    return {
      compliant: true,
      violations: [],
      summary: "",
      risk_score: 0.0,
    };
  }

  // Extract violations from the modality output
  const violations = modalityOutput.violations || [];
  const compliant = violations.length === 0;
  const riskScore = modalityOutput.risk_score || 0.0;
  const summary = modalityOutput.summary || "";

  return {
    compliant,
    violations: violations.map((v) => ({
      policy_section: v.policy_section || "Unknown",
      violation: v.violation || "",
      confidence: v.confidence || 0.0,
      evidence: v.evidence || "",
    })),
    summary,
    risk_score: riskScore,
  };
};

const callLLMForCompliance = async (rawOutput, modalityResults) => {
  try {
    const prompt = `
You are an advertisement compliance expert. Analyze the following compliance check results and provide a final normalized decision JSON.

Raw Output: ${JSON.stringify(rawOutput, null, 2)}

Modality Results: ${JSON.stringify(modalityResults, null, 2)}

Respond ONLY with valid JSON in this exact format:
{
  "verdict": "pass" | "fail" | "manual_review" | "clarification_needed",
  "reason": "One line summary explaining the decision",
  "overall_risk_score": number,
  "modalities_summary": {
    "text": "short human-readable summary of text modality (max 1 line)",
    "image": "short human-readable summary of image modality",
    "audio": "short human-readable summary of audio modality",
    "video": "short human-readable summary of video modality",
    "link": "short human-readable summary of link modality"
  }
}

Rules:
- Do NOT restate violations or evidence from raw_output (already stored separately).
- Summaries should be concise, single-line, and suitable for frontend display.
- "overall_risk_score" can be the maximum or weighted average of modality risk_scores.
- If all modalities are compliant => verdict = "pass".
- If clear high-risk violations exist => verdict = "fail".
- If ambiguous edge cases => verdict = "clarification_needed".
- If errors or unusual inconsistencies => verdict = "manual_review".
`;

    const systemMessage =
      "You are an advertisement compliance expert. Always respond with valid JSON only.";
    const llmResponse = await callLLM(prompt, systemMessage, 1000);

    const parsedResponse = JSON.parse(llmResponse);

    // Validate required fields
    if (!parsedResponse.verdict || !parsedResponse.reason) {
      throw new Error("Invalid LLM response format");
    }

    return parsedResponse;
  } catch (error) {
    console.error("Error calling LLM for compliance:", error);

    // Fallback logic (same as before)
    const hasViolations = Object.values(modalityResults).some(
      (m) => !m.compliant
    );
    const highRisk = Object.values(modalityResults).some(
      (m) => m.risk_score > 0.7
    );
    const maxRiskScore = Math.max(
      ...Object.values(modalityResults).map((m) => m.risk_score)
    );

    if (!hasViolations) {
      return {
        verdict: "pass",
        reason: "All content complies with advertising policies",
        overall_risk_score: maxRiskScore,
        modalities_summary: {
          text: "No policy violations detected",
          image: "Content appears compliant",
          audio: "No issues found",
          video: "Compliant content",
          link: "Landing page appears safe",
        },
      };
    } else if (highRisk) {
      return {
        verdict: "fail",
        reason: "Significant policy violations detected",
        overall_risk_score: maxRiskScore,
        modalities_summary: {
          text: "Policy violations found",
          image: "Potentially non-compliant content",
          audio: "Issues detected",
          video: "Violations present",
          link: "Landing page concerns",
        },
      };
    } else {
      return {
        verdict: "manual_review",
        reason: "Error in automated analysis - manual review required",
        overall_risk_score: 0.5,
        modalities_summary: {
          text: "Analysis incomplete",
          image: "Review required",
          audio: "Manual check needed",
          video: "Assessment pending",
          link: "Verification needed",
        },
      };
    }
  }
};

const generateQueriesForCall = async (rawOutput, modalityResults) => {
  try {
    const prompt = `
You are an advertisement compliance expert conducting a clarification call. Based on the compliance analysis results below, generate 3-5 strategic questions to ask the advertiser to get clarity on unclear or potentially problematic content.

Raw Compliance Output: ${JSON.stringify(rawOutput, null, 2)}

Modality Analysis: ${JSON.stringify(modalityResults, null, 2)}

Generate questions that will help determine:
1. The true intent behind ambiguous content
2. Target audience clarification
3. Verification of claims made in the ad
4. Context behind flagged content
5. Business model and compliance awareness

Respond ONLY with valid JSON in this exact format:
[
  {
    "question": "Specific question to ask the advertiser",
    "reason": "Why this question is important for compliance assessment"
  },
  {
    "question": "Another strategic question",
    "reason": "Reason for asking this question"
  }
]

Requirements:
- Generate 3-5 questions maximum
- Questions should be professional and non-accusatory
- Focus on gathering context and intent, not just yes/no answers
- Prioritize questions about the highest risk content found
- Make questions conversational and natural for a phone call
`;

    const systemMessage =
      "You are an expert at conducting compliance clarification calls. Generate strategic questions that will reveal the true nature and intent of advertisement content.";

    const llmResponse = await callLLM(prompt, systemMessage, 800);
    const queries = JSON.parse(llmResponse);

    // Validate response format
    if (!Array.isArray(queries) || queries.length === 0) {
      throw new Error("Invalid LLM response format for queries");
    }

    // Ensure each query has required fields
    const validQueries = queries
      .filter((q) => q.question && q.reason)
      .slice(0, 5);

    if (validQueries.length === 0) {
      throw new Error("No valid queries generated");
    }

    return validQueries;
  } catch (error) {
    console.error("Error generating queries with LLM:", error);

    // Fallback to default questions
    const fallbackQueries = [
      {
        question:
          "Can you explain the main message and target audience for this advertisement?",
        reason:
          "Understanding intent and audience helps assess compliance context",
      },
      {
        question:
          "What specific claims are you making about your product or service?",
        reason: "Verifying accuracy and substantiation of advertising claims",
      },
      {
        question:
          "How do you ensure your advertising content meets industry standards?",
        reason: "Assessing advertiser's compliance awareness and processes",
      },
    ];

    // Add specific questions based on violations found
    Object.entries(modalityResults).forEach(([modality, result]) => {
      if (result.violations.length > 0) {
        fallbackQueries.push({
          question: `Can you provide more context about the ${modality} content in your advertisement?`,
          reason: `Clarification needed for potential ${modality} compliance issues`,
        });
      }
    });

    return fallbackQueries.slice(0, 5);
  }
};

const callLLM = async (
  prompt,
  systemMessage = "You are a helpful AI assistant.",
  maxTokens = 1000
) => {
  try {
    const isGemini = process.env.USE_GEMINI === "true";
    let llmResponse;

    if (isGemini) {
      // Gemini API call
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const fullPrompt = `${systemMessage}\n\n${prompt}`;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      llmResponse = response.text();
    } else {
      // OpenAI API call
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: maxTokens,
      });

      llmResponse = completion.choices[0].message.content;
    }

    // Clean response
    const cleanedResponse = llmResponse
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    return cleanedResponse;
  } catch (error) {
    console.error("Error calling LLM:", error);
    throw error;
  }
};

module.exports = {
  uploadAdvertisement,
  getAdvertisementStatus,
  handleComplianceResult,
  makeComplianceCall,
  fetchCallTranscript,
  postCallCompliance,
};
