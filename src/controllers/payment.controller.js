// Remove Pinecone references and replace with PostgreSQL-based logic
const { User } = require('../models/postgres');

// In-memory payment storage (in production, you might want to use a database)
let payments = {};
let nextPaymentId = 1;

// Get all payments
exports.getAllPayments = async (req, res) => {
  try {
    const paymentList = Object.values(payments);
    res.json(paymentList);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = payments[id];
    
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    
    res.json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ error: error.message });
  }
};

// Create new payment
exports.createPayment = async (req, res) => {
  try {
    const paymentData = req.body;
    const paymentId = `payment_${nextPaymentId++}`;
    
    const payment = {
      id: paymentId,
      ...paymentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    payments[paymentId] = payment;
    
    res.status(201).json(payment);
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update payment
exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const paymentData = req.body;
    
    if (!payments[id]) {
      return res.status(404).json({ error: "Payment not found" });
    }
    
    const updatedPayment = {
      ...payments[id],
      ...paymentData,
      id: id,
      updatedAt: new Date().toISOString()
    };
    
    payments[id] = updatedPayment;
    
    res.json(updatedPayment);
  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).json({ error: error.message });
  }
};

// Delete payment
exports.deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!payments[id]) {
      return res.status(404).json({ error: "Payment not found" });
    }
    
    delete payments[id];
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting payment:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get payments by status
exports.getPaymentsByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    
    if (!status) {
      return res.status(400).json({ error: "Status parameter is required" });
    }
    
    const matchingPayments = Object.values(payments).filter(payment => 
      payment.status.toLowerCase() === status.toLowerCase()
    );
    
    res.json(matchingPayments);
  } catch (error) {
    console.error("Error fetching payments by status:", error);
    res.status(500).json({ error: error.message });
  }
};

// Search similar payments (Stubbed out Pinecone)
exports.searchSimilarPayments = async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error("Error searching similar payments:", error);
    res.status(500).json({ error: error.message });
  }
};
