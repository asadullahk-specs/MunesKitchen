const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    slug: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    icon: { type: DataTypes.STRING(100) },
}, { tableName: 'categories', timestamps: true, createdAt: 'created_at', updatedAt: false });

module.exports = Category;