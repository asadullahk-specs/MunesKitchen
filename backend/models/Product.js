const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    category_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    image: { type: DataTypes.STRING(500) },
    hot_selling: { type: DataTypes.BOOLEAN, defaultValue: false },
    show_on_menu: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'products', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = Product;