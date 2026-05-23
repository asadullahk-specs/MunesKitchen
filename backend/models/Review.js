const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    customer_name: { type: DataTypes.STRING(150), allowNull: false },
    product_id: { type: DataTypes.INTEGER },
    rating: { type: DataTypes.INTEGER, allowNull: false },
    message: { type: DataTypes.TEXT },
    special_instructions: { type: DataTypes.TEXT, allowNull: true },
    images: { type: DataTypes.TEXT, allowNull: true },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
    },
}, { tableName: 'reviews', timestamps: true, createdAt: 'created_at', updatedAt: false });

module.exports = Review;