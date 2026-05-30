const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    icon: { type: String }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

categorySchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
    }
});
categorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Category', categorySchema);