const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Expense = sequelize.define('Expense', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    expense_category_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    note: { type: DataTypes.TEXT },
    date: { type: DataTypes.DATEONLY, allowNull: false },
}, { tableName: 'expenses', timestamps: true, createdAt: 'created_at', updatedAt: false });

module.exports = Expense;