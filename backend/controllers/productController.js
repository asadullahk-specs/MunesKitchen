const { Product, Category } = require('../models')

exports.getAll = async (req, res) => {
    try {
        const where = {}
        if (req.query.category_id) where.category_id = req.query.category_id
        if (req.query.show_on_menu === 'true') where.show_on_menu = true
        if (req.query.hot_selling === 'true') where.hot_selling = true

        const products = await Product.findAll({
            where,
            include: [{ model: Category, as: 'category' }],
            order: [['created_at', 'DESC']],
        })
        res.json({ success: true, data: products })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

exports.getOne = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [{ model: Category, as: 'category' }],
        })
        if (!product) return res.status(404).json({ success: false, message: 'Product not found.' })
        res.json({ success: true, data: product })
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
        const full = await Product.findByPk(product.id, {
            include: [{ model: Category, as: 'category' }],
        })
        res.status(201).json({ success: true, data: full })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

exports.update = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id)
        if (!product) return res.status(404).json({ success: false, message: 'Product not found.' })
        const data = { ...req.body }
        if (req.file) data.image = `/uploads/${req.file.filename}`
        if (data.hot_selling !== undefined) data.hot_selling = data.hot_selling === 'true' || data.hot_selling === true
        if (data.show_on_menu !== undefined) data.show_on_menu = data.show_on_menu !== 'false'
        await product.update(data)
        const full = await Product.findByPk(product.id, {
            include: [{ model: Category, as: 'category' }],
        })
        res.json({ success: true, data: full })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

exports.remove = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id)
        if (!product) return res.status(404).json({ success: false, message: 'Product not found.' })
        await product.destroy()
        res.json({ success: true, message: 'Product deleted.' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}