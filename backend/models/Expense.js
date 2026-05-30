const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    expense_category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    note: { type: String },
    date: { type: Date, required: true }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

expenseSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        ret.id = ret._id.toString();
        if (ret.expense_category_id && ret.expense_category_id instanceof mongoose.Types.ObjectId) {
            ret.expense_category_id = ret.expense_category_id.toString();
        }
        delete ret._id;
    }
});
expenseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Expense', expenseSchema);