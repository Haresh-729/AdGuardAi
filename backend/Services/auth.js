const { supabase } = require("../config/config.js");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const emailTemplate = require("./Mail/Mail/Templates/EmailVerificationTemplate.js");
const mailSender = require("./Mail/mailSender.js");
const { DateTime } = require("luxon");

const secret = process.env.JWT_SECRET || 'MasterMindAlternateSecret';
const usersTable = "users";

// Utility function to generate random OTP
function generateRandomOTP() {
  const min = 100000;
  const max = 999999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Utility function to generate JWT token
const generateToken = (user) => {
  const payload = { 
    id: user.u_id, 
    email: user.email, 
    name: user.name 
  };
  return jwt.sign(payload, secret, { expiresIn: '30d' });
};

// Utility function to verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid Token');
  }
};

// Send verification email
async function sendVerificationEmail(email, otp) {
  try {
    const mailResponse = await mailSender(
      email,
      "Email Verification - OTP",
      emailTemplate(otp)
    );
    console.log("OTP email sent successfully");
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
}

// Check if user exists by email
const checkUserExists = async (email) => {
  try {
    const { data, error } = await supabase
      .from(usersTable)
      .select("email")
      .eq("email", email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error("Error checking user existence:", error);
    return false;
  }
};

// Register new user
const registerUser = async (userData) => {
  const { name, email, password, profession } = userData;

  try {
    // Check if user already exists
    const userExists = await checkUserExists(email);
    if (userExists) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const otp = generateRandomOTP();

    // Insert user into database
    const { data, error } = await supabase
      .from(usersTable)
      .insert([{
        name,
        email,
        password: hashedPassword,
        profession: profession || null,
        otp,
        otp_created_at: new Date().toISOString()
      }])
      .select("u_id, name, email")
      .single();

    if (error) {
      throw error;
    }

    // Send verification email
    await sendVerificationEmail(email, otp);

    return data;
  } catch (error) {
    console.error("Error in registerUser:", error);
    throw new Error(error.message || "Registration failed");
  }
};

// Send OTP to email
const sendOtpToEmail = async (email) => {
  try {
    // Check if user exists
    const userExists = await checkUserExists(email);
    if (!userExists) {
      throw new Error("No account found with this email address");
    }

    const otp = generateRandomOTP();

    // Update user's OTP
    const { error } = await supabase
      .from(usersTable)
      .update({ 
        otp, 
        otp_created_at: new Date().toISOString() 
      })
      .eq("email", email);

    if (error) {
      throw error;
    }

    // Send OTP email
    await sendVerificationEmail(email, otp);

  } catch (error) {
    console.error("Error in sendOtpToEmail:", error);
    throw new Error(error.message || "Failed to send OTP");
  }
};

// Resend OTP to email
const resendOtpToEmail = async (email) => {
  return await sendOtpToEmail(email); // Same logic as sendOtpToEmail
};

// Verify OTP
const verifyUserOtp = async (email, otp) => {
  try {
    // Check OTP validity (within 10 minutes)
    const tenMinutesAgo = DateTime.utc()
      .minus({ minutes: 10 })
      .toFormat("yyyy-MM-dd HH:mm:ss");

    const { data: user, error } = await supabase
      .from(usersTable)
      .select("u_id, email, otp, otp_created_at")
      .eq("email", email)
      .eq("otp", parseInt(otp))
      .gte("otp_created_at", tenMinutesAgo)
      .single();

    if (error || !user) {
      return false;
    }

    // Mark email as verified
    const { error: updateError } = await supabase
      .from(usersTable)
      .update({ 
        e_verified: true,
        otp_verified_at: new Date().toISOString()
      })
      .eq("email", email);

    if (updateError) {
      throw updateError;
    }

    return true;
  } catch (error) {
    console.error("Error in verifyUserOtp:", error);
    return false;
  }
};

// Login user
const loginUser = async (email, password) => {
  try {
    console.log("Logging in user:", email);
    // Fetch user by email
    const { data, error } = await supabase
      .from(usersTable)
      .select("u_id, name, email, password, e_verified, is_active, profile_url, dob, profession")
      .eq("email", email)
      .single();
    // console.log("User data fetched:", data);
    // console.log("Error fetching user:", error);

    if (error || !data) {
      return {
        exists_flag: false,
        login_flag: false,
        message: "Account does not exist."
      };
    }

    const user = data;

    // Check if account is active
    if (!user.is_active) {
      return {
        exists_flag: true,
        login_flag: false,
        message: "Account is blocked or deleted."
      };
    }

    // Check if email is verified
    if (!user.e_verified) {
      return {
        exists_flag: true,
        login_flag: false,
        message: "Please verify your email before logging in."
      };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return {
        exists_flag: true,
        login_flag: false,
        message: "Incorrect password."
      };
    }

    // Generate JWT token
    const token = generateToken(user);

    // Check if it's first time (dob and profession are null)
    const isFirstTime = !user.dob && !user.profession;

    // Return successful login response
    return {
      exists_flag: true,
      login_flag: true,
      isFirstTime,
      token,
      user: {
        u_id: user.u_id,
        name: user.name,
        email: user.email,
        profile_url: user.profile_url,
        credits: user.credits,
        role: user.role,
      }
    };

  } catch (error) {
    console.error("Error in loginUser:", error);
    throw new Error("Login failed");
  }
};

// Send password reset OTP
const sendPasswordResetOtp = async (email) => {
  try {
    // Check if user exists
    const userExists = await checkUserExists(email);
    if (!userExists) {
      throw new Error("No account found with this email address");
    }

    const otp = generateRandomOTP();

    // Update user's OTP for password reset
    const { error } = await supabase
      .from(usersTable)
      .update({ 
        otp, 
        otp_created_at: new Date().toISOString() 
      })
      .eq("email", email);

    if (error) {
      throw error;
    }

    // Send password reset OTP email
    await mailSender(
      email,
      "Password Reset - OTP",
      `<p>Your password reset OTP is: <strong>${otp}</strong></p>
       <p>This OTP is valid for 10 minutes.</p>
       <p>If you didn't request this, please ignore this email.</p>`
    );

  } catch (error) {
    console.error("Error in sendPasswordResetOtp:", error);
    throw new Error(error.message || "Failed to send password reset OTP");
  }
};

// Reset password using OTP
const resetUserPassword = async (email, otp, newPassword) => {
  try {
    // Verify OTP (within 10 minutes)
    const tenMinutesAgo = DateTime.utc()
      .minus({ minutes: 10 })
      .toFormat("yyyy-MM-dd HH:mm:ss");

    const { data: user, error } = await supabase
      .from(usersTable)
      .select("u_id")
      .eq("email", email)
      .eq("otp", parseInt(otp))
      .gte("otp_created_at", tenMinutesAgo)
      .single();

    if (error || !user) {
      throw new Error("Invalid or expired OTP");
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear OTP
    const { error: updateError } = await supabase
      .from(usersTable)
      .update({ 
        password: hashedPassword,
        otp: null,
        otp_created_at: null
      })
      .eq("email", email);

    if (updateError) {
      throw updateError;
    }

  } catch (error) {
    console.error("Error in resetUserPassword:", error);
    throw new Error(error.message || "Password reset failed");
  }
};

module.exports = {
  generateToken,
  verifyToken,
  checkUserExists,
  registerUser,
  sendOtpToEmail,
  resendOtpToEmail,
  verifyUserOtp,
  loginUser,
  sendPasswordResetOtp,
  resetUserPassword
};