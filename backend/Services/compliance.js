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
      .select("analysis_results_id")
      .single();

    if (analysisError) {
      // If analysis entry fails, cleanup advertisement entry
      await supabase
        .from(advertisementTable)
        .delete()
        .eq("advertisement_id", advertisementId);
      throw analysisError;
    }

    const analysisResultsId = analysisResultsData.analysis_results_id;

    // Fire and forget the async processing
    asyncProcessExecutor(
      advertisementId,
      adData,
      files,
      analysisResultsId
    ).catch((error) => {
      console.error("Unhandled error in asyncProcessExecutor:", error);
    });

    return { advertisement_id: advertisementId };
  } catch (error) {
    console.error("Error in uploadAdvertisement:", error);
    throw new Error(error.message || "Failed to upload advertisement");
  }
};

const asyncProcessExecutor = async (
  advertisementId,
  adData,
  files,
  analysisResultsId
) => {
  try {
    if (!adData.user_id || !advertisementId) {
      throw new Error("Missing required advertisement data");
    }

    await createNotification(
      adData.user_id,
      "processing_started",
      `Processing started for your ad: ${adData.title}`
    );

    await updateAnalysisStatus(advertisementId, 0, {
      media_upload_started: new Date().toISOString(),
    });

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

    await updateAnalysisStatus(advertisementId, 1, {
      media_upload_completed: new Date().toISOString(),
      compliance_check_started: new Date().toISOString(),
    });

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
    const verdict = complianceResult.compliance_results.verdict;
    const makeCall = complianceResult.compliance_results.make_call;

    if (verdict === "clarification_needed" && makeCall === true) {
      await createNotification(
        adData.user_id,
        "call_scheduled",
        "Your ad requires clarification. A compliance call has been scheduled."
      );

      // Sequential call process
      await scheduleComplianceCall(
        advertisementId,
        analysisResultsId,
        complianceResult.compliance_results.queries_for_call
      );

      await waitForCallCompletion(advertisementId);
      const trainscript = await fetchCallTranscript(advertisementId);
      const postCallResult = await postCallCompliance(
        advertisementId,
        complianceResult.compliance_results, trainscript
      );
      await updateAnalysisStatus(advertisementId, 5, {
        call_process_completed: new Date().toISOString(),
        report_generation_started: new Date().toISOString(),
      });
      await generateComplianceReport(
        advertisementId,
        complianceResult.compliance_results,
        postCallResult
      );
    } else if (
      verdict === "pass" ||
      verdict === "fail" ||
      verdict === "manual_review"
    ) {
      await updateAnalysisStatus(advertisementId, 5, {
        compliance_check_completed: new Date().toISOString(),
        report_generation_started: new Date().toISOString(),
      });
      // Direct to report generation
      await generateComplianceReport(
        advertisementId,
        complianceResult.compliance_results
      );
    } else if (
      complianceResult.compliance_results.verdict === "manual_review"
    ) {
      await updateAnalysisStatus(advertisementId, 6, {
        report_generation_completed: new Date().toISOString(),
        processing_completed: new Date().toISOString(),
      });

      await createNotification(
        adData.user_id,
        "processing_completed",
        `Processing completed for your ad: ${adData.title}. Report is ready.`
      );

      await generateComplianceReport(
        advertisementId,
        complianceResult.compliance_results
      );
    }

    console.log(`Processing completed for advertisement ${advertisementId}`);
  } catch (error) {
    console.error("Error in asyncProcessExecutor:", error);

    await updateAnalysisStatus(advertisementId, 6, {
      error_occurred: new Date().toISOString(),
    });

    await createNotification(
      adData.user_id,
      "processing_error",
      `Processing failed for your ad: ${adData.title}. Manual review required.`
    );

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

      // Cleanup local file
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupError) {
        console.error("Failed to cleanup file:", cleanupError);
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
      return; // success
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
    // await updateAnalysisStatus(advertisementId, 1, {
    //   compliance_started: new Date().toISOString(),
    // });

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
        timeout: 3000000,
      }
    );

    const fastApiOutput = response.data;

    // SAVE FASTAPI RESPONSE IMMEDIATELY
    await supabase
      .from(analysisResultsTable)
      .update({
        compliance_result: fastApiOutput,
        call_required: fastApiOutput.compliance_results?.make_call || false,
        status: 1, // compliance completed
        execution_time: {
          compliance_completed: new Date().toISOString(),
        },
      })
      .eq("advertisement_id", advertisementId);

    return fastApiOutput;
  } catch (error) {
    console.error("FastAPI compliance check failed:", error);

    // Save error in compliance_result
    const errorResult = {
      error: true,
      message: "Compliance service error",
      timestamp: new Date().toISOString(),
    };

    await supabase
      .from(analysisResultsTable)
      .update({
        compliance_result: errorResult,
        call_required: false,
        status: 1,
        verdict: "manual_review",
        reason: "Compliance service error",
      })
      .eq("advertisement_id", advertisementId);

    return errorResult;
  }
};

