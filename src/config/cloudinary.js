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
const fetch = require("node-fetch");

let timeOffset = null;

async function getTimeOffset() {
  if (timeOffset !== null) return timeOffset;
  try {
    const start = Date.now();
    const res = await fetch("https://www.google.com", { method: "HEAD", timeout: 5000 });
    const serverDate = new Date(res.headers.get("date"));
    const end = Date.now();
    // Adjust for network latency (approx half of RTT)
    const latency = (end - start) / 2;
    const items = serverDate.getTime() + latency;
    const local = Date.now();
    timeOffset = Math.round((items - local) / 1000);
    console.log(`Cloudinary: Time offset calculated: ${timeOffset} seconds (System lag)`);
  } catch (error) {
    console.error("Cloudinary: Time sync failed, using fallback offset of 4200s (70 mins)", error.message);
    timeOffset = 4200; // Fallback based on observed lag
  }
  return timeOffset;
}

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith("video/");
    
    // Ensure we have a valid time offset
    const offset = await getTimeOffset();
    const now = Math.round(Date.now() / 1000) + offset;
    
    console.log(`Cloudinary Upload: Processing ${file.originalname}, Timestamp: ${now} (Offset: ${offset}s)`);
    
    return {
      folder: "saajjewels_media",
      resource_type: isVideo ? "video" : "image",
      timestamp: now,
      format: isVideo ? "mp4" : undefined,
      allowed_formats: ["jpg", "png", "jpeg", "gif", "mp4", "mov", "avi"],
    };
  },
});

// Multer uploader for multiple files
const upload = multer({ storage });

/**
 * Generates transformed URL based on target dimensions
 * @param {string} publicId - The public ID of the resource
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @returns {string} - Transformed URL
 */
const getTransformedUrl = (publicId, width, height) => {
  return cloudinary.url(publicId, {
    width: width ? parseInt(width) : undefined,
    height: height ? parseInt(height) : undefined,
    crop: "limit",
    secure: true
  });
};

module.exports = { cloudinary, upload, getTransformedUrl };
