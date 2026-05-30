const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    message: { type: String, required: true },
    is_read: { type: Boolean, default: false }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

contactSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
    }
});
contactSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Contact', contactSchema);