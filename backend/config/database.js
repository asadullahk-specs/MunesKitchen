const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Seed flag — only seed once per process lifetime, not per request
let isSeeded = false;

const connectDB = async () => {
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    // Re-attempt connection if not currently connected or connecting
    const state = mongoose.connection.readyState;
    if (state === 1 || state === 2) return;

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/munes_kitchen', {
            bufferCommands: false,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Seed default admin accounts ONLY once per process lifetime
        // IMPORTANT: We never update existing admins here — doing so would reset
        // passwords that were changed via the Security panel on every cold start.
        if (!isSeeded) {
            isSeeded = true;
            const Admin = require('../models/Admin');

            // Remove any legacy placeholder account
            await Admin.deleteMany({ email: 'admin@muneskitchen.com' });

            const defaultAdmins = [
                { name: 'Asadullah Khan', email: 'asadullahk@admin1.muneskitchen', password: 'Admin#1@kitchen' },
                { name: 'Sameer Khan',    email: 'sameerk@admin2.muneskitchen',   password: 'Admin#2@kitchen' },
                { name: 'Munes Admin',   email: 'munes@admin3.muneskitchen',      password: 'Admin#3@kitchen' }
            ];

            for (const adminData of defaultAdmins) {
                const existing = await Admin.findOne({ email: adminData.email });
                if (!existing) {
                    const hashedPassword = await bcrypt.hash(adminData.password, 10);
                    await Admin.create({
                        name: adminData.name,
                        email: adminData.email,
                        password: hashedPassword
                    });
                    console.log(`✨ Admin user seeded: ${adminData.email}`);
                }
                // Do NOT update existing admins — their credentials may have been changed via the Security panel
            }
        }
    } catch (error) {
        console.error(`❌ MongoDB connection failed: ${error.message}`);
        throw error; // Re-throw so the request handler can return a 500 instead of silently failing
    }
};

module.exports = connectDB;