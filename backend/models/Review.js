const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    customer_name: { type: String, required: true },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    rating: { type: Number, required: true },
    message: { type: String },
    special_instructions: { type: String },
    images: { type: String },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

reviewSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        ret.id = ret._id.toString();
        if (ret.product_id && ret.product_id instanceof mongoose.Types.ObjectId) {
            ret.product_id = ret.product_id.toString();
        }
        delete ret._id;
    }
});
reviewSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Review', reviewSchema);