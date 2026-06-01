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

        // Auto-seed default admin accounts
        const Admin = require('../models/Admin');
        
        // Remove old admin account completely
        await Admin.deleteMany({ email: 'admin@muneskitchen.com' });
        
        const defaultAdmins = [
            { name: 'Asadullah Khan', email: 'asadullahk@admin1.muneskitchen', password: 'admin#1@kitchen' },
            { name: 'Sameer Khan', email: 'sameerk@admin2.muneskitchen', password: 'admin#2@kitchen' },
            { name: 'Munes Admin', email: 'munes@admin3.muneskitchen', password: 'admin#3@kitchen' }
        ];

        for (const adminData of defaultAdmins) {
            const existing = await Admin.findOne({ email: adminData.email });
            const hashedPassword = await bcrypt.hash(adminData.password, 10);
            if (!existing) {
                await Admin.create({
                    name: adminData.name,
                    email: adminData.email,
                    password: hashedPassword
                });
                console.log(`✨ Admin user seeded: ${adminData.email}`);
            } else {
                await Admin.updateOne({ email: adminData.email }, { name: adminData.name, password: hashedPassword });
            }
        }
    } catch (error) {
        console.error(`❌ MongoDB connection failed: ${error.message}`);
        isConnected = false;
    }
};

module.exports = connectDB;