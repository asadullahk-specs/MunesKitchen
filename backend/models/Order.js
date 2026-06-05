const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    product_name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit_price: { type: Number, required: true },
    total_price: { type: Number, required: true }
}, { _id: false });

const orderPaymentSchema = new mongoose.Schema({
    method: { type: String, enum: ['cash_on_delivery', 'easypaisa', 'bank_transfer'], default: 'cash_on_delivery' },
    status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
    reference: { type: String }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    order_number: { type: String, required: true, unique: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    delivery_area_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryArea' },
    address: { type: String, required: true },
    additional_instructions: { type: String },
    payment_method: { 
        type: String, 
        enum: ['cash_on_delivery', 'easypaisa', 'bank_transfer'], 
        default: 'cash_on_delivery' 
    },
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'paid', 'cancelled'], 
        default: 'pending' 
    },
    subtotal: { type: Number, required: true },
    delivery_charge: { type: Number, default: 0.00 },
    total: { type: Number, required: true },
    items: [orderItemSchema],
    payment: { type: orderPaymentSchema, default: () => ({}) }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

orderSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        ret.id = ret._id.toString();
        if (ret.customer_id && ret.customer_id instanceof mongoose.Types.ObjectId) {
            ret.customer_id = ret.customer_id.toString();
        }
        if (ret.delivery_area_id && ret.delivery_area_id instanceof mongoose.Types.ObjectId) {
            ret.delivery_area_id = ret.delivery_area_id.toString();
        }
        if (ret.items) {
            ret.items = ret.items.map(item => {
                if (item.product_id && item.product_id instanceof mongoose.Types.ObjectId) {
                    item.product_id = item.product_id.toString();
                }
                return item;
            });
        }
        delete ret._id;
    }
});
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);