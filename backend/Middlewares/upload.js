const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Custom Storage for Dynamic Folder Uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Extract folder from request body (AFTER multer middleware)
    const folder = req.query.folder || "all"; // Change from `req.body.folder` to `req.query.folder`

    return {
      folder: folder, // Upload to the specified folder
      format: file.mimetype.split("/")[1], // Keep original format (jpg, png, etc.)
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`, // Unique filename
    };
  },
});

const upload = multer({ storage });

module.exports = { upload, cloudinary };
