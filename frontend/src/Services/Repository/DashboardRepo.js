import { toast } from "react-hot-toast";
import { apiConnector } from "../Connector";
import { dashboardEndpoints } from "../Apis";

const {
  ADMIN_STATS,
  ADMIN_OVERVIEW,
  ADMIN_ADS,
  USER_OVERVIEW,
  USER_ADS,
  USER_NOTIFICATIONS,
  MARK_NOTIFICATION_READ,
} = dashboardEndpoints;

// ==================== ADMIN FUNCTIONS ====================

// Get admin statistics
export async function getAdminStats() {
  const loadingToast = toast.loading("Fetching admin statistics...");
  try {
    const response = await apiConnector(ADMIN_STATS.t, ADMIN_STATS.e);

    console.log("Admin Stats API response: ", response);
    if (response.status === 200 && response.data) {
      toast.success("Admin statistics fetched successfully");
      return response.data;
    } else {
      throw new Error(response.data?.message || "Failed to fetch admin statistics");
    }
  } catch (error) {
    console.log("Admin Stats API Error:", error);
    toast.error(error.response?.data?.message || "Failed to fetch admin statistics");
    throw error;
  } finally {
    toast.dismiss(loadingToast);
  }
}

// Get admin overview
export async function getAdminOverview() {
  const loadingToast = toast.loading("Fetching admin overview...");
  try {
    const response = await apiConnector(ADMIN_OVERVIEW.t, ADMIN_OVERVIEW.e);

    console.log("Admin Overview API response: ", response);
    if (response.status === 200 && response.data) {
      toast.success("Admin overview fetched successfully");
      return response.data;
    } else {
      throw new Error(response.data?.message || "Failed to fetch admin overview");
    }
  } catch (error) {
    console.log("Admin Overview API Error:", error);
    toast.error(error.response?.data?.message || "Failed to fetch admin overview");
    throw error;
  } finally {
    toast.dismiss(loadingToast);
  }
}

// Get all advertisements (admin)
export async function getAdminAds() {
  const loadingToast = toast.loading("Fetching all advertisements...");
  try {
    const response = await apiConnector(ADMIN_ADS.t, ADMIN_ADS.e);

    console.log("Admin Ads API response: ", response);
    if (response.status === 200 && response.data) {
      toast.success("Advertisements fetched successfully");
      return response.data;
    } else {
      throw new Error(response.data?.message || "Failed to fetch advertisements");
    }
  } catch (error) {
    console.log("Admin Ads API Error:", error);
    toast.error(error.response?.data?.message || "Failed to fetch advertisements");
    throw error;
  } finally {
    toast.dismiss(loadingToast);
  }
}

// ==================== USER FUNCTIONS ====================

// Get user dashboard overview
export async function getUserOverview() {
  try {
    const response = await apiConnector(USER_OVERVIEW.t, USER_OVERVIEW.e);

    console.log("User Overview API response: ", response);
    if (response.status === 200 && response.data) {
      return response.data;
    } else {
      throw new Error(response.data?.message || "Failed to fetch user overview");
    }
  } catch (error) {
    console.log("User Overview API Error:", error);
    toast.error(error.response?.data?.message || "Failed to fetch dashboard data");
    throw error;
  }
}

// Get user advertisements
export async function getUserAds() {
  try {
    const response = await apiConnector(USER_ADS.t, USER_ADS.e);

    console.log("User Ads API response: ", response);
    if (response.status === 200 && response.data) {
      return response.data;
    } else {
      throw new Error(response.data?.message || "Failed to fetch user advertisements");
    }
  } catch (error) {
    console.log("User Ads API Error:", error);
    toast.error(error.response?.data?.message || "Failed to fetch your advertisements");
    throw error;
  }
}

