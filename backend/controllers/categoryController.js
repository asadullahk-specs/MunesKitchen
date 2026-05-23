const sequelize = require('../config/database')

exports.getAll = async (req, res) => {
    try {
        const [categories] = await sequelize.query(
            'SELECT * FROM categories ORDER BY name ASC'
        )
        for (const cat of categories) {
            const [[{ count }]] = await sequelize.query(
                'SELECT COUNT(*) AS count FROM products WHERE category_id = ?',
                { replacements: [cat.id] }
            )
            cat.products = { length: Number(count) }
        }
        res.json({ success: true, data: categories })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

exports.create = async (req, res) => {
    try {
        const { name, icon } = req.body
        const slug = name.toLowerCase().replace(/\s+/g, '-')
        await sequelize.query(
            'INSERT INTO categories (name, slug, icon) VALUES (?, ?, ?)',
            { replacements: [name, slug, icon || null] }
        )
        res.status(201).json({ success: true, message: 'Category created' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

exports.update = async (req, res) => {
    try {
        const { name, icon } = req.body
        await sequelize.query(
            'UPDATE categories SET name = ?, icon = ? WHERE id = ?',
            { replacements: [name, icon || null, req.params.id] }
        )
        res.json({ success: true, message: 'Category updated' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

exports.remove = async (req, res) => {
    try {
        await sequelize.query(
            'DELETE FROM categories WHERE id = ?',
            { replacements: [req.params.id] }
        )
        res.json({ success: true, message: 'Category deleted' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}