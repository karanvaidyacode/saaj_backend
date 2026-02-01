const { Product } = require('../models/postgres');
const { Sequelize } = require('sequelize');

// Get all inventory items (actually products with stock info)
exports.getAllInventory = async (req, res) => {
  try {
    const products = await Product.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(products);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get inventory item by ID
exports.getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ error: "Inventory item not found" });
    }
    
    res.json(product);
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    res.status(500).json({ error: error.message });
  }
};

// Since inventory is now part of Product, we might not need separate create/delete here
// but we'll include them for parity with the existing routes if they are used specifically for inventory management.
exports.createInventoryItem = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating inventory item:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Product.update(req.body, { where: { id } });
    
    if (!updated) {
      return res.status(404).json({ error: "Inventory item not found" });
    }
    
    const updatedProduct = await Product.findByPk(id);
    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating inventory item:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.destroy({ where: { id } });
    
    if (!deleted) {
      return res.status(404).json({ error: "Inventory item not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get inventory overview
exports.getInventoryOverview = async (req, res) => {
  try {
    const totalProducts = await Product.count();
    const inStock = await Product.count({ where: { quantity: { [Sequelize.Op.gt]: 10 } } });
    const lowStock = await Product.count({ where: { quantity: { [Sequelize.Op.between]: [1, 10] } } });
    const outOfStock = await Product.count({ where: { quantity: 0 } });
    
    // Get stats by category
    const categoryStats = await Product.findAll({
      attributes: [
        'category',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.literal(`COUNT(CASE WHEN quantity > 10 THEN 1 END)`), 'inStock'],
        [Sequelize.literal(`COUNT(CASE WHEN quantity > 0 AND quantity <= 10 THEN 1 END)`), 'lowStock'],
        [Sequelize.literal(`COUNT(CASE WHEN quantity = 0 THEN 1 END)`), 'outOfStock']
      ],
      group: ['category']
    });
    
    res.json({
      totalProducts,
      inStock,
      lowStock,
      outOfStock,
      categories: categoryStats
    });
  } catch (error) {
    console.error('Error fetching inventory overview:', error);
    res.status(500).json({ message: 'Error fetching inventory overview', error: error.message });
  }
};

// Get low stock items
exports.getLowStockItems = async (req, res) => {
  try {
    const lowStockItems = await Product.findAll({
      where: {
        quantity: {
          [Sequelize.Op.lte]: 10
        }
      }
    });
    res.json(lowStockItems);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ message: 'Error fetching low stock items', error: error.message });
  }
};

// Update stock level specifically
exports.updateStockLevel = async (req, res) => {
  try {
    const { productId, newStockLevel } = req.body;
    const [updated] = await Product.update({ quantity: newStockLevel }, { where: { id: productId } });
    
    if (!updated) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({
      success: true,
      message: `Stock level updated for product ${productId}`,
      productId,
      newStockLevel
    });
  } catch (error) {
    console.error('Error updating stock level:', error);
    res.status(500).json({ message: 'Error updating stock level', error: error.message });
  }
};

// Search similar inventory items using DB search
exports.searchSimilarItems = async (req, res) => {
  try {
    const { query } = req.body;
    const products = await Product.findAll({
      where: {
        [Sequelize.Op.or]: [
          { name: { [Sequelize.Op.iLike]: `%${query}%` } },
          { category: { [Sequelize.Op.iLike]: `%${query}%` } },
          { sku: { [Sequelize.Op.iLike]: `%${query}%` } }
        ]
      }
    });
    res.json(products);
  } catch (error) {
    console.error("Error searching items:", error);
    res.status(500).json({ error: error.message });
  }
};
