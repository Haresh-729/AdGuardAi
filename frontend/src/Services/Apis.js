// All the API endpoints will be declared here and then this will be used in entire frontend to access the endpoints...
const BaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/';
const FlaskURL = import.meta.env.VITE_FLASK_BASE_URL;

export const authEndpoints = {
  LOGIN_API: BaseURL + 'auth/login',
  LOGOUT_API: BaseURL + 'auth/logout',
  REGISTER: BaseURL + 'auth/register',
  GOOGLE_SIGN_IN: BaseURL + 'auth/sign-in-google',
  CHECK_USER: BaseURL + 'auth/check-user',
  SEND_OTP: BaseURL + 'auth/send-otp',
  RESEND_OTP: BaseURL + 'auth/resend-otp',
  VERIFY_OTP: BaseURL + 'auth/verify-otp',
  FORGOT_PASSWORD: BaseURL + 'auth/forgot-password',
};

export const accountEndpoints = {
  CURRENT_USER: { e: BaseURL + 'account/me', t: 'GET' },
  UPDATE_USER: { e: BaseURL + 'account/update', t: 'PUT' }, // param id  
  USER_BY_ID: { e: BaseURL + 'account/user', t: 'GET'}, // param id
  CHANGE_PASSWORD: { e: BaseURL + 'account/change-password', t: 'PUT' },
  DELETE_USER: { e: BaseURL + 'account/delete', t: 'DELETE' }, // param id
  USER_CREDITS: { e: BaseURL + 'account/credits', t: 'GET' }, // param id
  ALL_USERS: { e: BaseURL + 'account/users', t: 'GET' }, // admin only
  UPDATE_CREDITS: { e: BaseURL + 'account/credits/update', t: 'PUT' }, // admin only
  MANUALLY_VERIFY_EMAIL: { e: BaseURL + 'account/verify-email', t: 'POST' }, // admin only
  USER_ACTIVITY: { e: BaseURL + 'account/activity', t: 'GET' }, // param id
  ONBOARDING: { e: BaseURL + 'account/onboarding', t: 'POST' },
}