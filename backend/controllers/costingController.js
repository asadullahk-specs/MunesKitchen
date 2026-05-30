const { Product } = require('../models');

exports.getProductCosting = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }
        res.json({
            success: true,
            data: product.costing || { ingredients: [], total_cost: 0 }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.upsertProductCosting = async (req, res) => {
    try {
        const { productId } = req.params;
        const { ingredients, total_cost } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        product.costing = {
            ingredients: ingredients || [],
            total_cost: total_cost || 0
        };

        await product.save();

        res.json({
            success: true,
            message: 'Costing profile saved successfully.',
            data: product.costing
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
