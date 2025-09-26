import { toast } from 'react-hot-toast';
import { apiConnector } from '../Connector';
import { complianceEndpoints } from "../Apis";

const { UPLOAD_AD, GET_AD_STATUS } = complianceEndpoints;

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
      if (
        status.current_status === "compliance_completed" ||
        status.current_status === "compliance_failed"
      ) {
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
