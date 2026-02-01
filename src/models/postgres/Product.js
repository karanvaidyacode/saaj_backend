const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  discountedPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  media: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 4.5
  },
  reviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  sku: {
    type: DataTypes.STRING,
    unique: true
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
}, {
  timestamps: true,
  tableName: 'products'
});

module.exports = Product;