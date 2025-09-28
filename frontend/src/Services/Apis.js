// All the API endpoints will be declared here and then this will be used in entire frontend to access the endpoints...
const BaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/';
const FlaskURL = import.meta.env.VITE_FLASK_BASE_URL;

export const authEndpoints = {
  LOGIN_API: BaseURL + 'auth/login',
  LOGOUT_API: BaseURL + 'auth/logout', 
  REGISTER: BaseURL + 'auth/register',
  CHECK_USER: BaseURL + 'auth/check-user',
  SEND_OTP: BaseURL + 'auth/send-otp',
  RESEND_OTP: BaseURL + 'auth/resend-otp',
  VERIFY_OTP: BaseURL + 'auth/verify-otp',
  FORGOT_PASSWORD: BaseURL + 'auth/forgot-password',
  RESET_PASSWORD: BaseURL + 'auth/reset-password', // ADD THIS
};

export const accountEndpoints = {
  CURRENT_USER: { e: BaseURL + 'account/me', t: 'GET' },
  UPDATE_USER: { e: BaseURL + 'account/update', t: 'PUT' },
  USER_BY_ID: { e: BaseURL + 'account/user', t: 'GET'},
  CHANGE_PASSWORD: { e: BaseURL + 'account/change-password', t: 'POST' }, // Changed from PUT to POST
  DELETE_USER: { e: BaseURL + 'account/delete', t: 'DELETE' },
  ALL_USERS: { e: BaseURL + 'account/all', t: 'GET' }, // Changed from 'users' to 'all'
  VERIFY_EMAIL: { e: BaseURL + 'account/verify-email', t: 'POST' }, // ADD THIS
  ONBOARDING: { e: BaseURL + 'account/onboarding', t: 'POST' },
}

export const complianceEndpoints = {
  UPLOAD_AD: { e: BaseURL + 'ads/upload', t: 'POST' },
  GET_AD_STATUS: { e: BaseURL + 'ads', t: 'GET' }, // will append /{adId}/status
   GET_USER_REPORTS: { e: BaseURL + 'ads/my-reports', t: 'GET' },
  GET_ALL_REPORTS: { e: BaseURL + 'ads/all-reports', t: 'GET' },
  APPROVE_ADVERTISEMENT: { e: BaseURL + 'ads/approve', t: 'POST' }, // + /:analysisResultsId
  REJECT_ADVERTISEMENT: { e: BaseURL + 'ads/reject', t: 'POST' }, // + /:analysisResultsId
};

export const dashboardEndpoints = {
  // Admin endpoints
  ADMIN_STATS: { e: BaseURL + 'admin/stats', t: 'GET' },
  ADMIN_OVERVIEW: { e: BaseURL + 'admin/overview', t: 'GET' },
  ADMIN_ADS: { e: BaseURL + 'admin/ads', t: 'GET' },
  
  // User dashboard endpoints
  USER_OVERVIEW: { e: BaseURL + 'dashboard/user/overview', t: 'GET' },
  USER_ADS: { e: BaseURL + 'dashboard/user/ads', t: 'GET' },
  USER_NOTIFICATIONS: { e: BaseURL + 'dashboard/user/notifications', t: 'GET' },
  MARK_NOTIFICATION_READ: { e: BaseURL + 'dashboard/user/notifications', t: 'PUT' }, // + /:notification_id/read
};