const sequelize = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Multer: diskStorage ──────────────────────────────────────────────────────
const reviewsUploadDir = path.join(__dirname, '..', 'uploads', 'reviews');
if (!fs.existsSync(reviewsUploadDir)) fs.mkdirSync(reviewsUploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, reviewsUploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `review-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'), false);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
});

// ── Ensure special_instructions column exists ────────────────────────────────
(async () => {
    try {
        await sequelize.query("ALTER TABLE reviews ADD COLUMN special_instructions TEXT NULL");
    } catch (_) { /* Column already exists — ignore */ }
})();

// ── GET /reviews  (filter by status via ?status=) ───────────────────────────
exports.getAll = async (req, res) => {
    try {
        const { status } = req.query;
        let query = `
            SELECT r.*, p.name AS product_name, p.image AS product_image
            FROM reviews r
            LEFT JOIN products p ON r.product_id = p.id
        `;
        const replacements = [];

        if (status && status !== 'all') {
            query += ` WHERE r.status = ?`;
            replacements.push(status);
        }

        query += ` ORDER BY r.created_at DESC`;

        const [reviews] = await sequelize.query(query, { replacements });

        // Compute stats from approved reviews for homepage
        const approvedReviews = reviews.filter(r => r.status === 'approved' || !status || status === 'all');
        const statsSource = status === 'approved' ? reviews : reviews.filter(r => r.status === 'approved');

        const total = statsSource.length;
        const avgRating = total > 0
            ? (statsSource.reduce((s, r) => s + Number(r.rating || 0), 0) / total).toFixed(1)
            : 0;

        const breakdown = [5, 4, 3, 2, 1].map(star => ({
            star,
            count: statsSource.filter(r => Number(r.rating) === star).length,
        }));

        res.json({ success: true, data: reviews, avgRating, total, breakdown });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET /reviews/pending (admin) ────────────────────────────────────────────
exports.getPending = async (req, res) => {
    try {
        const [reviews] = await sequelize.query(
            `SELECT r.*, p.name AS product_name, p.image AS product_image
             FROM reviews r
             LEFT JOIN products p ON r.product_id = p.id
             WHERE r.status = 'pending'
             ORDER BY r.created_at DESC`
        );
        res.json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── PUT /reviews/:id/status (admin) — FIXED ─────────────────────────────────
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }
        await sequelize.query(
            'UPDATE reviews SET status = ? WHERE id = ?',
            { replacements: [status, req.params.id] }
        );
        res.json({ success: true, message: `Review ${status} successfully.` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── POST /reviews ────────────────────────────────────────────────────────────
exports.create = [
    upload.array('images', 5),
    async (req, res) => {
        try {
            const imagePaths = req.files ? req.files.map(f => `uploads/reviews/${f.filename}`) : [];

            const sql = `
                INSERT INTO reviews
                    (customer_name, product_id, rating, message, special_instructions, status, images, created_at)
                VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW())
            `;

            await sequelize.query(sql, {
                replacements: [
                    req.body.customer_name,
                    req.body.product_id || null,
                    req.body.rating,
                    req.body.message,
                    req.body.instructions || null,
                    JSON.stringify(imagePaths),
                ],
            });

            res.status(201).json({ success: true, message: 'Review submitted! It will appear after approval.' });
        } catch (error) {
            console.error('Review create error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
];

// ── DELETE /reviews/:id (admin) ──────────────────────────────────────────────
exports.remove = async (req, res) => {
    try {
        const [[review]] = await sequelize.query('SELECT images FROM reviews WHERE id = ?', {
            replacements: [req.params.id],
        });
        if (review?.images) {
            try {
                JSON.parse(review.images).forEach(p => {
                    const fullPath = path.join(__dirname, '..', p);
                    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
                });
            } catch (_) { /* ignore parse errors */ }
        }
        await sequelize.query('DELETE FROM reviews WHERE id = ?', { replacements: [req.params.id] });
        res.json({ success: true, message: 'Review deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};