const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    order_id: { type: DataTypes.INTEGER, allowNull: false },
    method: { type: DataTypes.ENUM('cash_on_delivery', 'easypaisa', 'bank_transfer'), allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'confirmed', 'failed'), defaultValue: 'pending' },
    reference: { type: DataTypes.STRING(200) },
}, { tableName: 'payments', timestamps: true, createdAt: 'created_at', updatedAt: false });

module.exports = Payment;