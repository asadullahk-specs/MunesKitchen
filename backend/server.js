const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

// Import DB connection (triggers connection test)
require('./config/database');

const app = express();

// ========================
// MIDDLEWARE
// ========================
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========================
// ROUTES
// ========================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/delivery', require('./routes/delivery'))
app.use('/api/customers', require('./routes/customers'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: "Mune's Kitchen API is running 🍱" });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: err.message || 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Mune's Kitchen Backend running on http://localhost:${PORT}`);
});