const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Validate that credentials exist
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
  console.error("❌ ERROR: Cloudinary ENV variables missing!");
} else {
  console.log("✅ Cloudinary connected");
}

// Cloudinary storage engine
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "saajjewels_products",
    allowed_formats: ["jpg", "png", "jpeg", "gif"],
  },
});

// Multer uploader
const upload = multer({ storage });

module.exports = { cloudinary, upload };