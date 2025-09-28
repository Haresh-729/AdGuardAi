import { toast } from "react-hot-toast";
import { apiConnector } from "../Connector";
import { complianceEndpoints } from "../Apis";

const { UPLOAD_AD, GET_AD_STATUS, GET_USER_REPORTS,
  GET_ALL_REPORTS,
  APPROVE_ADVERTISEMENT,
  REJECT_ADVERTISEMENT, } = complianceEndpoints;

export async function uploadAdvertisement(formData) {
  const loadingToast = toast.loading("Uploading advertisement...");
  try {
    const response = await apiConnector(UPLOAD_AD.t, UPLOAD_AD.e, formData, {
      "Content-Type": "multipart/form-data",
    });

    console.log("Upload Ad API response:", response);
    if (response.status === 201 && response.data.success) {
      toast.success("Advertisement uploaded successfully!");
      return response.data;
    } else {
      throw new Error(
        response.data?.message || "Failed to upload advertisement"
      );
    }
  } catch (error) {
    console.log("Upload Ad API Error:", error);
    toast.error(
      error.response?.data?.message || "Failed to upload advertisement"
    );
    throw error;
  } finally {
    toast.dismiss(loadingToast);
  }
}

// Get advertisement compliance status
export async function getAdStatus(adId) {
  try {
    const response = await apiConnector(
      GET_AD_STATUS.t,
      `${GET_AD_STATUS.e}/${adId}/status`,
      null
    );

    console.log("Get Ad Status API response:", response);
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(response.data?.message || "Failed to fetch ad status");
    }
  } catch (error) {
    console.log("Get Ad Status API Error:", error);
    toast.error(error.response?.data?.message || "Failed to fetch ad status");
    throw error;
  }
}

// Poll ad status with interval
export function pollAdStatus(adId, onStatusUpdate, interval = 5000) {
  let pollInterval;

  const poll = async () => {
    try {
      const status = await getAdStatus(adId);
      onStatusUpdate(status);

      // Stop polling if compliance is complete or failed
      if (status.processing_completed || status.processing_failed) {
        clearInterval(pollInterval);
      }
    } catch (error) {
      console.error("Polling error:", error);
      clearInterval(pollInterval);
    }
  };

  pollInterval = setInterval(poll, interval);
  poll(); // Initial call

  return () => clearInterval(pollInterval);
}


// Get current user's reports
export async function getUserReports() {
  const loadingToast = toast.loading("Fetching your reports...");
  try {
    const response = await apiConnector(GET_USER_REPORTS.t, GET_USER_REPORTS.e);

    console.log("Get User Reports API response : ", response);
    if (response.status === 200 && response.data) {
      toast.success("Reports fetched successfully");
      return response.data;
    } else {
      throw new Error(response.data?.message || "Failed to fetch reports");
    }
  } catch (error) {
    console.log("Get User Reports API Error....", error);
    toast.error(error.response?.data?.message || "Failed to fetch reports");
    throw error;
  } finally {
    toast.dismiss(loadingToast);
  }
}

// Get all reports (admin only)
export async function getAllReports() {
  const loadingToast = toast.loading("Fetching all reports...");
  try {
    const response = await apiConnector(GET_ALL_REPORTS.t, GET_ALL_REPORTS.e);

    console.log("Get All Reports API response : ", response);
    if (response.status === 200 && response.data) {
      toast.success("All reports fetched successfully");
      return response.data;
    } else {
      throw new Error(response.data?.message || "Failed to fetch all reports");
    }
  } catch (error) {
    console.log("Get All Reports API Error....", error);
    toast.error(error.response?.data?.message || "Failed to fetch all reports");
    throw error;
  } finally {
    toast.dismiss(loadingToast);
  }
}

// Approve advertisement (admin only)
export async function approveAdvertisement(analysisResultsId, reason = null) {
  const loadingToast = toast.loading("Approving advertisement...");
  try {
    const requestBody = reason ? { reason } : {};
    
    const response = await apiConnector(
      APPROVE_ADVERTISEMENT.t,
      `${APPROVE_ADVERTISEMENT.e}/${analysisResultsId}`,
      requestBody
    );

    console.log("Approve Advertisement API response : ", response);
    if (response.status === 200 && response.data) {
      toast.success("Advertisement approved successfully");
      return response.data;
    } else {
      throw new Error(response.data?.message || "Failed to approve advertisement");
    }
  } catch (error) {
    console.log("Approve Advertisement API Error....", error);
    toast.error(error.response?.data?.message || "Failed to approve advertisement");
    throw error;
  } finally {
    toast.dismiss(loadingToast);
  }
}

// Reject advertisement (admin only)
export async function rejectAdvertisement(analysisResultsId, reason = null) {
  const loadingToast = toast.loading("Rejecting advertisement...");
  try {
    const requestBody = reason ? { reason } : {};
    
    const response = await apiConnector(
      REJECT_ADVERTISEMENT.t,
      `${REJECT_ADVERTISEMENT.e}/${analysisResultsId}`,
      requestBody
    );

    console.log("Reject Advertisement API response : ", response);
    if (response.status === 200 && response.data) {
      toast.success("Advertisement rejected successfully");
      return response.data;
    } else {
      throw new Error(response.data?.message || "Failed to reject advertisement");
    }
  } catch (error) {
    console.log("Reject Advertisement API Error....", error);
    toast.error(error.response?.data?.message || "Failed to reject advertisement");
    throw error;
  } finally {
    toast.dismiss(loadingToast);
  }
}

// Get advertisement with detailed compliance report (convenience function)
export async function getAdvertisementReport(adId) {
  try {
    const statusData = await getAdvertisementStatus(adId);
    return statusData;
  } catch (error) {
    console.error("Failed to get advertisement report:", error);
    throw error;
  }
}

// Batch operations for admin (convenience functions)
export async function batchApproveAdvertisements(analysisResultsIds, reason = null) {
  const results = [];
  const loadingToast = toast.loading(`Approving ${analysisResultsIds.length} advertisements...`);
  
  try {
    for (const id of analysisResultsIds) {
      try {
        const result = await approveAdvertisement(id, reason);
        results.push({ id, success: true, data: result });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    if (successCount > 0) {
      toast.success(`Successfully approved ${successCount} advertisement(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to approve ${failCount} advertisement(s)`);
    }
    
    return results;
  } catch (error) {
    console.error("Batch approve error:", error);
    toast.error("Batch approval failed");
    throw error;
  } finally {
    toast.dismiss(loadingToast);
  }
}

export async function batchRejectAdvertisements(analysisResultsIds, reason = null) {
  const results = [];
  const loadingToast = toast.loading(`Rejecting ${analysisResultsIds.length} advertisements...`);
  
  try {
    for (const id of analysisResultsIds) {
      try {
        const result = await rejectAdvertisement(id, reason);
        results.push({ id, success: true, data: result });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    if (successCount > 0) {
      toast.success(`Successfully rejected ${successCount} advertisement(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to reject ${failCount} advertisement(s)`);
    }
    
    return results;
  } catch (error) {
    console.error("Batch reject error:", error);
    toast.error("Batch rejection failed");
    throw error;
  } finally {
    toast.dismiss(loadingToast);
  }
}
