const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExpenseCategory = sequelize.define('ExpenseCategory', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    color: { type: DataTypes.STRING(20), defaultValue: '#ef4444' },
}, { tableName: 'expense_categories', timestamps: false });

module.exports = ExpenseCategory;