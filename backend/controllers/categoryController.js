const { Category, Product } = require('../models');

exports.getAll = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        const categoriesWithProductCount = await Promise.all(categories.map(async (cat) => {
            const count = await Product.countDocuments({ category_id: cat._id });
            const catObj = cat.toObject();
            catObj.products = { length: count };
            return catObj;
        }));
        res.json({ success: true, data: categoriesWithProductCount });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { name, icon } = req.body;
        const slug = name.toLowerCase().replace(/\s+/g, '-');
        await Category.create({ name, slug, icon: icon || null });
        res.status(201).json({ success: true, message: 'Category created' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { name, icon } = req.body;
        await Category.findByIdAndUpdate(req.params.id, { name, icon: icon || null });
        res.json({ success: true, message: 'Category updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};