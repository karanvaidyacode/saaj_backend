// Remove Pinecone references and replace with PostgreSQL-based logic
const { User } = require("../models/postgres");

// Mock branding settings since we're removing Pinecone
let brandingSettings = {
  siteName: "Saaj Jewels",
  logoUrl: "/logo.jpg",
  primaryColor: "#c6a856",
  secondaryColor: "#f5f5f5",
  fontFamily: "Arial, sans-serif",
  faviconUrl: "/favicon.ico",
  contactEmail: "info@saajjewels.com",
  contactPhone: "+1234567890",
  socialLinks: {
    facebook: "https://facebook.com/saajjewels",
    instagram: "https://instagram.com/saajjewels",
    twitter: "https://twitter.com/saajjewels",
  },
};

// Get branding settings
exports.getBrandingSettings = async (req, res) => {
  try {
    res.json(brandingSettings);
  } catch (error) {
    console.error("Error fetching branding settings:", error);
    res
      .status(500)
      .json({
        message: "Error fetching branding settings",
        error: error.message,
      });
  }
};

// Update branding settings
exports.updateBrandingSettings = async (req, res) => {
  try {
    const updatedSettings = { ...brandingSettings, ...req.body };
    brandingSettings = updatedSettings;

    res.json({
      success: true,
      message: "Branding settings updated successfully",
      settings: brandingSettings,
    });
  } catch (error) {
    console.error("Error updating branding settings:", error);
    res
      .status(500)
      .json({
        message: "Error updating branding settings",
        error: error.message,
      });
  }
};

// Reset branding settings to defaults
exports.resetBrandingSettings = async (req, res) => {
  try {
    brandingSettings = {
      siteName: "Saaj Jewels",
      logoUrl: "/logo.png",
      primaryColor: "#c6a856",
      secondaryColor: "#f5f5f5",
      fontFamily: "Arial, sans-serif",
      faviconUrl: "/favicon.ico",
      contactEmail: "info@saajjewels.com",
      contactPhone: "+1234567890",
      socialLinks: {
        facebook: "https://facebook.com/saajjewels",
        instagram: "https://instagram.com/saajjewels",
        twitter: "https://twitter.com/saajjewels",
      },
    };

    res.json({
      success: true,
      message: "Branding settings reset to defaults",
      settings: brandingSettings,
    });
  } catch (error) {
    console.error("Error resetting branding settings:", error);
    res
      .status(500)
      .json({
        message: "Error resetting branding settings",
        error: error.message,
      });
  }
};

// Search similar branding configurations (Stubbed out Pinecone)
exports.searchSimilarBranding = async (req, res) => {
  try {
    // Pinecone removed - returning empty results or current settings if name matches
    res.json([]);
  } catch (error) {
    console.error("Error searching similar branding:", error);
    res.status(500).json({ error: error.message });
  }
};

