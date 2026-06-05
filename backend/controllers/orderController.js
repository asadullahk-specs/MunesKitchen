const mongoose = require('mongoose');
const { Order, Customer, DeliveryArea } = require('../models');

const generateOrderNumber = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `MK-${num}`;
};

const createOrder = async (req, res) => {
    const {
        full_name, phone, email, delivery_area_id, address,
        additional_instructions, payment_method, items, subtotal, delivery_charge, total
    } = req.body;

    if (!full_name || !full_name.trim()) {
        return res.status(400).json({ success: false, message: 'Full name is required' });
    }
    if (!phone || !phone.trim()) {
        return res.status(400).json({ success: false, message: 'Phone is required' });
    }
    if (!address || !address.trim()) {
        return res.status(400).json({ success: false, message: 'Address is required' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Order items are required' });
    }

    try {
        // Find or create customer
        let customer = await Customer.findOne({ phone: phone.trim() });
        if (customer) {
            customer.full_name = full_name.trim();
            if (email) customer.email = email;
            await customer.save();
        } else {
            customer = await Customer.create({
                full_name: full_name.trim(),
                phone: phone.trim(),
                email: email || null
            });
        }

        // Generate unique order number
        let orderNumber = generateOrderNumber();
        const existingOrder = await Order.findOne({ order_number: orderNumber });
        if (existingOrder) {
            orderNumber = generateOrderNumber() + Math.floor(Math.random() * 10);
        }

        const actualDeliveryCharge = Number(delivery_charge || 0);
        const actualTotal = Number(subtotal) + actualDeliveryCharge;

        const orderItems = items.map(item => ({
            product_id: item.product_id && mongoose.Types.ObjectId.isValid(item.product_id) ? item.product_id : null,
            product_name: item.name,
            quantity: Number(item.quantity),
            unit_price: Number(item.price),
            total_price: Number(item.price) * Number(item.quantity)
        }));

        const newOrder = await Order.create({
            order_number: orderNumber,
            customer_id: customer._id,
            delivery_area_id: delivery_area_id && mongoose.Types.ObjectId.isValid(delivery_area_id) ? delivery_area_id : null,
            address: address.trim(),
            additional_instructions: additional_instructions || null,
            payment_method: payment_method || 'cash_on_delivery',
            status: 'pending',
            subtotal: Number(subtotal),
            delivery_charge: actualDeliveryCharge,
            total: actualTotal,
            items: orderItems,
            payment: {
                method: payment_method || 'cash_on_delivery',
                status: 'pending'
            }
        });

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            orderNumber,
            orderId: newOrder.id
        });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const trackOrder = async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const searchInput = orderNumber ? orderNumber.trim() : '';

        const isObjectId = mongoose.Types.ObjectId.isValid(searchInput);
        const query = isObjectId 
            ? { $or: [{ order_number: searchInput }, { _id: searchInput }] }
            : { order_number: searchInput };

        const order = await Order.findOne(query)
            .populate('customer_id')
            .populate('delivery_area_id');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const orderObj = order.toJSON();
        if (order.customer_id) {
            orderObj.full_name = order.customer_id.full_name;
            orderObj.phone = order.customer_id.phone;
            orderObj.email = order.customer_id.email;
        }
        if (order.delivery_area_id) {
            orderObj.delivery_area_name = order.delivery_area_id.name;
        }

        res.json({ success: true, order: orderObj });
    } catch (error) {
        console.error("❌ Track Order Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllOrders = async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    try {
        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const orders = await Order.find(query)
            .populate('customer_id')
            .populate('delivery_area_id')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(query);

        const ordersWithDetails = orders.map(order => {
            const ordObj = order.toJSON();
            if (order.customer_id) {
                ordObj.customer_name = order.customer_id.full_name;
                ordObj.customer_phone = order.customer_id.phone;
                ordObj.customer_email = order.customer_id.email;
                ordObj.customer = {
                    full_name: order.customer_id.full_name,
                    phone: order.customer_id.phone,
                    email: order.customer_id.email
                };
            }
            if (order.delivery_area_id) {
                ordObj.delivery_area_name = order.delivery_area_id.name;
            }
            return ordObj;
        });

        res.json({
            success: true,
            data: ordersWithDetails,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error("Order Fetch Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    const { status } = req.body;
    const valid = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'paid'];

    if (!valid.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    try {
        const updateData = { status };
        // Record paid_at timestamp when marked as paid
        if (status === 'paid') {
            updateData.paid_at = new Date();
        }
        await Order.findByIdAndUpdate(req.params.id, updateData);
        res.json({ success: true, message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customer_id')
            .populate('delivery_area_id');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const ordObj = order.toJSON();
        if (order.customer_id) {
            ordObj.customer_name = order.customer_id.full_name;
            ordObj.customer_phone = order.customer_id.phone;
            ordObj.customer_email = order.customer_id.email;
            ordObj.customer = {
                full_name: order.customer_id.full_name,
                phone: order.customer_id.phone,
                email: order.customer_id.email
            };
        }
        if (order.delivery_area_id) {
            ordObj.delivery_area_name = order.delivery_area_id.name;
            ordObj.delivery_area_charge = order.delivery_area_id.charge;
        }

        res.json({ success: true, order: ordObj });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const stats = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    pendingOrders: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                    deliveredOrders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
                    paidOrders: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
                    totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] } }
                }
            }
        ]);

        const orderStats = stats[0] || {
            totalOrders: 0,
            pendingOrders: 0,
            deliveredOrders: 0,
            paidOrders: 0,
            totalRevenue: 0
        };

        const totalCustomers = await Customer.countDocuments({});

        // Monthly revenue aggregates for past 6 months (only paid orders)
        const monthlyRevenue = await Order.aggregate([
            {
                $match: {
                    status: 'paid',
                    created_at: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$created_at" } },
                    month: { $first: { $dateToString: { format: "%b", date: "$created_at" } } },
                    revenue: { $sum: "$total" },
                    orders: { $sum: 1 },
                    rawDate: { $min: "$created_at" }
                }
            },
            { $sort: { rawDate: 1 } },
            {
                $project: {
                    _id: 0,
                    month: 1,
                    revenue: 1,
                    orders: 1
                }
            }
        ]);

        // Top 5 products by quantity sold
        const topProducts = await Order.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product_name",
                    name: { $first: "$items.product_name" },
                    total_sold: { $sum: "$items.quantity" },
                    revenue: { $sum: "$items.total_price" }
                }
            },
            { $sort: { total_sold: -1 } },
            { $limit: 5 },
            {
                $project: {
                    _id: 0,
                    name: 1,
                    total_sold: 1,
                    revenue: 1
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                totalOrders: Number(orderStats.totalOrders),
                pendingOrders: Number(orderStats.pendingOrders),
                deliveredOrders: Number(orderStats.deliveredOrders),
                paidOrders: Number(orderStats.paidOrders || 0),
                totalRevenue: Number(orderStats.totalRevenue),
                totalCustomers: Number(totalCustomers),
                monthlyRevenue: monthlyRevenue || [],
                topProducts: topProducts || []
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Delete order error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createOrder, trackOrder, getAllOrders, getOrderById, updateOrderStatus, getDashboardStats, deleteOrder };