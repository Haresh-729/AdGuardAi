import { toast } from "react-hot-toast";
import { apiConnector } from "../Connector";
import { setAccount, setCredits } from "../../App/DashboardSlice";
import { accountEndpoints } from "../Apis";

const {
  CURRENT_USER,
  UPDATE_USER,
  CHANGE_PASSWORD,
  DELETE_USER,
  USER_CREDITS,
  USER_BY_ID,
  ALL_USERS,
  UPDATE_CREDITS,
  MANUALLY_VERIFY_EMAIL,
  USER_ACTIVITY,
} = accountEndpoints;

// Get current authenticated user
export async function getCurrentUser() {
  const loadingToast = toast.loading("Fetching user data...");
  try {
    const response = await apiConnector(CURRENT_USER.t, CURRENT_USER.e);

    console.log("Current User API response : ", response);
    if (response.status === 200 && response.data) {
      return response.data;
    } else {
      throw new Error(response.data?.message || "Failed to fetch user data");
    }
  } catch (error) {
    console.log("Current User API Error....", error);
    toast.error(error.response?.data?.message || "Failed to fetch user data");
    throw error;
  } finally {
    toast.dismiss(loadingToast);
  }
}

// Update user profile
export function updateUser(userId, userData) {
  return async (dispatch) => {
    const loadingToast = toast.loading("Updating profile...");
    try {
      const response = await apiConnector(
        UPDATE_USER.t,
        `${UPDATE_USER.e}/${userId}`,
        userData
      );

      console.log("Update User API response : ", response);
      if (response.status === 200 && response.data) {
        toast.success("Profile updated successfully");
        
        // Update Redux store with new user data
        const updatedAccountData = {
          id: response.data.u_id || userId,
          uname: response.data.name,
          uemail: response.data.email,
          profile_url: response.data.profile_url,
          credits: response.data.credits,
          role: response.data.role || "user",
          token: JSON.parse(localStorage.getItem('account'))?.token // Preserve existing token
        };
        
        dispatch(setAccount(updatedAccountData));
        return response.data;
      } else {
        throw new Error(response.data?.message || "Failed to update profile");
      }
    } catch (error) {
      console.log("Update User API Error....", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
      throw error;
    } finally {
      toast.dismiss(loadingToast);
    }
  };
}

// Change password
export async function changePassword(passwordData) {
  const loadingToast = toast.loading("Changing password...");
  try {
    const response = await apiConnector(
      CHANGE_PASSWORD.t, // This is now 'POST'
      CHANGE_PASSWORD.e,
      passwordData
    );

    console.log("Change Password API response : ", response);
    if (response.status === 200) {
      toast.success("Password changed successfully");
      return response.data;
    } else {
      throw new Error(response.data?.message || "Failed to change password");
    }
  } catch (error) {
    console.log("Change Password API Error....", error);
    toast.error(error.response?.data?.message || "Failed to change password");
    throw error;
  } finally {
    toast.dismiss(loadingToast);
  }
}

// Delete/Deactivate user account
export async function deleteUser(userId, navigate) {
  const loadingToast = toast.loading("Deactivating account...");
  try {
    const response = await apiConnector(
      DELETE_USER.t,
      `${DELETE_USER.e}/${userId}`
    );

    console.log("Delete User API response : ", response);
    if (response.status === 200 || response.data?.success) {
      toast.success("Account deactivated successfully");
      // Clear user data and navigate to home
      localStorage.clear();
      navigate("/");
      return response.data;
    } else {
      throw new Error(response.data?.message || "Failed to deactivate account");
    }
  } catch (error) {
    console.log("Delete User API Error....", error);
    toast.error(
      error.response?.data?.message || "Failed to deactivate account"
    );
    throw error;
  } finally {
    toast.dismiss(loadingToast);
  }
}

// Get user credits
export function getUserCredits(userId, isSelf = false) {
  return async (dispatch) => {
    try {
      const response = await apiConnector(
        USER_CREDITS.t,
        `${USER_CREDITS.e}/${userId}`
      );

      console.log("User Credits API response : ", response);
      if (response.status === 200 && response.data) {
        const credits = response.data.credits || response.data;
        
        if (isSelf) {
          dispatch(setCredits({ credits: credits }));
        }
        
        return credits;
      } else {
        throw new Error(response.data?.message || "Failed to fetch credits");
      }
    } catch (error) {
      console.log("User Credits API Error....", error);
      toast.error(error.response?.data?.message || "Failed to fetch credits");
      throw error;
    }
  };
}

// Admin Functions
export async function getUserById(userId) {
  const loadingToast = toast.loading('Fetching user details...');
  try {
    const response = await apiConnector(USER_BY_ID.t, `${USER_BY_ID.e}/${userId}`);

    console.log('Get User API response: ', response);
    if (response.status === 200 && response.data) {
      toast.success('User details fetched successfully');
      return response.data;
    } else {
      throw new Error(response.data?.message || 'Failed to fetch user details');
    }
  } catch (error) {
    console.log('Get User API Error:', error);
    toast.error(error.response?.data?.message || 'Failed to fetch user details');
    throw error;
  } finally {
    toast.dismiss(loadingToast);
  }
}

// Get all users (admin only)
export async function getAllUsers() {
  const loadingToast = toast.loading('Fetching all users...');
  try {
    const response = await apiConnector(ALL_USERS.t, ALL_USERS.e);

    console.log('Get All Users API response: ', response);
    if (response.status === 200) {
      toast.success('Users fetched successfully');
      return response.data; // This returns array directly
    } else {
      throw new Error(response.data?.message || 'Failed to fetch users');
    }
  } catch (error) {
    console.log('Get All Users API Error:', error);
    toast.error(error.response?.data?.message || 'Failed to fetch users');
    throw error;
  } finally {
    toast.dismiss(loadingToast);
  }
}

// Update user credits (admin function)
export async function updateUserCredits(userId, amount, reason) {
  const loadingToast = toast.loading('Updating credits...');
  try {
    const response = await apiConnector(UPDATE_CREDITS.t, UPDATE_CREDITS.e, {
      user_id: userId,
      amount: amount,
      reason: reason
    });

    console.log('Update Credits API response: ', response);
    if (response.status === 200) {
      const actionType = amount > 0 ? 'added' : 'deducted';
      toast.success(`Credits ${actionType} successfully`);
      return response.data;
    } else {
      throw new Error(response.data?.message || 'Failed to update credits');
    }
  } catch (error) {
    console.log('Update Credits API Error:', error);
    toast.error(error.response?.data?.message || 'Failed to update credits');
    throw error;
  } finally {
    toast.dismiss(loadingToast);
  }
}

// Manually verify email (admin function)
export async function manuallyVerifyEmail(email) {
  const loadingToast = toast.loading('Verifying email...');
  try {
    const response = await apiConnector(MANUALLY_VERIFY_EMAIL.t, MANUALLY_VERIFY_EMAIL.e, {
      email: email
    });

    console.log('Manual Email Verification API response: ', response);
    if (response.status === 200) {
      toast.success('Email verified successfully');
      return response.data;
    } else {
      throw new Error(response.data?.message || 'Failed to verify email');
    }
  } catch (error) {
    console.log('Manual Email Verification API Error:', error);
    toast.error(error.response?.data?.message || 'Failed to verify email');
    throw error;
  } finally {
    toast.dismiss(loadingToast);
  }
}

// Get user activity by ID
export async function getUserActivity(userId) {
  const loadingToast = toast.loading('Fetching user activity...');
  try {
    const response = await apiConnector(USER_ACTIVITY.t, `${USER_ACTIVITY.e}/${userId}`);

    console.log('Get User Activity API response: ', response);
    if (response.status === 200) {
      toast.success('User activity fetched successfully');
      return response.data;
    } else {
      throw new Error(response.data?.message || 'Failed to fetch user activity');
    }
  } catch (error) {
    console.log('Get User Activity API Error:', error);
    toast.error(error.response?.data?.message || 'Failed to fetch user activity');
    throw error;
  } finally {
    toast.dismiss(loadingToast);
  }
}

// Complete onboarding process
export function completeOnboarding(onboardingData) {
  return async (dispatch) => {
    const loadingToast = toast.loading('Completing your setup...');
    try {
      const response = await apiConnector('POST', accountEndpoints.ONBOARDING.e, onboardingData);

      console.log('Onboarding API response: ', response);
      if (response.status === 200 && response.data.success) {
        toast.success('Profile setup completed successfully!');
        
        const currentAccount = JSON.parse(localStorage.getItem('account')) || {};
        const updatedAccount = {
          ...currentAccount,
          // Update based on actual API response structure
          is_new: false
        };
        
        dispatch(setAccount(updatedAccount));
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Failed to complete onboarding');
      }
    } catch (error) {
      console.log('Onboarding API Error:', error);
      toast.error(error.response?.data?.message || 'Failed to complete setup');
      throw error;
    } finally {
      toast.dismiss(loadingToast);
    }
  };
}

export async function verifyEmailManually(email) {
  const loadingToast = toast.loading('Verifying email...');
  try {
    const response = await apiConnector(VERIFY_EMAIL.t, VERIFY_EMAIL.e, {
      email: email
    });

    console.log('Verify Email API response: ', response);
    if (response.status === 200) {
      toast.success('Email verified successfully');
      return response.data;
    } else {
      throw new Error(response.data?.message || 'Failed to verify email');
    }
  } catch (error) {
    console.log('Verify Email API Error:', error);
    toast.error(error.response?.data?.message || 'Failed to verify email');
    throw error;
  } finally {
    toast.dismiss(loadingToast);
  }
}