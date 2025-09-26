const express = require('express');
const authMiddleware = require('../Middlewares/auth');
const { 
  getUserById,
  getCurrentUser,
  getAllUsers,
  updateUser,
  completeOnboarding,
  changePassword,
  verifyUserEmail,
  deleteUser
} = require('../controllers/account');

const router = express.Router();

router.use(authMiddleware);

router.get('/user/:id', getUserById);
router.get('/me', getCurrentUser);
router.get('/all', getAllUsers);
router.put('/update/:id', updateUser);
router.post('/onboarding', completeOnboarding);
router.post('/change-password', changePassword);
router.post('/verify-email', verifyUserEmail);
router.delete('/delete/:id', deleteUser);

module.exports = router;