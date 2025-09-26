const accountService = require('../Services/account');

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid user ID is required' 
      });
    }

    const user = await accountService.getUserById(id);
    res.status(200).json(user);
  } catch (error) {
    console.error('Error in getUserById controller:', error);
    res.status(404).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await accountService.getUserById(req.user.id);
    const { u_id, name, email, sector, is_active, e_verified, mobile, dob, created_at, profile_url, updated_at } = user;
    res.status(200).json({ u_id, name, email, sector, is_active, e_verified, dob, mobile, created_at, profile_url, updated_at });
  } catch (error) {
    console.error('Error in getCurrentUser controller:', error);
    res.status(404).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await accountService.getAllUsers();
    const filteredUsers = users.map(user => ({
      u_id: user.u_id,
      name: user.name,
      email: user.email,
      sector: user.sector
    }));
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error('Error in getAllUsers controller:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid user ID is required' 
      });
    }

    const updatedUser = await accountService.updateUser(id, updates);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      updated_user: updatedUser
    });
  } catch (error) {
    console.error('Error in updateUser controller:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const completeOnboarding = async (req, res) => {
  try {
    const { profile_url, dob, sector, mobile } = req.body;
    const userId = req.user.id;

    if (!dob || !sector) {
      return res.status(400).json({ 
        success: false, 
        message: 'DOB and sector are required' 
      });
    }

    const result = await accountService.completeOnboarding(userId, {
      profile_url,
      dob,
      sector,
      mobile
    });

    res.status(200).json({
      success: true,
      message: 'Onboarding completed',
      user: result
    });
  } catch (error) {
    console.error('Error in completeOnboarding controller:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    const userId = req.user.id;
    
    if (!old_password || !new_password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Old password and new password are required' 
      });
    }

    await accountService.changePassword(userId, old_password, new_password);
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error in changePassword controller:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const verifyUserEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    await accountService.markEmailVerified(email);
    res.status(200).json({
      success: true,
      message: 'Email marked as verified'
    });
  } catch (error) {
    console.error('Error in verifyUserEmail controller:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid user ID is required' 
      });
    }

    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password is required' 
      });
    }

    await accountService.deactivateUser(id, password);
    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Error in deleteUser controller:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = { 
  getUserById,
  getCurrentUser,
  getAllUsers,
  updateUser,
  completeOnboarding,
  changePassword,
  verifyUserEmail,
  deleteUser
};