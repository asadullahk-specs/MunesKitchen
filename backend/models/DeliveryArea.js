const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeliveryArea = sequelize.define('DeliveryArea', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(150), allowNull: false }
}, {
    tableName: 'delivery_areas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = DeliveryArea;