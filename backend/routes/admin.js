// backend/routes/admin.js
const express = require('express');
const authMiddleware = require('../Middlewares/auth');
const adminMiddleware = require('../Middlewares/admin'); // You'll need to create this
const { 
  getAdminDashboard,
  getAllAds,
  getAdminAdDetails,
  updateAdStatus,
  getAllUsers,
  getSystemStats
} = require('../controllers/admin');

const router = express.Router();

// All routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// Admin Dashboard Routes
router.get('/overview', getAdminDashboard);
router.get('/ads', getAllAds);
router.get('/ads/:adId', getAdminAdDetails);
router.patch('/ads/:adId/status', updateAdStatus);
router.get('/users', getAllUsers);
router.get('/stats', getSystemStats);

module.exports = router;