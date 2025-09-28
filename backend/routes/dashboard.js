// backend/routes/dashboard.js
const express = require('express');
const authMiddleware = require('../Middlewares/auth');
const { 
  getUserDashboard,
  getUserAds,
  getAdDetails,
  getUserNotifications,
  markNotificationRead
} = require('../controllers/dashboard');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// User Dashboard Routes
router.get('/user/overview', getUserDashboard);
router.get('/user/ads', getUserAds);
router.get('/user/ads/:adId', getAdDetails);
router.get('/user/notifications', getUserNotifications);
router.patch('/user/notifications/:id/read', markNotificationRead);


module.exports = router;