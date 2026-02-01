const { Product } = require("../models/postgres");
const { Sequelize } = require("sequelize");
const { upload } = require("../config/cloudinary");

// Auth check middleware for admin, pass (req, res, next)
const isAdmin = (req, res, next) => {
  console.log("isAdmin middleware called");

  // If ADMIN_TOKEN is not set, allow all requests (development mode)
  if (!process.env.ADMIN_TOKEN) {
    console.log("No ADMIN_TOKEN set - allowing request (development mode)");
    return next();
  }

  const token = req.header("x-admin-token");
  console.log("Token from header:", token);

  if (!token || token !== process.env.ADMIN_TOKEN) {
    console.log("Authentication failed");
    return res.status(401).json({ message: "Not authenticated" });
  }

  console.log("Authentication successful");
  next();
};

exports.isAdmin = isAdmin;

// Middleware for handling multiple media uploads (images and videos)
exports.uploadMedia = upload.array("media", 10);

// Controller for general media upload (returns URLs)
exports.handleUpload = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const media = req.files.map((file) => ({
      url: file.path,
      type: file.mimetype.startsWith("video/") ? "video" : "image",
      public_id: file.filename,
    }));

    res.json({ media });
  } catch (error) {
    console.error("Upload handler error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

// Public: search products
exports.searchProducts = async (req, res) => {
  try {
    // Check if Product model is available
    if (!Product) {
      return res.status(503).json({
        message: "Database service unavailable",
        error: "Product model not available",
      });
    }

    const { q } = req.query;
    console.log("Search query received:", q);

    if (!q || q.trim() === "") {
      console.log("Empty search query, returning empty array");
      return res.json([]);
    }

    // Escape special regex characters to prevent regex errors
    const escapedQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedQuery, "i");
    console.log("Search regex:", searchRegex);

    const products = await Product.findAll({
      where: {
        [Sequelize.Op.or]: [
          { name: { [Sequelize.Op.iLike]: `%${q}%` } },
          { category: { [Sequelize.Op.iLike]: `%${q}%` } },
          { description: { [Sequelize.Op.iLike]: `%${q}%` } },
        ],
      },
    });

    console.log(`Found ${products.length} products for query: ${q}`);
    res.json(products);
  } catch (error) {
    console.error("Search error:", error);
    // Check if it's a database connection error
    if (
      error.message.includes("connect") ||
      error.message.includes("database")
    ) {
      return res.status(503).json({
        message: "Database service unavailable",
        error: "Unable to connect to database",
      });
    }
    res
      .status(500)
      .json({ message: "Error searching products", error: error.message });
  }
};

// Public: get all products
exports.getAllProducts = async (req, res) => {
  try {
    // Check if Product model is available
    if (!Product) {
      return res.status(503).json({
        message: "Database service unavailable",
        error: "Product model not available",
      });
    }

    const products = await Product.findAll();
    console.log("DEBUG: First product structure:", products.length > 0 ? JSON.stringify(products[0], null, 2) : "No products found");
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    // Check if it's a database connection error
    if (
      error.message.includes("connect") ||
      error.message.includes("database")
    ) {
      return res.status(503).json({
        message: "Database service unavailable",
        error: "Unable to connect to database",
      });
    }
    res.status(500).json({
      message: "Error fetching products",
      error: error.message,
      // Don't expose sensitive error details in production
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    // Check if Product model is available
    if (!Product) {
      return res.status(503).json({
        message: "Database service unavailable",
        error: "Product model not available",
      });
    }

    const { id } = req.params;
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    // Check if it's a database connection error
    if (
      error.message.includes("connect") ||
      error.message.includes("database")
    ) {
      return res.status(503).json({
        message: "Database service unavailable",
        error: "Unable to connect to database",
      });
    }
    res
      .status(500)
      .json({ message: "Error fetching product", error: error.message });
  }
};

// Admin: create product
exports.createProduct = async (req, res) => {
  try {
    console.log("createProduct called");
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);

    // Check if Product model is available
    if (!Product) {
      console.log("Product model not available");
      return res.status(503).json({
        message: "Database service unavailable",
        error: "Product model not available",
      });
    }

    let mediaItems = [];

    if (req.files && req.files.length > 0) {
      const { targetWidth, targetHeight } = req.body;
      
      mediaItems = req.files.map(file => {
        const isVideo = file.mimetype.startsWith("video/");
        let url = file.path;

        // Apply resizing transformations for images if requested
        if (!isVideo && (targetWidth || targetHeight)) {
          // Extract public_id from Cloudinary URL or path
          // file.filename is often the public_id in multer-storage-cloudinary
          const publicId = file.filename;
          const { getTransformedUrl } = require("../config/cloudinary");
          url = getTransformedUrl(publicId, targetWidth, targetHeight);
        }

        return {
          url: url,
          type: isVideo ? "video" : "image",
          public_id: file.filename
        };
      });
    } else {
      return res.status(400).json({
        message: "At least one image or video is required for product creation.",
      });
    }

    console.log("Processed media items:", JSON.stringify(mediaItems, null, 2));

    // Validate required fields - handle both string and FormData submissions
    const { name, originalPrice, discountedPrice, description, category, quantity, rating, sku } =
      req.body;

    // More flexible validation
    if (!name || name.trim() === "") {
      console.log("Missing required field: name");
      return res.status(400).json({ message: "Product name is required" });
    }

    if (
      originalPrice === undefined ||
      originalPrice === null ||
      originalPrice === ""
    ) {
      console.log("Missing required field: originalPrice");
      return res.status(400).json({ message: "Original price is required" });
    }

    if (
      discountedPrice === undefined ||
      discountedPrice === null ||
      discountedPrice === ""
    ) {
      console.log("Missing required field: discountedPrice");
      return res.status(400).json({ message: "Discounted price is required" });
    }

    if (!mediaItems || mediaItems.length === 0) {
      console.log("Missing required field: media");
      return res.status(400).json({ message: "Product media is required" });
    }

    if (!description || description.trim() === "") {
      console.log("Missing required field: description");
      return res
        .status(400)
        .json({ message: "Product description is required" });
    }

    if (!category || category.trim() === "") {
      console.log("Missing required field: category");
      return res.status(400).json({ message: "Product category is required" });
    }

    // Validate numeric fields
    const parsedOriginalPrice = parseFloat(originalPrice);
    const parsedDiscountedPrice = parseFloat(discountedPrice);

    if (isNaN(parsedOriginalPrice)) {
      console.log("Invalid originalPrice:", originalPrice);
      return res
        .status(400)
        .json({ message: "Original price must be a valid number" });
    }

    if (isNaN(parsedDiscountedPrice)) {
      console.log("Invalid discountedPrice:", discountedPrice);
      return res
        .status(400)
        .json({ message: "Discounted price must be a valid number" });
    }

    const productData = {
      name: name.trim(),
      originalPrice: parsedOriginalPrice,
      discountedPrice: parsedDiscountedPrice,
      media: mediaItems,
      quantity: parseInt(quantity) || 0,
      description: description.trim(),
      category: category.trim(),
      rating: parseFloat(rating) || 4.5,
      reviews: 0,
      sku: sku || null,
    };

    console.log("Creating product with data:", productData);

    const savedProduct = await Product.create(productData);

    console.log("Product created successfully:", savedProduct.id);

    res.status(201).json(savedProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    // Check if it's a database connection error
    if (
      error.message.includes("connect") ||
      error.message.includes("database")
    ) {
      return res.status(503).json({
        message: "Database service unavailable",
        error: "Unable to connect to database",
      });
    }
    res
      .status(500)
      .json({ message: "Error creating product", error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    // Check if Product model is available
    if (!Product) {
      return res.status(503).json({
        message: "Database service unavailable",
        error: "Product model not available",
      });
    }

    const { id } = req.params;
    const { targetWidth, targetHeight } = req.body;

    // Process new files if any
    let mediaItems = [];
    if (req.body.media) {
      try {
        mediaItems = typeof req.body.media === 'string' ? JSON.parse(req.body.media) : req.body.media;
      } catch (e) {
        mediaItems = [];
      }
    }

    if (req.files && req.files.length > 0) {
      const newMedia = req.files.map(file => {
        const isVideo = file.mimetype.startsWith("video/");
        let url = file.path;

        if (!isVideo && (targetWidth || targetHeight)) {
          const publicId = file.filename;
          const { getTransformedUrl } = require("../config/cloudinary");
          url = getTransformedUrl(publicId, targetWidth, targetHeight);
        }

        return {
          url: url,
          type: isVideo ? "video" : "image",
          public_id: file.filename
        };
      });
      mediaItems = [...mediaItems, ...newMedia];
    }

    // Validate required fields
    const { name, originalPrice, discountedPrice, description, category, quantity, rating, sku } =
      req.body;

    // More flexible validation
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Product name is required" });
    }

    if (
      originalPrice === undefined ||
      originalPrice === null ||
      originalPrice === ""
    ) {
      return res.status(400).json({ message: "Original price is required" });
    }

    if (
      discountedPrice === undefined ||
      discountedPrice === null ||
      discountedPrice === ""
    ) {
      return res.status(400).json({ message: "Discounted price is required" });
    }

    if (!description || description.trim() === "") {
      return res
        .status(400)
        .json({ message: "Product description is required" });
    }

    if (!category || category.trim() === "") {
      return res.status(400).json({ message: "Product category is required" });
    }

    // Validate numeric fields
    const parsedOriginalPrice = parseFloat(originalPrice);
    const parsedDiscountedPrice = parseFloat(discountedPrice);

    if (isNaN(parsedOriginalPrice)) {
      return res
        .status(400)
        .json({ message: "Original price must be a valid number" });
    }

    if (isNaN(parsedDiscountedPrice)) {
      return res
        .status(400)
        .json({ message: "Discounted price must be a valid number" });
    }

    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updateData = {
      name: name.trim(),
      originalPrice: parsedOriginalPrice,
      discountedPrice: parsedDiscountedPrice,
      description: description.trim(),
      category: category.trim(),
      quantity: parseInt(quantity) || 0,
      rating: parseFloat(rating) || product.rating,
      sku: sku || product.sku,
      updatedAt: new Date(),
    };

    // Update media if provided or files uploaded
    if (mediaItems && mediaItems.length > 0) {
      updateData.media = mediaItems;
    }

    const [updatedRowsCount, updatedProducts] = await Product.update(
      updateData,
      {
        where: { id },
        returning: true,
      }
    );
    const updatedProduct = updatedProducts[0];

    if (!updatedProduct)
      return res.status(404).json({ message: "Product not found" });

    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    // Check if it's a database connection error
    if (
      error.message.includes("connect") ||
      error.message.includes("database")
    ) {
      return res.status(503).json({
        message: "Database service unavailable",
        error: "Unable to connect to database",
      });
    }
    res
      .status(500)
      .json({ message: "Error updating product", error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    // Check if Product model is available
    if (!Product) {
      return res.status(503).json({
        message: "Database service unavailable",
        error: "Product model not available",
      });
    }

    const { id } = req.params;
    console.log("Attempting to delete product with ID:", id);

    // Check if ID is valid
    if (!id) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const deletedProduct = await Product.findByPk(id);
    if (deletedProduct) {
      await Product.destroy({ where: { id } });
    }

    if (!deletedProduct) {
      console.log("Product not found with ID:", id);
      return res.status(404).json({ message: "Product not found" });
    }

    console.log("Product deleted successfully:", deletedProduct._id);
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    // Check if it's a database connection error
    if (
      error.message.includes("connect") ||
      error.message.includes("database")
    ) {
      return res.status(503).json({
        message: "Database service unavailable",
        error: "Unable to connect to database",
      });
    }
    res
      .status(500)
      .json({ message: "Error deleting product", error: error.message });
  }
};
