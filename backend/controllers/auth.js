const authService = require('../Services/auth');

const checkUser = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const result = await authService.checkUserExists(email);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in checkUser controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

const register = async (req, res) => {
  try {
    const { name, email, password, mobile, sector } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and password are required' 
      });
    }

    const result = await authService.registerUser({
      name,
      email,
      password,
      mobile,
      sector
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error in register controller:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const result = await authService.sendOtpToEmail(email);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in sendOtp controller:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const result = await authService.resendOtpToEmail(email);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in resendOtp controller:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      });
    }

    const result = await authService.verifyUserOtp(email, otp);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in verifyOtp controller:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    const result = await authService.loginUser(email, password);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in login controller:', error);
    res.status(401).json({ 
      success: false,
      message: error.message 
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const result = await authService.sendPasswordResetOtp(email);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in forgotPassword controller:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;
    
    if (!email || !otp || !new_password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, OTP, and new password are required' 
      });
    }

    const result = await authService.resetUserPassword(email, otp, new_password);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in resetPassword controller:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error in logout controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Logout failed' 
    });
  }
};

module.exports = { 
  checkUser,
  register, 
  login, 
  logout,
  sendOtp,
  resendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword
};