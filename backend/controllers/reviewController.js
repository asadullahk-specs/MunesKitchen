const { Review } = require('../models');


// ── GET /reviews (filter by status via ?status=) ───────────────────────────
exports.getAll = async (req, res) => {
    try {
        const { status } = req.query;
        const query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        const reviews = await Review.find(query)
            .populate('product_id')
            .sort({ created_at: -1 });

        const mappedReviews = reviews.map(r => {
            const rObj = r.toJSON();
            if (r.product_id) {
                rObj.product_name = r.product_id.name;
                rObj.product_image = r.product_id.image;
            }
            return rObj;
        });

        // Compute stats from approved reviews for homepage
        const statsSource = status === 'approved' 
            ? mappedReviews 
            : mappedReviews.filter(r => r.status === 'approved');

        const total = statsSource.length;
        const avgRating = total > 0
            ? (statsSource.reduce((s, r) => s + Number(r.rating || 0), 0) / total).toFixed(1)
            : 0;

        const breakdown = [5, 4, 3, 2, 1].map(star => ({
            star,
            count: statsSource.filter(r => Number(r.rating) === star).length,
        }));

        res.json({ success: true, data: mappedReviews, avgRating, total, breakdown });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET /reviews/pending (admin) ────────────────────────────────────────────
exports.getPending = async (req, res) => {
    try {
        const reviews = await Review.find({ status: 'pending' })
            .populate('product_id')
            .sort({ created_at: -1 });

        const mapped = reviews.map(r => {
            const rObj = r.toJSON();
            if (r.product_id) {
                rObj.product_name = r.product_id.name;
                rObj.product_image = r.product_id.image;
            }
            return rObj;
        });

        res.json({ success: true, data: mapped });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── PUT /reviews/:id/status (admin) ─────────────────────────────────────────
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }
        await Review.findByIdAndUpdate(req.params.id, { status });
        res.json({ success: true, message: `Review ${status} successfully.` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── POST /reviews ────────────────────────────────────────────────────────────
exports.create = async (req, res) => {
    try {
        const { customer_name, product_id, rating, message, instructions, images_base64 } = req.body;

        // Accept up to 5 base64 image strings sent from the frontend
        let imagePaths = [];
        if (Array.isArray(images_base64) && images_base64.length > 0) {
            imagePaths = images_base64.slice(0, 5).filter(img =>
                typeof img === 'string' && img.startsWith('data:image/')
            );
        }

        await Review.create({
            customer_name,
            product_id: product_id || null,
            rating: Number(rating),
            message,
            special_instructions: instructions || null,
            images: JSON.stringify(imagePaths),
            status: 'pending'
        });

        res.status(201).json({ success: true, message: 'Review submitted! It will appear after approval.' });
    } catch (error) {
        console.error('Review create error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── DELETE /reviews/:id (admin) ──────────────────────────────────────────────
exports.remove = async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Review deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};