// Get user notifications
export async function getUserNotifications() {
  try {
    const response = await apiConnector(USER_NOTIFICATIONS.t, USER_NOTIFICATIONS.e);

    console.log("User Notifications API response: ", response);
    if (response.status === 200 && response.data) {
      return response.data;
    } else {
      throw new Error(response.data?.message || "Failed to fetch notifications");
    }
  } catch (error) {
    console.log("User Notifications API Error:", error);
    toast.error(error.response?.data?.message || "Failed to fetch notifications");
    throw error;
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId) {
  try {
    const response = await apiConnector(
      MARK_NOTIFICATION_READ.t,
      `${MARK_NOTIFICATION_READ.e}/${notificationId}/read`
    );

    console.log("Mark Notification Read API response: ", response);
    if (response.status === 200 && response.data) {
      // Silent success - no toast for this action as it happens frequently
      return response.data;
    } else {
      throw new Error(response.data?.message || "Failed to mark notification as read");
    }
  } catch (error) {
    console.log("Mark Notification Read API Error:", error);
    // Silent error - no toast for this action
    throw error;
  }
}

// ==================== UTILITY FUNCTIONS ====================

// Get dashboard data for current user (combines overview, ads, notifications)
export async function getDashboardData() {
  const loadingToast = toast.loading("Loading dashboard...");
  try {
    const [overview, ads, notifications] = await Promise.all([
      getUserOverview(),
      getUserAds(),
      getUserNotifications()
    ]);

    toast.success("Dashboard loaded successfully");
    return {
      overview: overview.data,
      ads: ads,
      notifications: notifications
    };
  } catch (error) {
    console.log("Dashboard Data Error:", error);
    toast.error("Failed to load dashboard data");
    throw error;
  } finally {
    toast.dismiss(loadingToast);
  }
}

// Get complete admin dashboard data
export async function getAdminDashboardData() {
  const loadingToast = toast.loading("Loading admin dashboard...");
  try {
    const [stats, overview, ads] = await Promise.all([
      getAdminStats(),
      getAdminOverview(),
      getAdminAds()
    ]);

    toast.success("Admin dashboard loaded successfully");
    return {
      stats: stats.data,
      overview: overview.data,
      ads: ads
    };
  } catch (error) {
    console.log("Admin Dashboard Data Error:", error);
    toast.error("Failed to load admin dashboard data");
    throw error;
  } finally {
    toast.dismiss(loadingToast);
  }
}

// ==================== NOTIFICATION HELPERS ====================

// Mark multiple notifications as read
export async function markMultipleNotificationsAsRead(notificationIds) {
  try {
    const promises = notificationIds.map(id => markNotificationAsRead(id));
    await Promise.all(promises);
    return true;
  } catch (error) {
    console.log("Mark Multiple Notifications Read Error:", error);
    throw error;
  }
}

// Get unread notification count
export function getUnreadNotificationCount(notifications) {
  return notifications.filter(notification => !notification.is_read).length;
}

// Group notifications by type
export function groupNotificationsByType(notifications) {
  return notifications.reduce((acc, notification) => {
    if (!acc[notification.type]) {
      acc[notification.type] = [];
    }
    acc[notification.type].push(notification);
    return acc;
  }, {});
}

// Get recent notifications (last 24 hours)
export function getRecentNotifications(notifications, hours = 24) {
  const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
  return notifications.filter(notification => 
    new Date(notification.created_at) > cutoffTime
  );
}

// ==================== AD STATUS HELPERS ====================

// Get ad status summary
export function getAdStatusSummary(ads) {
  const summary = {
    total: ads.length,
    pending: 0,
    passed: 0,
    failed: 0,
    manual_review: 0,
    error: 0
  };

  ads.forEach(ad => {
    const verdict = ad.analysis_results?.[0]?.verdict;
    switch (verdict) {
      case 'pass':
        summary.passed++;
        break;
      case 'fail':
        summary.failed++;
        break;
      case 'manual_review':
        summary.manual_review++;
        break;
      case null:
      case undefined:
        summary.pending++;
        break;
      default:
        summary.error++;
    }
  });

  return summary;
}

// Get ads by status
export function getAdsByStatus(ads, status) {
  return ads.filter(ad => {
    const verdict = ad.analysis_results?.[0]?.verdict;
    switch (status) {
      case 'pending':
        return verdict === null || verdict === undefined;
      case 'passed':
        return verdict === 'pass';
      case 'failed':
        return verdict === 'fail';
      case 'manual_review':
        return verdict === 'manual_review';
      default:
        return false;
    }
  });
}