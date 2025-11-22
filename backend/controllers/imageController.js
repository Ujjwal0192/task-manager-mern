const cloudinary = require("../config/cloudinary");
const multer = require("multer");

// use memory storage (no local permanent storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image provided" });
    }

    const result = await cloudinary.uploader.upload_stream(
      { folder: "taskmanager/profile_pics" },
      (error, result) => {
        if (error) {
          return res.status(500).json({ message: "Cloudinary upload failed" });
        }

        return res.status(200).json({
          imageUrl: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    result.end(req.file.buffer);
  } catch (error) {
    console.error("Cloudinary error:", error);
    res.status(500).json({ message: "Image upload failed" });
  }
};

module.exports = { upload, uploadImage };
