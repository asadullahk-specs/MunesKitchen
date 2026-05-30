const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

adminSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
    }
});
adminSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Admin', adminSchema);