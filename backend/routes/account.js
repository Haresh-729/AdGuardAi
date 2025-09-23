const express = require('express');
const authMiddleware = require('../Middlewares/auth');
const { 
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
} = require('../controllers/account');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Account management routes
router.get('/user/:id', getUserById);
router.get('/me', getCurrentUser);
router.get('/all', getAllUsers);
router.put('/update/:id', updateUser);
router.post('/change-password', changePassword);
router.delete('/delete/:id', deleteUser);
router.get('/credits/:id', getUserCredits);
router.post('/credits/update', updateCredits);
router.post('/verify-email', verifyUserEmail);
router.get('/activity/:id', getUserActivity);
router.post('/onboarding', completeOnboarding);
router.put('/streak-settings', updateStreakSettings);

module.exports = router;