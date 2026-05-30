const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    image: { type: String },
    hot_selling: { type: Boolean, default: false },
    show_on_menu: { type: Boolean, default: true },
    costing: {
        ingredients: [{
            name: { type: String, required: true },
            quantity: { type: Number, default: 0 },
            cost: { type: Number, default: 0 }
        }],
        total_cost: { type: Number, default: 0 }
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

productSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        ret.id = ret._id.toString();
        if (ret.category_id && ret.category_id instanceof mongoose.Types.ObjectId) {
            ret.category_id = ret.category_id.toString();
        }
        delete ret._id;
    }
});
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);