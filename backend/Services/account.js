const { supabase } = require("../config/config");
const bcrypt = require("bcrypt");

const usersTable = "users";
const workflowsTable = "workflows";
const triggerLogTable = "trigger_log";

// Get user by ID
const getUserById = async (userId) => {
  try {
    const { data, error } = await supabase
      .from(usersTable)
      .select("*")
      .eq("u_id", userId)
      .single();

    if (error) throw error;
    if (!data) throw new Error("User not found");

    return data;
  } catch (error) {
    console.error("Error in getUserById:", error);
    throw new Error(error.message || "User not found");
  }
};

// Get all users
const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from(usersTable)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    throw new Error(error.message || "Failed to fetch users");
  }
};

// Update user profile
const updateUser = async (userId, updates) => {
  try {
    // Filter allowed fields for update
    const allowedFields = ['name', 'profession', 'profile_url', 'dob', 'exam_language', 'native_language'];
    const filteredUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error("No valid fields provided for update");
    }

    filteredUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from(usersTable)
      .update(filteredUpdates)
      .eq("u_id", userId)
      .select("u_id, name, email, profession, is_active, profile_url")
      .single();

    if (error) throw error;
    if (!data) throw new Error("User not found");

    return data;
  } catch (error) {
    console.error("Error in updateUser:", error);
    throw new Error(error.message || "Failed to update user");
  }
};

// Change password
const changePassword = async (userId, oldPassword, newPassword) => {
  try {
    // First verify the old password
    const { data: user, error } = await supabase
      .from(usersTable)
      .select("password")
      .eq("u_id", userId)
      .single();

    if (error || !user) throw new Error("User not found");

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const { error: updateError } = await supabase
      .from(usersTable)
      .update({ 
        password: hashedNewPassword,
        updated_at: new Date().toISOString()
      })
      .eq("u_id", userId);

    if (updateError) throw updateError;

  } catch (error) {
    console.error("Error in changePassword:", error);
    throw new Error(error.message || "Failed to change password");
  }
};

// Deactivate user (soft delete)
const deactivateUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from(usersTable)
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq("u_id", userId)
      .select("u_id")
      .single();

    if (error) throw error;
    if (!data) throw new Error("User not found");

  } catch (error) {
    console.error("Error in deactivateUser:", error);
    throw new Error(error.message || "Failed to deactivate user");
  }
};

// Get user credits
const getUserCredits = async (userId) => {
  try {
    const { data, error } = await supabase
      .from(usersTable)
      .select("credits")
      .eq("u_id", userId)
      .single();

    if (error) throw error;
    if (!data) throw new Error("User not found");

    return data.credits;
  } catch (error) {
    console.error("Error in getUserCredits:", error);
    throw new Error(error.message || "Failed to get user credits");
  }
};

// Update user credits
const updateUserCredits = async (userId, amount, reason = null) => {
  try {
    // Get current credits
    const currentCredits = await getUserCredits(userId);
    const newCredits = currentCredits + amount;

    // Ensure credits don't go below 0
    if (newCredits < 0) {
      throw new Error("Insufficient credits");
    }

    const { data, error } = await supabase
      .from(usersTable)
      .update({ 
        credits: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq("u_id", userId)
      .select("credits")
      .single();

    if (error) throw error;
    if (!data) throw new Error("User not found");

    // TODO: Log credit transaction if you have a credits_log table
    console.log(`Credits updated for user ${userId}: ${amount} (${reason || 'No reason provided'})`);

    return data.credits;
  } catch (error) {
    console.error("Error in updateUserCredits:", error);
    throw new Error(error.message || "Failed to update credits");
  }
};

// Mark email as verified
const markEmailVerified = async (email) => {
  try {
    const { data, error } = await supabase
      .from(usersTable)
      .update({ 
        e_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq("email", email)
      .select("u_id")
      .single();

    if (error) throw error;
    if (!data) throw new Error("User not found");

  } catch (error) {
    console.error("Error in markEmailVerified:", error);
    throw new Error(error.message || "Failed to verify email");
  }
};

// Get user activity analytics
const getUserActivity = async (userId) => {
  try {
    // Get user basic info
    const { data: user, error: userError } = await supabase
      .from(usersTable)
      .select("created_at")
      .eq("u_id", userId)
      .single();

    if (userError || !user) throw new Error("User not found");

    // Get workflow counts
    const { data: workflows, error: workflowError } = await supabase
      .from(workflowsTable)
      .select("wf_id, created_at, executed_count")
      .eq("created_by", userId);

    if (workflowError) {
      console.error("Error fetching workflows:", workflowError);
    }

    // Get trigger log counts
    const { data: triggerLogs, error: triggerError } = await supabase
      .from(triggerLogTable)
      .select("tl_id, created_at")
      .in("wf_id", workflows?.map(w => w.wf_id) || []);

    if (triggerError) {
      console.error("Error fetching trigger logs:", triggerError);
    }

    // Calculate activity metrics
    const createdWorkflowsCount = workflows?.length || 0;
    const totalExecutedWorkflows = workflows?.reduce((sum, wf) => sum + (wf.executed_count || 0), 0) || 0;
    const totalTriggersRun = triggerLogs?.length || 0;

    // Get last login (you might need to track this separately)
    // For now, using account creation date as placeholder
    const lastLoginAt = user.created_at; // TODO: Implement proper last login tracking

    return {
      last_login_at: lastLoginAt,
      created_workflows_count: createdWorkflowsCount,
      executed_workflows_count: totalExecutedWorkflows,
      total_triggers_run: totalTriggersRun,
      account_created_at: user.created_at
    };

  } catch (error) {
    console.error("Error in getUserActivity:", error);
    throw new Error(error.message || "Failed to get user activity");
  }
};

// Add this function to the existing account.js service
const completeOnboarding = async (userId, onboardingData) => {
  try {
    const { profile_url, dob, profession, exam_language, native_language, phone } = onboardingData;
    
    const { data, error } = await supabase
      .from(usersTable)
      .update({ 
        profile_url,
        dob,
        profession,
        exam_language,
        native_language,
        phone,
        whatsapp_number: phone,
        updated_at: new Date().toISOString()
      })
      .eq("u_id", userId)
      .select("u_id, name, email, profile_url, dob, profession, exam_language, native_language, phone ")
      .single();

    if (error) throw error;
    if (!data) throw new Error("User not found");

    return data;
  } catch (error) {
    console.error("Error in completeOnboarding:", error);
    throw new Error(error.message || "Failed to complete onboarding");
  }
};

module.exports = {
  getUserById,
  getAllUsers,
  updateUser,
  changePassword,
  deactivateUser,
  getUserCredits,
  updateUserCredits,
  markEmailVerified,
  getUserActivity,
  completeOnboarding,
};