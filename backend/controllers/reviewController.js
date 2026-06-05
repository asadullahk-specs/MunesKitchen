const { Review } = require('../models');
const mongoose = require('mongoose');


// ── GET /reviews (filter by status via ?status=) ───────────────────────────
exports.getAll = async (req, res) => {
    try {
        const { status, product_id } = req.query;
        const query = {};

        if (status && status !== 'all') {
            query.status = status;
        }
        if (product_id) {
            // Safely cast to ObjectId — invalid IDs would throw a CastError without this guard
            if (mongoose.Types.ObjectId.isValid(product_id)) {
                query.product_id = new mongoose.Types.ObjectId(product_id);
            } else {
                // Non-ObjectId product_id can never match; return empty immediately
                return res.json({ success: true, data: [], avgRating: 0, total: 0, breakdown: [] });
            }
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
        const { id } = req.params;

        // Validate status against allowed values
        const validStatuses = ['pending', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }

        const updated = await Review.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        res.json({ success: true, message: `Review ${status} successfully.`, data: updated.toJSON() });
    } catch (error) {
        console.error('updateStatus error:', error);
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

        const newReview = await Review.create({
            customer_name,
            product_id: product_id || null,
            rating: Number(rating),
            message,
            special_instructions: instructions || null,
            images: imagePaths.length > 0 ? JSON.stringify(imagePaths) : null,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Review submitted! It will appear after approval.',
            data: {
                id: newReview._id.toString(),
                customer_name,
                rating: Number(rating),
                message,
                images: imagePaths.length > 0 ? JSON.stringify(imagePaths) : null,
                status: 'pending'
            }
        });
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