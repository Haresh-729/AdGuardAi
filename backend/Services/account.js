const { supabase } = require("../config/config");
const bcrypt = require("bcrypt");

const usersTable = "users";

const getUserById = async (userId) => {
  try {
    const { data, error } = await supabase
      .from(usersTable)
      .select("u_id, name, email, profile_url, dob, sector, mobile, created_at, is_active, e_verified, updated_at")
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

const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from(usersTable)
      .select("u_id, name, email, sector, is_active")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    throw new Error(error.message || "Failed to fetch users");
  }
};

const updateUser = async (userId, updates) => {
  try {
    const allowedFields = ['name', 'sector', 'profile_url', 'mobile'];
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
      .select("u_id, name, sector, profile_url, mobile")
      .single();

    if (error) throw error;
    if (!data) throw new Error("User not found");

    return data;
  } catch (error) {
    console.error("Error in updateUser:", error);
    throw new Error(error.message || "Failed to update user");
  }
};

const completeOnboarding = async (userId, onboardingData) => {
  try {
    const { profile_url, dob, sector, mobile } = onboardingData;
    
    const { data, error } = await supabase
      .from(usersTable)
      .update({ 
        profile_url,
        dob,
        sector,
        mobile,
        updated_at: new Date().toISOString()
      })
      .eq("u_id", userId)
      .select("u_id, dob, sector, mobile")
      .single();

    if (error) throw error;
    if (!data) throw new Error("User not found");

    return data;
  } catch (error) {
    console.error("Error in completeOnboarding:", error);
    throw new Error(error.message || "Failed to complete onboarding");
  }
};

const changePassword = async (userId, oldPassword, newPassword) => {
  try {
    const { data: user, error } = await supabase
      .from(usersTable)
      .select("password")
      .eq("u_id", userId)
      .single();

    if (error || !user) throw new Error("User not found");

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

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

const deactivateUser = async (userId, password) => {
  try {
    const { data: user, error } = await supabase
      .from(usersTable)
      .select("password")
      .eq("u_id", userId)
      .single();

    if (error || !user) throw new Error("User not found");

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Incorrect password");
    }

    const { data, error: updateError } = await supabase
      .from(usersTable)
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq("u_id", userId)
      .select("u_id")
      .single();

    if (updateError) throw updateError;
    if (!data) throw new Error("User not found");

  } catch (error) {
    console.error("Error in deactivateUser:", error);
    throw new Error(error.message || "Failed to deactivate user");
  }
};

module.exports = {
  getUserById,
  getAllUsers,
  updateUser,
  completeOnboarding,
  changePassword,
  markEmailVerified,
  deactivateUser
};