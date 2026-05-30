const mongoose = require('mongoose');

const deliveryAreaSchema = new mongoose.Schema({
    name: { type: String, required: true },
    charge: { type: Number, default: 0 }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

deliveryAreaSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
    }
});
deliveryAreaSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('DeliveryArea', deliveryAreaSchema);