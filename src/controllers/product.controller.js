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

// Middleware for handling image upload
exports.uploadImage = upload.single("image");

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
    console.log("Request file:", req.file);

    // Check if Product model is available
    if (!Product) {
      console.log("Product model not available");
      return res.status(503).json({
        message: "Database service unavailable",
        error: "Product model not available",
      });
    }

    let imagePath;

    if (req.file) {
      // Check if it's a Cloudinary upload (has path) or memory storage (buffer)
      if (req.file.path) {
        // Cloudinary upload succeeded
        imagePath = req.file.path;
      } else if (req.file.buffer) {
        // Memory storage - for now we'll reject this and require proper Cloudinary setup
        return res.status(400).json({
          message:
            "Image upload failed. Please ensure Cloudinary is properly configured.",
        });
      } else {
        return res.status(400).json({
          message: "Image upload failed. Please upload a valid image.",
        });
      }
    } else {
      return res.status(400).json({
        message: "Image is required for product creation.",
      });
    }

    console.log("Final image path:", imagePath);

    // Validate required fields - handle both string and FormData submissions
    const { name, originalPrice, discountedPrice, description, category } =
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

    if (!imagePath || imagePath.trim() === "") {
      console.log("Missing required field: image");
      return res.status(400).json({ message: "Product image is required" });
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
      image: imagePath.trim(),
      description: description.trim(),
      category: category.trim(),
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

    // If image was uploaded, use Cloudinary URL, otherwise use provided image URL
    let imagePath = req.body.image;

    if (req.file) {
      // Image was uploaded to Cloudinary
      imagePath = req.file.path;
    } else if (imagePath && imagePath.startsWith("blob:")) {
      // Replace blob URLs with placeholder
      imagePath = "/images/placeholder.jpg";
    }

    // Validate required fields - handle both string and FormData submissions
    const { name, originalPrice, discountedPrice, description, category } =
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

    const updateData = {
      name: name.trim(),
      originalPrice: parsedOriginalPrice,
      discountedPrice: parsedDiscountedPrice,
      description: description.trim(),
      category: category.trim(),
      updatedAt: new Date(),
    };

    // Only update image if a new one was provided
    if (imagePath && imagePath.trim() !== "") {
      updateData.image = imagePath.trim();
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