const handleComplianceResult = async (rawOutput, advertisementId) => {
  try {
    // Since we already saved rawOutput in triggerComplianceCheck, just process it
    if (rawOutput.error) {
      return {
        raw_output: rawOutput,
        compliance_results: {
          advertisement_id: advertisementId,
          verdict: "manual_review",
          reason: rawOutput.message || "Compliance service error",
          make_call: false,
        },
      };
    }

    if (rawOutput.compliance_results) {
      return {
        raw_output: rawOutput,
        compliance_results: {
          ...rawOutput.compliance_results,
          advertisement_id: advertisementId,
        },
      };
    }

    // Fallback for old format
    return {
      raw_output: rawOutput,
      compliance_results: {
        advertisement_id: advertisementId,
        verdict: "manual_review",
        reason: "Invalid response format",
        make_call: false,
      },
    };
  } catch (error) {
    console.error("Error in handleComplianceResult:", error);
    return {
      raw_output: rawOutput,
      compliance_results: {
        advertisement_id: advertisementId,
        verdict: "manual_review",
        reason: "Error processing compliance results",
        make_call: false,
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

    // await updateAnalysisStatus(advertisementId, 3, {
    //   call_scheduled: new Date().toISOString(),
    // });

    // Make the compliance call
    await makeComplianceCall(
      adData.users.mobile,
      adData.users.name,
      adData,
      queriesForCall
    );
  } catch (error) {
    console.error("Error scheduling compliance call:", error);
    throw error;
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
      max_duration: 3,
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

    return callResult;
  } catch (error) {
    console.error("Error making compliance call:", error);

    // Mark call as failed
    await supabase
      .from(callLogsTable)
      .update({
        status: 2, // completed with error
        execution_time: { call_failed: new Date().toISOString() },
      })
      .eq("advertisement_id", adDetails.advertisement_id);

    throw error;
  }
};

const waitForCallCompletion = async (advertisementId) => {
  return new Promise(async (resolve, reject) => {
    const AUTH_TOKEN = process.env.BLAND_AUTH_TOKEN;
    let attempts = 0;
    const maxAttempts = 60;

    const checkStatus = async () => {
      try {
        attempts++;

        // Get external call ID
        const { data: callData } = await supabase
          .from(callLogsTable)
          .select("external_call_id")
          .eq("advertisement_id", advertisementId)
          .single();

        if (!callData?.external_call_id) {
          throw new Error("No call ID found");
        }

        const response = await fetch(
          `https://api.bland.ai/v1/calls/${callData.external_call_id}`,
          {
            method: "GET",
            headers: {
              authorization: AUTH_TOKEN,
            },
          }
        );

        const callStatus = await response.json();

        if (
          callStatus.status === "completed" ||
          callStatus.status === "ended"
        ) {
          console.log("Call completed");

          // Update call status
          await supabase
            .from(callLogsTable)
            .update({
              status: 2,
              execution_time: { call_completed: new Date().toISOString() },
            })
            .eq("advertisement_id", advertisementId);

          // await updateAnalysisStatus(advertisementId, 4, {
          //   call_completed: new Date().toISOString(),
          // });

          resolve();
          return;
        }

        if (attempts >= maxAttempts) {
          console.log("Call polling timeout");

          // Mark as completed anyway
          await supabase
            .from(callLogsTable)
            .update({
              status: 2,
              execution_time: { call_timeout: new Date().toISOString() },
            })
            .eq("advertisement_id", advertisementId);

          resolve();
          return;
        }

        // Continue polling
        setTimeout(checkStatus, 10000);
      } catch (error) {
        console.error("Error polling call status:", error);
        if (attempts >= maxAttempts) {
          resolve(); // Don't fail the entire process
        } else {
          setTimeout(checkStatus, 5000);
        }
      }
    };

    // Start polling after 10 seconds
    setTimeout(checkStatus, 10000);
  });
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

    // Wait a bit for transcript to be ready
    await new Promise((resolve) => setTimeout(resolve, 30000));

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

    return transcriptData;
  } catch (error) {
    console.error("Error fetching call transcript:", error);
    return null;
  }
};

const postCallCompliance = async (advertisementId, complianceResults, transcript) => {
  try {
    console.log(`Running post-call compliance for advertisement ${advertisementId}`);


    // NEW: Call FastAPI pcc-analysis endpoint
    const pccPayload = {
      compliance_results: complianceResults,
      transcript: transcript
    };

    const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000";
    
    const pccResponse = await axios.post(
      `${fastApiUrl}compliance/pcc-analysis`,
      pccPayload,
      { timeout: 120000 }
    );

    const pccAnalysis = pccResponse.data;

    // Store PCC analysis in call_logs
    await supabase
      .from(callLogsTable)
      .update({
        pcc_analysis: pccAnalysis
      })
      .eq("advertisement_id", advertisementId);

    return {
      verdict: pccAnalysis.pcc_verdict,
      reason: pccAnalysis.pcc_reason,
      pcc_data: pccAnalysis
    };

  } catch (error) {
    console.error("Error in post-call compliance:", error);
    return {
      verdict: "manual_review",
      reason: "Post-call analysis failed",
      pcc_data: null,
      error: error.message
    };
  }
};

const generateComplianceReport = async (advertisementId, complianceResult, postCallResult = null) => {
  try {
    const { data: adData } = await supabase
      .from(advertisementTable)
      .select("title, user_id")
      .eq("advertisement_id", advertisementId)
      .single();

    // Get raw_output from analysis_results for both cases
    const { data: analysisData } = await supabase
      .from(analysisResultsTable)
      .select("compliance_result")
      .eq("advertisement_id", advertisementId)
      .single();

    let reportPayload;

    if (postCallResult) {
      // CASE 1: Call was made - include pcc_analysis
      reportPayload = {
        compliance_results: complianceResult,
        raw_output: analysisData?.compliance_result || {},
        pcc_analysis: postCallResult.pcc_data
      };
    } else {
      // CASE 2: No call made - pcc_analysis is null
      reportPayload = {
        compliance_results: complianceResult,
        raw_output: analysisData?.compliance_result || {},
        pcc_analysis: null
      };
    }

    const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000";
    
    const reportResponse = await axios.post(
      `${fastApiUrl}compliance/generate-report`,
      reportPayload,
      { timeout: 120000 }
    );

    const finalReport = reportResponse.data;

    // Update with FastAPI response for both cases
    await supabase
      .from(analysisResultsTable)
      .update({
        verdict: finalReport.final_verdict,
        reason: finalReport.final_reason,
        report_data: finalReport,
        status: 6
      })
      .eq("advertisement_id", advertisementId);

    await updateAnalysisStatus(advertisementId, 6, {
      report_generation_completed: new Date().toISOString(),
      processing_completed: new Date().toISOString(),
    });

    await createNotification(
      adData.user_id,
      "processing_completed",
      `Processing completed for your ad: ${adData.title}. Report is ready.`
    );

    await createNotification(
      adData.user_id,
      "report_ready",
      `Your compliance report is ready for Ad: ${adData.title}`
    );

  } catch (error) {
    console.error("Error generating compliance report:", error);
    
    // Fallback report
    await supabase
      .from(analysisResultsTable)
      .update({
        report_data: {
          advertisement_id: advertisementId,
          final_verdict: "error",
          final_reason: "Report generation failed",
          generated_at: new Date().toISOString(),
          error: error.message
        },
        status: 6
      })
      .eq("advertisement_id", advertisementId);
  }
};

const getAdvertisementStatus = async (advertisementId, userId) => {
  try {
    const { data: adData, error: adError } = await supabase
      .from(advertisementTable)
      .select("*")
      .eq("advertisement_id", advertisementId)
      .eq("user_id", userId)
      .single();

    if (adError || !adData) {
      throw new Error("Advertisement not found or access denied");
    }

    let analysisData;
    const { data: fetchedAnalysisData, error: analysisError } = await supabase
      .from(analysisResultsTable)
      .select("*")
      .eq("advertisement_id", advertisementId)
      .single();

    if (analysisError || !fetchedAnalysisData) {
      // Create default analysis entry if missing
      const { data: newEntry, error: insertError } = await supabase
        .from(analysisResultsTable)
        .insert([
          {
            advertisement_id: advertisementId,
            user_id: userId,
            status: 0,
            execution_time: {},
          },
        ])
        .select("*")
        .single();

      if (insertError) throw insertError;
      analysisData = newEntry;
    } else {
      analysisData = fetchedAnalysisData;
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

const extractModalityResult = (modalityOutput) => {
  if (!modalityOutput) {
    return {
      compliant: true,
      violations: [],
      summary: "",
      risk_score: 0.0,
    };
  }

  // NEW: Handle if modality data is already processed
  if (modalityOutput.compliant !== undefined) {
    return modalityOutput;
  }

  // OLD: Extract violations from the modality output (fallback)
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

module.exports = {
  uploadAdvertisement,
  getAdvertisementStatus,
  handleComplianceResult,
  makeComplianceCall,
  fetchCallTranscript,
  postCallCompliance,
};
