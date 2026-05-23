const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    order_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    product_name: { type: DataTypes.STRING(200), allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    unit_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, { tableName: 'order_items', timestamps: false });

module.exports = OrderItem;