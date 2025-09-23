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
    // User info is already in req.user from JWT token
    const user = await accountService.getUserById(req.user.id);
    res.status(200).json(user);
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
    // Check if user is admin (you can implement role-based logic here)
    // For now, assuming anyone can access - modify as needed
    const users = await accountService.getAllUsers();
    res.status(200).json(users);
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

    // Check if user is updating their own profile or has admin rights
    if (parseInt(id) !== req.user.id) {
      // Add admin check here if needed
      // For now, allowing any authenticated user to update any profile
    }

    const updatedUser = await accountService.updateUser(id, updates);
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error in updateUser controller:', error);
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
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error in changePassword controller:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid user ID is required' 
      });
    }

    // Add admin check or self-deletion check here
    await accountService.deactivateUser(id);
    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Error in deleteUser controller:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const getUserCredits = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid user ID is required' 
      });
    }

    const credits = await accountService.getUserCredits(id);
    res.status(200).json({ credits });
  } catch (error) {
    console.error('Error in getUserCredits controller:', error);
    res.status(404).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const updateCredits = async (req, res) => {
  try {
    const { user_id, amount, reason } = req.body;
    
    if (!user_id || amount === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and amount are required' 
      });
    }

    const updatedCredits = await accountService.updateUserCredits(user_id, amount, reason);
    res.status(200).json({
      success: true,
      message: 'Credits updated successfully',
      credits: updatedCredits
    });
  } catch (error) {
    console.error('Error in updateCredits controller:', error);
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

const getUserActivity = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid user ID is required' 
      });
    }

    const activity = await accountService.getUserActivity(id);
    res.status(200).json(activity);
  } catch (error) {
    console.error('Error in getUserActivity controller:', error);
    res.status(404).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const completeOnboarding = async (req, res) => {
  try {
    const { profile_url, dob, profession, exam_language, native_language, phone } = req.body;
    const userId = req.user.id;

    if (!dob || !profession || !exam_language || !native_language) {
      return res.status(400).json({ 
        success: false, 
        message: 'DOB, profession, exam language, and native language are required' 
      });
    }

    const result = await accountService.completeOnboarding(userId, {
      profile_url,
      dob,
      profession,
      exam_language,
      native_language,
      phone
    });

    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
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

const updateStreakSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { streak_reminders_enabled, streak_reminder_time, whatsapp_number } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({
        streak_reminders_enabled,
        streak_reminder_time,
        whatsapp_number,
        updated_at: new Date().toISOString()
      })
      .eq('u_id', userId)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  getUserById,
  getCurrentUser,
  getAllUsers,
  updateUser,
  changePassword,
  deleteUser,
  getUserCredits,
  updateCredits,
  verifyUserEmail,
  getUserActivity,
  completeOnboarding,
  updateStreakSettings
};