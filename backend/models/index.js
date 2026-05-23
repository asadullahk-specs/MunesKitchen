const { sequelize } = require('../config/database');

const Admin = require('./Admin');
const Category = require('./Category');
const Product = require('./Product');
const Customer = require('./Customer');
const DeliveryArea = require('./DeliveryArea');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Review = require('./Review');
const ExpenseCategory = require('./ExpenseCategory');
const Expense = require('./Expense');
const Contact = require('./Contact');
const Payment = require('./Payment');

// Category <-> Product
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Customer <-> Order
Customer.hasMany(Order, { foreignKey: 'customer_id', as: 'orders' });
Order.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

// DeliveryArea <-> Order
DeliveryArea.hasMany(Order, { foreignKey: 'delivery_area_id', as: 'orders' });
Order.belongsTo(DeliveryArea, { foreignKey: 'delivery_area_id', as: 'deliveryArea' });

// Order <-> OrderItem
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Product <-> OrderItem
Product.hasMany(OrderItem, { foreignKey: 'product_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Product <-> Review
Product.hasMany(Review, { foreignKey: 'product_id', as: 'reviews' });
Review.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// ExpenseCategory <-> Expense
ExpenseCategory.hasMany(Expense, { foreignKey: 'expense_category_id', as: 'expenses' });
Expense.belongsTo(ExpenseCategory, { foreignKey: 'expense_category_id', as: 'category' });

// Order <-> Payment
Order.hasOne(Payment, { foreignKey: 'order_id', as: 'payment' });
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

module.exports = {
    sequelize,
    Admin,
    Category,
    Product,
    Customer,
    DeliveryArea,
    Order,
    OrderItem,
    Review,
    ExpenseCategory,
    Expense,
    Contact,
    Payment,
};