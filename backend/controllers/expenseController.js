const sequelize = require('../config/database')

const getExpenses = async (req, res) => {
    try {
        // 1. Fetch all expenses with category names matching your true column name: expense_category_id
        const [expenses] = await sequelize.query(`
            SELECT e.id, e.title, e.amount, e.note, e.date, e.created_at,
                   ec.id AS category_id, ec.name AS category_name, ec.color AS category_color
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.expense_category_id = ec.id
            ORDER BY e.date DESC
        `);

        // 2. Fetch all expense categories for dropdown selections
        const [categories] = await sequelize.query(
            'SELECT * FROM expense_categories ORDER BY name ASC'
        );

        // 3. Compute chart statistical slices using matching join columns
        const [categoryStats] = await sequelize.query(`
            SELECT ec.id, ec.name, ec.color, COALESCE(SUM(e.amount), 0) AS total
            FROM expense_categories ec
            LEFT JOIN expenses e ON e.expense_category_id = ec.id
            GROUP BY ec.id, ec.name, ec.color
            HAVING COALESCE(SUM(e.amount), 0) > 0
        `);

        // 4. Summarize total layout footprint figures
        const [[summary]] = await sequelize.query(
            'SELECT COALESCE(SUM(amount), 0) AS total FROM expenses'
        );

        res.json({
            success: true,
            expenses,
            categories,
            categoryStats,
            total: summary ? summary.total : 0
        });
    } catch (error) {
        console.log("================ DATABASE CRASH ERROR ================");
        console.error(error);
        console.log("======================================================");
        res.status(500).json({ success: false, message: error.message });
    }
};

const createExpense = async (req, res) => {
    const { title, amount, category_id, note, date } = req.body

    if (!title || !title.trim()) {
        return res.status(400).json({ success: false, message: 'Title is required' })
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
        return res.status(400).json({ success: false, message: 'Valid amount is required' })
    }
    if (!category_id) {
        return res.status(400).json({ success: false, message: 'Category is required' })
    }
    if (!date) {
        return res.status(400).json({ success: false, message: 'Date is required' })
    }

    try {
        await sequelize.query(
            `INSERT INTO expenses (expense_category_id, title, amount, note, date)
       VALUES (?, ?, ?, ?, ?)`,
            { replacements: [Number(category_id), title.trim(), Number(amount), note || null, date] }
        )
        res.status(201).json({ success: true, message: 'Expense added successfully' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

const deleteExpense = async (req, res) => {
    try {
        await sequelize.query(
            'DELETE FROM expenses WHERE id = ?',
            { replacements: [req.params.id] }
        )
        res.json({ success: true, message: 'Expense deleted' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Add this new function to your controller file:
const getExpenseCategories = async (req, res) => {
    try {
        const [categories] = await sequelize.query(
            'SELECT * FROM expense_categories ORDER BY name ASC'
        );
        res.json({
            success: true,
            categories
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update your module.exports at the bottom to include it:
module.exports = {
    getExpenses,
    createExpense,
    deleteExpense,
    getExpenseCategories // <-- Don't forget to export it here!
}