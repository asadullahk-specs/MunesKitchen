const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Cache the connection for serverless environments (Vercel)
let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/munes_kitchen', {
            bufferCommands: false,
        });
        isConnected = conn.connections[0].readyState === 1;
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
            console.log('✨ Default admin user seeded.');
        }
    } catch (error) {
        console.error(`❌ MongoDB connection failed: ${error.message}`);
        isConnected = false;
    }
};

module.exports = connectDB;