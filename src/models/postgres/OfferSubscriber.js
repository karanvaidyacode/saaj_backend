const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const OfferSubscriber = sequelize.define('OfferSubscriber', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  couponClaimed: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  couponCode: {
    type: DataTypes.STRING,
    defaultValue: 'SAAJ10'
  }
}, {
  timestamps: true,
  tableName: 'offer_subscribers'
});

module.exports = OfferSubscriber;
