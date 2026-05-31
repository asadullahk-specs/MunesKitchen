const { Expense, ExpenseCategory } = require('../models');

const getExpenses = async (req, res) => {
    try {
        // 1. Fetch all expenses with categories
        const expenses = await Expense.find()
            .populate('expense_category_id')
            .sort({ date: -1 });

        const mappedExpenses = expenses.map(e => {
            const eObj = e.toJSON();
            if (e.expense_category_id) {
                eObj.category_id = e.expense_category_id._id.toString();
                eObj.category_name = e.expense_category_id.name;
                eObj.category_color = e.expense_category_id.color;
            }
            return eObj;
        });

        // 2. Fetch all expense categories for dropdown selections
        const categories = await ExpenseCategory.find().sort({ name: 1 });

        // 3. Compute chart statistical slices grouped by category
        const expenseStats = await Expense.aggregate([
            {
                $group: {
                    _id: "$expense_category_id",
                    total: { $sum: "$amount" }
                }
            }
        ]);

        const categoryStats = expenseStats.map(stat => {
            const cat = categories.find(c => c._id.toString() === stat._id.toString());
            return {
                id: stat._id.toString(),
                name: cat ? cat.name : 'Unknown',
                color: cat ? cat.color : '#ef4444',
                total: stat.total
            };
        }).filter(stat => stat.total > 0);

        // 4. Summarize total layout footprint figures
        const totalExpenses = await Expense.aggregate([
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const total = totalExpenses[0]?.total || 0;

        res.json({
            success: true,
            expenses: mappedExpenses,
            categories,
            categoryStats,
            total
        });
    } catch (error) {
        console.log("================ DATABASE CRASH ERROR ================");
        console.error(error);
        console.log("======================================================");
        res.status(500).json({ success: false, message: error.message });
    }
};

const createExpense = async (req, res) => {
    const { title, amount, category_id, note, date } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
        return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }
    if (!category_id) {
        return res.status(400).json({ success: false, message: 'Category is required' });
    }
    if (!date) {
        return res.status(400).json({ success: false, message: 'Date is required' });
    }

    try {
        await Expense.create({
            expense_category_id: category_id,
            title: title.trim(),
            amount: Number(amount),
            note: note || null,
            date: new Date(date)
        });
        res.status(201).json({ success: true, message: 'Expense added successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteExpense = async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Expense deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getExpenseCategories = async (req, res) => {
    try {
        const categories = await ExpenseCategory.find().sort({ name: 1 });
        res.json({
            success: true,
            categories
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createExpenseCategory = async (req, res) => {
    const { name, color } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    try {
        console.log('Creating expense category:', { name: name.trim(), color });
        const newCat = await ExpenseCategory.create({
            name: name.trim(),
            color: color || '#ef4444'
        });
        res.status(201).json({ success: true, message: 'Expense category created', data: newCat });
    } catch (error) {
        console.error('createExpenseCategory error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateExpenseCategory = async (req, res) => {
    const { name, color } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    try {
        const updatedCat = await ExpenseCategory.findByIdAndUpdate(req.params.id, {
            name: name.trim(),
            color: color || '#ef4444'
        }, { new: true });
        if (!updatedCat) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.json({ success: true, message: 'Expense category updated', data: updatedCat });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteExpenseCategory = async (req, res) => {
    try {
        const deleted = await ExpenseCategory.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.json({ success: true, message: 'Expense category deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getExpenses,
    createExpense,
    deleteExpense,
    getExpenseCategories,
    createExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory
};