const { supabase } = require("../config/config.js");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const emailTemplate = require("./Mail/Mail/Templates/EmailVerificationTemplate.js");
const passwordResetTemplate = require("./Mail/Mail/Templates/PasswordResetTemplate.js");
const mailSender = require("./Mail/mailSender.js");
const { DateTime } = require("luxon");

const secret = process.env.JWT_SECRET || 'MasterMindAlternateSecret';
const usersTable = "users";

function generateRandomOTP() {
  const min = 100000;
  const max = 999999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const generateToken = (user) => {
  const payload = { 
    id: user.u_id, 
    email: user.email, 
    name: user.name 
  };
  return jwt.sign(payload, secret, { expiresIn: '30d' });
};

async function sendVerificationEmail(email, otp) {
  try {
    await mailSender(
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

const checkUserExists = async (email) => {
  try {
    const { data, error } = await supabase
      .from(usersTable)
      .select("u_id, email, is_active")
      .eq("email", email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      return {
        exists: true,
        user: {
          u_id: data.u_id,
          email: data.email,
          is_active: data.is_active
        }
      };
    } else {
      return { exists: false };
    }
  } catch (error) {
    console.error("Error checking user existence:", error);
    return { exists: false };
  }
};

const registerUser = async (userData) => {
  const { name, email, password, mobile, sector } = userData;

  try {
    const userExists = await checkUserExists(email);
    if (userExists.exists) {
      throw new Error("User with this email already exists");
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const otp = generateRandomOTP();

    const { data, error } = await supabase
      .from(usersTable)
      .insert([{
        name,
        email,
        password: hashedPassword,
        mobile: mobile || null,
        sector: sector || null,
        otp,
        otp_created_at: new Date().toISOString()
      }])
      .select("u_id, name, email, sector, is_active, created_at")
      .single();

    if (error) {
      throw error;
    }

    await sendVerificationEmail(email, otp);

    return {
      success: true,
      message: "User registered successfully",
      user: data
    };
  } catch (error) {
    console.error("Error in registerUser:", error);
    throw new Error(error.message || "Registration failed");
  }
};

const sendOtpToEmail = async (email) => {
  try {
    const userExists = await checkUserExists(email);
    if (!userExists.exists) {
      throw new Error("No account found with this email address");
    }

    const otp = generateRandomOTP();

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

    await sendVerificationEmail(email, otp);

    return {
      success: true,
      message: "OTP sent to registered email",
      otp_expires_in: "5 minutes"
    };
  } catch (error) {
    console.error("Error in sendOtpToEmail:", error);
    throw new Error(error.message || "Failed to send OTP");
  }
};

const resendOtpToEmail = async (email) => {
  try {
    const result = await sendOtpToEmail(email);
    return {
      success: true,
      message: "OTP resent successfully"
    };
  } catch (error) {
    throw error;
  }
};

const verifyUserOtp = async (email, otp) => {
  try {
    const fiveMinutesAgo = DateTime.utc()
      .minus({ minutes: 5 })
      .toFormat("yyyy-MM-dd HH:mm:ss");

    const { data: user, error } = await supabase
      .from(usersTable)
      .select("u_id, email, otp, otp_created_at")
      .eq("email", email)
      .eq("otp", parseInt(otp))
      .gte("otp_created_at", fiveMinutesAgo)
      .single();

    if (error || !user) {
      throw new Error("Invalid or expired OTP");
    }

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

    return {
      success: true,
      message: "Email verified successfully",
      verified_at: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error in verifyUserOtp:", error);
    throw new Error(error.message || "OTP verification failed");
  }
};

const loginUser = async (email, password) => {
  try {
    const { data, error } = await supabase
      .from(usersTable)
      .select("u_id, name, email, password, e_verified, is_active, mobile, sector")
      .eq("email", email)
      .single();

    if (error || !data) {
      throw new Error("Invalid credentials");
    }

    const user = data;

    if (!user.is_active) {
      throw new Error("Account is deactivated");
    }

    if (!user.e_verified) {
      throw new Error("Please verify your email before logging in");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const token = generateToken(user);

    return {
      success: true,
      token,
      user: {
        u_id: user.u_id,
        name: user.name,
        email: user.email,
        is_active: user.is_active,
        mobile: user.mobile,
        sector: user.sector,
        e_verified: user.e_verified
      }
    };

  } catch (error) {
    console.error("Error in loginUser:", error);
    throw new Error(error.message || "Login failed");
  }
};

const sendPasswordResetOtp = async (email) => {
  try {
    const userExists = await checkUserExists(email);
    if (!userExists.exists) {
      throw new Error("No account found with this email address");
    }

    const otp = generateRandomOTP();

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

    await mailSender(
      email,
      "Password Reset - OTP",
      passwordResetTemplate(otp)
    );

    return {
      success: true,
      message: "Password reset OTP sent to email"
    };
  } catch (error) {
    console.error("Error in sendPasswordResetOtp:", error);
    throw new Error(error.message || "Failed to send password reset OTP");
  }
};

const resetUserPassword = async (email, otp, newPassword) => {
  try {
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

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

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

    return {
      success: true,
      message: "Password reset successfully"
    };
  } catch (error) {
    console.error("Error in resetUserPassword:", error);
    throw new Error(error.message || "Password reset failed");
  }
};

module.exports = {
  generateToken,
  checkUserExists,
  registerUser,
  sendOtpToEmail,
  resendOtpToEmail,
  verifyUserOtp,
  loginUser,
  sendPasswordResetOtp,
  resetUserPassword
};