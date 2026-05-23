const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    full_name: { type: DataTypes.STRING(150), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    email: { type: DataTypes.STRING(150) },
}, { tableName: 'customers', timestamps: true, createdAt: 'created_at', updatedAt: false });

module.exports = Customer;