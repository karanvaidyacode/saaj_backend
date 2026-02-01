const { CustomOrder } = require('../models/postgres');
const { Sequelize } = require('sequelize');

// Get all custom orders
exports.getAllCustomOrders = async (req, res) => {
  try {
    const orders = await CustomOrder.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching custom orders:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get custom order by ID
exports.getCustomOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await CustomOrder.findByPk(id);
    
    if (!order) {
      return res.status(404).json({ error: "Custom order not found" });
    }
    
    res.json(order);
  } catch (error) {
    console.error("Error fetching custom order:", error);
    res.status(500).json({ error: error.message });
  }
};

// Create new custom order
exports.createCustomOrder = async (req, res) => {
  try {
    const orderData = req.body;
    const order = await CustomOrder.create({
      ...orderData,
      status: 'pending'
    });
    
    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating custom order:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update custom order
exports.updateCustomOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await CustomOrder.update(req.body, { where: { id } });
    
    if (!updated) {
      return res.status(404).json({ error: "Custom order not found" });
    }
    
    const updatedOrder = await CustomOrder.findByPk(id);
    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating custom order:", error);
    res.status(500).json({ error: error.message });
  }
};

// Delete custom order
exports.deleteCustomOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await CustomOrder.destroy({ where: { id } });
    
    if (!deleted) {
      return res.status(404).json({ error: "Custom order not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting custom order:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update custom order status
exports.updateCustomOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const [updated] = await CustomOrder.update({ status }, { where: { id } });
    
    if (!updated) {
      return res.status(404).json({ error: "Custom order not found" });
    }
    
    const updatedOrder = await CustomOrder.findByPk(id);
    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating custom order status:", error);
    res.status(500).json({ error: error.message });
  }
};

// Search similar custom orders using DB
exports.searchSimilarCustomOrders = async (req, res) => {
  try {
    const { query } = req.body;
    const orders = await CustomOrder.findAll({
      where: {
        [Sequelize.Op.or]: [
          { customerName: { [Sequelize.Op.iLike]: `%${query}%` } },
          { customerEmail: { [Sequelize.Op.iLike]: `%${query}%` } },
          { designDescription: { [Sequelize.Op.iLike]: `%${query}%` } }
        ]
      }
    });
    res.json(orders);
  } catch (error) {
    console.error("Error searching custom orders:", error);
    res.status(500).json({ error: error.message });
  }
};
