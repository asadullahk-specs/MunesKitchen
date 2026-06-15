const mongoose = require('mongoose');

const cancelReasonSchema = new mongoose.Schema({
    name: { type: String, required: true }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

cancelReasonSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
    }
});
cancelReasonSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CancelReason', cancelReasonSchema);
