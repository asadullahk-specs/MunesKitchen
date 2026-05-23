const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Contact = sequelize.define('Contact', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'contacts', timestamps: true, createdAt: 'created_at', updatedAt: false });

module.exports = Contact;