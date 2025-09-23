const uploadFile = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
  
      const uploadedFile = req.file.path; // Cloudinary URL
  
      return res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        url: uploadedFile,
        folder: req.body.folder || "general", // Return the folder name
      });
    } catch (error) {
      console.error("Upload Error:", error);
      return res.status(500).json({ success:false, error: "File upload failed" });
    }
  };
  
  module.exports = { uploadFile };
  