const { supabase, supabaseService } = require("../config/config");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

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

  // 7. Trigger Compliance Check
  await triggerComplianceCheck(advertisementId, adData.user_id, mediaUrls, analysisResultsId);
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
    console.error("Error updating analysis status:", error);
    throw new Error("Failed to update analysis status");
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

const triggerComplianceCheck = async (advertisementId, userId, mediaUrls, analysisResultsId) => {
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

    setTimeout(async () => {
      try {
        const response = await axios.post(
          `${fastApiUrl}compliance/check`,
          payload,
          {
            timeout: 300000,
          }
        );

        await handleComplianceResult(advertisementId, response.data, analysisResultsId);
      } catch (error) {
        console.error("FastAPI compliance check failed:", error);
        await handleComplianceResult(advertisementId, {
          verdict: "manual_review",
          reason: "Compliance service error",
        }, analysisResultsId);
      }
    }, 1000);
  } catch (error) {
    console.error("Error triggering compliance check:", error);
    throw new Error("Failed to trigger compliance check");
  }
};

const handleComplianceResult = async (advertisementId, result, analysisResultsId) => {
  try {
    const { verdict, reason } = result;
    
    console.log(`Compliance result for ad ${advertisementId}: ${verdict} - ${reason}`);

    if (verdict === "pass") {
      await updateAnalysisStatus(advertisementId, 1, {
        compliance_completed: new Date().toISOString(),
      });

      await supabase
        .from(analysisResultsTable)
        .update({
          verdict: "pass",
          reason: reason || "Compliance check passed",
        })
        .eq("advertisement_id", advertisementId);

      console.log(`Ad ${advertisementId} passed compliance - generating report`);
      await generateComplianceReport(advertisementId, result);

    } else if (verdict === "fail") {
      await updateAnalysisStatus(advertisementId, 2, {
        compliance_completed: new Date().toISOString(),
      });

      await supabase
        .from(analysisResultsTable)
        .update({
          verdict: "fail",
          reason: reason || "Compliance violations detected",
        })
        .eq("advertisement_id", advertisementId);

      console.log(`Ad ${advertisementId} failed compliance - generating report`);
      await generateComplianceReport(advertisementId, result);

    } else if (verdict === "manual_review" || verdict === "doubts") {
      await updateAnalysisStatus(advertisementId, 2, {
        compliance_completed: new Date().toISOString(),
      });

      await supabase
        .from(analysisResultsTable)
        .update({
          verdict: "manual_review",
          reason: reason || "Manual review required",
        })
        .eq("advertisement_id", advertisementId);

      console.log(`Ad ${advertisementId} requires manual review - scheduling call`);
      
      // Get user ID for notification
      const { data: adData } = await supabase
        .from(advertisementTable)
        .select("user_id")
        .eq("advertisement_id", advertisementId)
        .single();

      await createNotification(
        adData.user_id,
        "call_scheduled",
        "Your ad requires clarification. A compliance call has been scheduled."
      );

      await scheduleComplianceCall(advertisementId, analysisResultsId);
      // DO NOT generate report here - only after call process completes
    }

  } catch (error) {
    console.error("Error handling compliance result:", error);
    
    try {
      // Get user ID for error notification
      const { data: adData } = await supabase
        .from(advertisementTable)
        .select("user_id")
        .eq("advertisement_id", advertisementId)
        .single();

      await updateAnalysisStatus(advertisementId, 6, {
        error_occurred: new Date().toISOString(),
      });

      await supabase
        .from(analysisResultsTable)
        .update({
          verdict: "error",
          reason: "Compliance processing failed - manual review required",
        })
        .eq("advertisement_id", advertisementId);

      await createNotification(
        adData.user_id,
        "compliance_error",
        "Compliance check failed. Your ad will be reviewed manually."
      );

      console.log(`Error in compliance for ad ${advertisementId} - marked for manual review`);

      // Generate error report
      await generateComplianceReport(advertisementId, {
        verdict: "error",
        reason: "Compliance processing failed - manual review required",
        error_details: error.message
      });

    } catch (notificationError) {
      console.error("Failed to create error notification:", notificationError);
    }
  }
};

const scheduleComplianceCall = async (advertisementId, analysisResultsId ) => {
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

    await makeComplianceCall(adData.users.mobile, adData.users.name, adData);
  } catch (error) {
    console.error("Error scheduling compliance call:", error);
  }
};

const makeComplianceCall = async (mobileNo, userName, adDetails) => {
  try {
    // const AUTH_TOKEN = process.env.BLAND_AUTH_TOKEN;
    if (!AUTH_TOKEN) {
      throw new Error("BLAND_AUTH_TOKEN not configured");
    }
    
    const task = `You are a compliance assistant helping verify advertisement content. The advertiser ${userName} has submitted an ad titled "${adDetails.title}" for review. Your task is to:
1. Ask clarifying questions about the advertisement content and claims
2. Verify any unclear statements or promotional offers
3. Understand the target audience and messaging intent
4. Assess compliance with advertising standards
5. Keep the conversation professional and focused
6. If user asks to explain in native language, accommodate that request.
Please conduct a brief compliance verification call.`;

    const data = {
      phone_number: "+91" + mobileNo,
      task: task,
      model: "enhanced", 
      language: "en",
      voice: "d9559963-d372-42c0-b753-30f28b75e1ef",
      max_duration: 5, // 5 minutes
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
        status: 1 // in_call
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
        execution_time: { call_failed: new Date().toISOString() }
      })
      .eq("advertisement_id", adDetails.advertisement_id);
    
    // Generate report with error status
    await generateComplianceReport(adDetails.advertisement_id, {
      verdict: "manual_review",
      reason: "Call setup failed - manual review required"
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
    const response = await fetch(`https://api.bland.ai/v1/calls/${callData.external_call_id}`, {
      method: "GET",
      headers: {
        authorization: AUTH_TOKEN,
      },
    });

    const transcriptData = await response.json();
    
    // Store transcript
    await supabase
      .from(callLogsTable)
      .update({
        transcript: transcriptData
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
    await supabase
        .from(analysisResultsTable)
        .insert([{
        advertisement_id: advertisementId,
        user_id: userId,
        status: 0,
        execution_time: {}
        }]);
    
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

module.exports = {
  uploadAdvertisement,
  getAdvertisementStatus,
  handleComplianceResult,
  makeComplianceCall,
  fetchCallTranscript,
  postCallCompliance,
};
