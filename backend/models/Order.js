const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    order_number: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    customer_id: { type: DataTypes.INTEGER, allowNull: false },
    delivery_area_id: { type: DataTypes.INTEGER },
    address: { type: DataTypes.TEXT, allowNull: false },
    additional_instructions: { type: DataTypes.TEXT },
    payment_method: {
        type: DataTypes.ENUM('cash_on_delivery', 'easypaisa', 'bank_transfer'),
        defaultValue: 'cash_on_delivery',
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'paid'),
        defaultValue: 'pending',
    },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    delivery_charge: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, { tableName: 'orders', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = Order;