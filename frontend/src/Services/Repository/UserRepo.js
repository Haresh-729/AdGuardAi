import { toast } from 'react-hot-toast';
import { apiConnector } from '../Connector';
import {
  setAccount,
  setAccountAfterRegister,
  setDFeature,
} from '../../App/DashboardSlice';
import { authEndpoints } from '../Apis';

const { 
  LOGIN_API, 
  LOGOUT_API,
  REGISTER, 
  GOOGLE_SIGN_IN,
  CHECK_USER,
  SEND_OTP,
  RESEND_OTP,
  VERIFY_OTP,
  FORGOT_PASSWORD,
} = authEndpoints;

// Check if user exists
export function checkUser(email) {
  return async (dispatch) => {
    try {
      const response = await apiConnector('POST', CHECK_USER, { email });
      console.log('Check User API response : ', response);
      return response.data;
    } catch (error) {
      console.log('Check User API Error....', error);
      toast.error(error.response?.data?.message || 'Failed to check user');
      throw error;
    }
  };
}

// Login function
export function login(email, password, navigate) {
  return async (dispatch) => {
    const loadingToast = toast.loading("Signing you in...");
    try {
      const response = await apiConnector("POST", LOGIN_API, { email, password });

      console.log("Login API response : ", response);
      
      if (response.data.login_flag) {
        toast.success("Login Successful!");
        
        // Create account object matching your API response
        const accountData = {
          id: response.data.user.u_id,
          uname: response.data.user.name,
          uemail: response.data.user.email,
          token: response.data.token,
          profile_url: response.data.user.profile_url,
          role: "user", // Default role, adjust based on your needs
          role_id: 1, // Default role_id, adjust based on your needs
          is_new: response.data.isFirstTime
        };
        
        dispatch(setAccount(accountData));
        
        // Navigate based on first time user
        if (response.data.isFirstTime) {
          navigate("/onboard");
        } else {
          dispatch(setDFeature({ dashboardFeature: "Home" }));
          navigate("/dashboard");
        }
      } else if (response.data.exists_flag === false) {
        // User doesn't exist, suggest registration
        toast.error("Account not found. Please register first.");
        // Optionally return a flag to show register form
        return { shouldShowRegister: true };
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      console.log("Login API Error....", error);
      
      // Check if it's a 401 (invalid credentials) or 404 (user not found)
      if (error.response?.status === 404) {
        toast.error("Account not found. Please register first.");
        return { shouldShowRegister: true };
      } else if (error.response?.status === 401) {
        toast.error("Invalid email or password");
      } else {
        toast.error(error.response?.data?.message || "Login failed");
      }
    } finally {
      toast.dismiss(loadingToast);
    }
  };
}

// Register function
export function register(name, email, password, occupation, navigate) {
  return async (dispatch) => {
    const loadingToast = toast.loading("Creating your account...");
    try {
      const response = await apiConnector("POST", REGISTER, {
        name,
        email,
        password,
        occupation
      });
      
      console.log("Register API response : ", response);
      
      if (response.data.success) {
        toast.success("Registration successful! Please verify your email.");
        
        // Store temporary account data for verification
        const tempAccountData = {
          id: response.data.u_id,
          uname: name,
          uemail: email
        };
        
        dispatch(setAccountAfterRegister(tempAccountData));
        
        // Navigate to email verification with email in state
        navigate("/verify-email", { 
          state: { 
            email: email, 
            type: "email-verification" 
          } 
        });
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.log("Register API Error....", error);
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      toast.dismiss(loadingToast);
    }
  };
}

// Send OTP for email verification (if needed separately)
export function sendOTP(email) {
  return async (dispatch) => {
    const loadingToast = toast.loading('Sending OTP...');
    try {
      const response = await apiConnector('POST', SEND_OTP, { email });
      console.log('Send OTP API response : ', response);
      
      if (response.data.success) {
        toast.success('OTP sent successfully!');
        return response.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.log('Send OTP API Error....', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP');
      throw error;
    } finally {
      toast.dismiss(loadingToast);
    }
  };
}

// Resend OTP
export function resendOTP(email) {
  return async (dispatch) => {
    const loadingToast = toast.loading('Resending OTP...');
    try {
      const response = await apiConnector('POST', RESEND_OTP, { email });
      console.log('Resend OTP API response : ', response);
      
      if (response.data.success) {
        toast.success('OTP resent successfully!');
        return response.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.log('Resend OTP API Error....', error);
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
      throw error;
    } finally {
      toast.dismiss(loadingToast);
    }
  };
}

// Verify OTP
export function verifyOTP(email, otp, navigate) {
  return async (dispatch) => {
    const loadingToast = toast.loading('Verifying OTP...');
    try {
      const response = await apiConnector('POST', VERIFY_OTP, { email, otp });
      console.log('Verify OTP API response : ', response);
      
      if (response.data.verified) {
        toast.success('Email verified successfully!');
        navigate('/login');
        setTimeout(() => {
          toast('Please login with your credentials');
        }, 1000);
        return response.data;
      } else {
        throw new Error(response.data.message || 'OTP verification failed');
      }
    } catch (error) {
      console.log('Verify OTP API Error....', error);
      toast.error(error.response?.data?.message || 'Invalid OTP. Please try again.');
      throw error;
    } finally {
      toast.dismiss(loadingToast);
    }
  };
}

// Forgot password (if you implement it)
export function forgotPassword(email) {
  return async (dispatch) => {
    const loadingToast = toast.loading('Sending password reset OTP...');
    try {
      const response = await apiConnector('POST', FORGOT_PASSWORD, { email });
      console.log('Forgot Password API response : ', response);
      
      if (response.data.success) {
        toast.success('Password reset OTP sent to your email!');
        return response.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.log('Forgot Password API Error....', error);
      toast.error(error.response?.data?.message || 'Failed to send reset OTP');
      throw error;
    } finally {
      toast.dismiss(loadingToast);
    }
  };
}

// Logout function
export function logout(navigate) {
  return async (dispatch) => {
    const loadingToast = toast.loading('Signing you out...');
    try {
      const response = await apiConnector('POST', LOGOUT_API);
      console.log('Logout API response : ', response);
      
      // Clear local storage and redux state regardless of API response
      dispatch({ type: 'dashboard/LogOut' });
      localStorage.clear();
      
      toast.success('Successfully signed out');
      navigate('/');
    } catch (error) {
      console.log('Logout API Error....', error);
      // Still logout locally even if API fails
      dispatch({ type: 'dashboard/LogOut' });
      localStorage.clear();
      toast.success('Signed out');
      navigate('/');
    } finally {
      toast.dismiss(loadingToast);
    }
  };
}

// Google Sign In (if you implement it)
export function loginWithGoogle(credentialResponse, navigate) {
  return async (dispatch) => {
    const loadingToast = toast.loading('Signing in with Google...');
    try {
      const response = await apiConnector('POST', GOOGLE_SIGN_IN, {
        credential: credentialResponse.credential,
      });

      console.log('Google Sign-In API response: ', response);

      if (response.data.success) {
        toast.success('Google Sign-In Successful!');

        const accountData = {
          id: response.data.user.u_id,
          uname: response.data.user.name,
          uemail: response.data.user.email,
          token: response.data.token,
          profile_url: response.data.user.profile_url,
          is_new: response.data.isFirstTime,
          role: "user",
          role_id: 1
        };

        dispatch(setAccount(accountData));

        if (response.data.isFirstTime) {
          dispatch(setDFeature({ dashboardFeature: 'Home' }));
          navigate('/onboard');
        } else {
          dispatch(setDFeature({ dashboardFeature: 'Home' }));
          navigate('/dashboard');
        }
      } else {
        throw new Error(response.data.message || 'Google sign-in failed');
      }
    } catch (error) {
      console.log('Google Sign-In API Error:', error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Failed to sign in with Google'
      );
    } finally {
      toast.dismiss(loadingToast);
    }
  };
}