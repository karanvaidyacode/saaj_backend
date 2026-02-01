const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const CustomOrder = sequelize.define('CustomOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  customerEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  customerPhone: {
    type: DataTypes.STRING
  },
  designDescription: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  materials: {
    type: DataTypes.JSON, // Array of strings
    defaultValue: []
  },
  budgetRange: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('pending', 'consulting', 'designing', 'production', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  referenceImages: {
    type: DataTypes.JSON, // Array of image URLs
    defaultValue: []
  }
}, {
  timestamps: true,
  tableName: 'custom_orders'
});

module.exports = CustomOrder;
