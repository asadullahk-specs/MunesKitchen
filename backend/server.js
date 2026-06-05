const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// Load .env only for local dev (Vercel uses its own env vars)
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// Import DB connection
const connectDB = require('./config/database');

const app = express();

// ========================
// MIDDLEWARE
// ========================
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'https://munes-kitchen-frontend.vercel.app',
    'https://munes-kitchen-i1s.vercel.app',
    'https://munes-kitchen.vercel.app'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.some(allowed => origin.startsWith(allowed) || origin.includes('vercel.app'))) {
            return callback(null, true);
        }
        return callback(null, true); // Allow all for now during deployment
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser());

// Static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to DB before handling any API requests
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

// ========================
// ROUTES
// ========================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/costings', require('./routes/costings'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/delivery', require('./routes/delivery'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/offers', require('./routes/offers'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: "Mune's Kitchen API is running 🍱", version: '2.1.0' });
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

// Only start local server when running directly (not on Vercel)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Mune's Kitchen Backend running on http://localhost:${PORT}`);
    });
}

// Export for Vercel serverless
module.exports = app;