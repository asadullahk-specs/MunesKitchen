const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    original_price: { type: Number, required: true },
    discounted_price: { type: Number, required: true },
    discount_percentage: { type: Number, default: 0 },
    image: { type: String },
    is_active: { type: Boolean, default: false }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

offerSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
    }
});
offerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Offer', offerSchema);
