const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/munes_kitchen');
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        
        // Auto-seed default admin account if none exists
        const Admin = require('../models/Admin');
        const adminCount = await Admin.countDocuments({});
        if (adminCount === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await Admin.create({
                name: 'Mune Admin',
                email: 'admin@muneskitchen.com',
                password: hashedPassword
            });
            console.log('✨ Default admin user seeded successfully in MongoDB (email: admin@muneskitchen.com, password: admin123).');
        }
    } catch (error) {
        console.error(`❌ MongoDB connection failed: ${error.message}`);
        console.log('👉 Please ensure MongoDB is running locally or specify a valid MONGODB_URI in your backend/.env file.');
    }
};

module.exports = connectDB;