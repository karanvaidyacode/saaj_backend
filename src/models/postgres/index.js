// Import all models
const Product = require('./Product');
const User = require('./User');
const Order = require('./Order');
const Customer = require('./Customer');

// Export models with graceful degradation
let models = {
  Product,
  User,
  Order,
  Customer
};

// Try to initialize associations if database is available
try {
  // Product associations
  if (Product && typeof Product.associate === 'function') {
    Product.associate(models);
  }
  
  // User associations
  if (User && typeof User.associate === 'function') {
    User.associate(models);
  }
  
  // Order associations
  if (Order && typeof Order.associate === 'function') {
    Order.associate(models);
  }
  
  // Customer associations
  if (Customer && typeof Customer.associate === 'function') {
    Customer.associate(models);
  }
} catch (error) {
  console.warn('Warning: Could not initialize model associations due to database connection issues');
  console.warn('Error:', error.message);
}

module.exports = models;