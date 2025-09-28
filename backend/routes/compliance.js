const express = require('express');
const authMiddleware = require('../Middlewares/auth');
const multer = require('multer');
const { uploadAd, getAdStatus,  
  getUserReports,
  getAllReports,
  approveAdvertisement,
  rejectAdvertisement } = require('../controllers/compliance');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'video/mov'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// All routes require authentication
router.use(authMiddleware);

// Upload advertisement with media files
router.post('/upload', 
  (req, res, next) => {
    upload.array('files', 10)(req, res, (err) => {
      if (err) {
        return res.status(400).json({ 
          success: false, 
          message: err.message 
        });
      }
      next();
    });
  },
  uploadAd
);

// Get advertisement status
router.get('/:adId/status', getAdStatus);

// Get current user's reports
router.get('/my-reports', getUserReports);

// Get all reports (admin)
router.get('/all-reports', getAllReports);

// Approve advertisement
router.post('/approve/:analysisResultsId', approveAdvertisement);

// Reject advertisement
router.post('/reject/:analysisResultsId', rejectAdvertisement);

module.exports = router;