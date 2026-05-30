const mongoose = require('mongoose');

const expenseCategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    color: { type: String, default: '#ef4444' }
}, {
    timestamps: false
});

expenseCategorySchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
    }
});
expenseCategorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ExpenseCategory', expenseCategorySchema);