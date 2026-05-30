const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    full_name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

customerSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
    }
});
customerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Customer', customerSchema);