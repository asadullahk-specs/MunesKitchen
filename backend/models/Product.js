const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true },
    description: { type: String },
    long_description: { type: String },
    price: { type: Number, required: true },
    image: { type: String },
    hot_selling: { type: Boolean, default: false },
    show_on_menu: { type: Boolean, default: true },
    // Additional Info fields
    ingredients: { type: String },
    allergens: { type: String },
    serving_size: { type: String },
    calories: { type: Number },
    prep_time: { type: String },
    spice_level: { type: String, enum: ['Mild', 'Medium', 'Hot', 'Extra Hot', ''] },
    storage_info: { type: String },
    additional_notes: { type: String },
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