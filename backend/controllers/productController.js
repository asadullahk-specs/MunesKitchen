const { Product } = require('../models')

exports.getAll = async (req, res) => {
    try {
        const query = {}
        if (req.query.category_id) query.category_id = req.query.category_id
        if (req.query.show_on_menu === 'true') query.show_on_menu = true
        if (req.query.hot_selling === 'true') query.hot_selling = true

        const products = await Product.find(query)
            .populate('category_id')
            .sort({ created_at: -1 })

        const productsWithCategory = products.map(p => {
            const pObj = p.toJSON();
            pObj.category = pObj.category_id; // Frontend compatibility mapping
            return pObj;
        });

        res.json({ success: true, data: productsWithCategory })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

exports.getOne = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category_id')
        if (!product) return res.status(404).json({ success: false, message: 'Product not found.' })
        
        const pObj = product.toJSON();
        pObj.category = pObj.category_id; // Frontend compatibility mapping

        res.json({ success: true, data: pObj })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

exports.create = async (req, res) => {
    try {
        const data = { ...req.body }
        if (req.file) data.image = `/uploads/${req.file.filename}`
        data.hot_selling = data.hot_selling === 'true' || data.hot_selling === true
        data.show_on_menu = data.show_on_menu !== 'false'
        
        const product = await Product.create(data)
        const full = await Product.findById(product._id).populate('category_id')
        
        const pObj = full.toJSON();
        pObj.category = pObj.category_id; // Frontend compatibility mapping

        res.status(201).json({ success: true, data: pObj })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

exports.update = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
        if (!product) return res.status(404).json({ success: false, message: 'Product not found.' })
        
        const data = { ...req.body }
        if (req.file) data.image = `/uploads/${req.file.filename}`
        if (data.hot_selling !== undefined) data.hot_selling = data.hot_selling === 'true' || data.hot_selling === true
        if (data.show_on_menu !== undefined) data.show_on_menu = data.show_on_menu !== 'false'
        
        await Product.findByIdAndUpdate(req.params.id, data)
        const full = await Product.findById(req.params.id).populate('category_id')
        
        const pObj = full.toJSON();
        pObj.category = pObj.category_id; // Frontend compatibility mapping

        res.json({ success: true, data: pObj })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

exports.remove = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
        if (!product) return res.status(404).json({ success: false, message: 'Product not found.' })
        await Product.findByIdAndDelete(req.params.id)
        res.json({ success: true, message: 'Product deleted.' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}