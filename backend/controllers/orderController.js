const sequelize = require('../config/database')

const generateOrderNumber = () => {
    const num = Math.floor(1000 + Math.random() * 9000)
    return `MK-${num}`
}

const createOrder = async (req, res) => {
    const {
        full_name, phone, email, delivery_area_id, address,
        additional_instructions, payment_method, items, subtotal, delivery_charge, total
    } = req.body

    if (!full_name || !full_name.trim()) {
        return res.status(400).json({ success: false, message: 'Full name is required' })
    }
    if (!phone || !phone.trim()) {
        return res.status(400).json({ success: false, message: 'Phone is required' })
    }
    if (!address || !address.trim()) {
        return res.status(400).json({ success: false, message: 'Address is required' })
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Order items are required' })
    }

    const t = await sequelize.transaction()

    try {
        // Find or create customer
        let customerId
        const [existing] = await sequelize.query(
            'SELECT id FROM customers WHERE phone = ? LIMIT 1',
            { replacements: [phone.trim()], transaction: t }
        )

        if (existing.length > 0) {
            customerId = existing[0].id
            await sequelize.query(
                'UPDATE customers SET full_name = ?, email = ? WHERE id = ?',
                { replacements: [full_name.trim(), email || null, customerId], transaction: t }
            )
        } else {
            const [result] = await sequelize.query(
                'INSERT INTO customers (full_name, phone, email) VALUES (?, ?, ?)',
                { replacements: [full_name.trim(), phone.trim(), email || null], transaction: t }
            )
            customerId = result
        }

        // Generate unique order number
        let orderNumber = generateOrderNumber()
        const [existing2] = await sequelize.query(
            'SELECT id FROM orders WHERE order_number = ?',
            { replacements: [orderNumber], transaction: t }
        )
        if (existing2.length > 0) {
            orderNumber = generateOrderNumber() + Math.floor(Math.random() * 10)
        }

        const actualDeliveryCharge = delivery_charge || 0
        const actualTotal = Number(subtotal) + Number(actualDeliveryCharge)

        const [orderResult] = await sequelize.query(
            `INSERT INTO orders
        (order_number, customer_id, delivery_area_id, address, additional_instructions,
         payment_method, status, subtotal, delivery_charge, total)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
            {
                replacements: [
                    orderNumber,
                    customerId,
                    delivery_area_id ? Number(delivery_area_id) : null,
                    address.trim(),
                    additional_instructions || null,
                    payment_method || 'cash_on_delivery',
                    Number(subtotal),
                    Number(actualDeliveryCharge),
                    actualTotal
                ],
                transaction: t
            }
        )

        const orderId = orderResult

        // Insert order items
        for (const item of items) {
            await sequelize.query(
                `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?)`,
                {
                    replacements: [
                        orderId,
                        item.product_id || null,
                        item.name,
                        item.quantity,
                        Number(item.price),
                        Number(item.price) * Number(item.quantity)
                    ],
                    transaction: t
                }
            )
        }

        // Insert payment record
        await sequelize.query(
            `INSERT INTO payments (order_id, method, status) VALUES (?, ?, 'pending')`,
            {
                replacements: [orderId, payment_method || 'cash_on_delivery'],
                transaction: t
            }
        )

        await t.commit()

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            orderNumber,
            orderId
        })
    } catch (error) {
        await t.rollback()
        console.error('Order creation error:', error)
        res.status(500).json({ success: false, message: error.message })
    }
}

const trackOrder = async (req, res) => {
    try {
        const { orderNumber } = req.params;

        // Clean up the input string
        const searchInput = orderNumber ? orderNumber.trim() : '';

        // If the user entered a raw number, we can check 'id', otherwise we check 'order_number'
        const isNumericId = /^\d+$/.test(searchInput);

        const [orders] = await sequelize.query(`
    SELECT o.*, c.full_name, c.phone, c.email,
           da.name AS delivery_area_name
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN delivery_areas da ON o.delivery_area_id = da.id
    WHERE o.order_number = ? ${isNumericId ? 'OR o.id = ?' : ''}
`, {
            replacements: isNumericId ? [searchInput, parseInt(searchInput)] : [searchInput]
        });

        if (!orders.length) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const order = orders[0];

        // Fetch matching order items
        const [items] = await sequelize.query(
            'SELECT * FROM order_items WHERE order_id = ?',
            { replacements: [order.id] }
        );
        order.items = items;

        res.json({ success: true, order });
    } catch (error) {
        console.error("❌ Track Order Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllOrders = async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)

    try {
        let whereClause = ''
        const replacements = []

        if (status && status !== 'all') {
            whereClause = 'WHERE o.status = ?'
            replacements.push(status)
        }

        // 1. Get the orders
        const [orders] = await sequelize.query(`
    SELECT o.*,
           c.full_name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
           da.name AS delivery_area_name
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN delivery_areas da ON o.delivery_area_id = da.id
    ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
`, { replacements: [...replacements, parseInt(limit), parseInt(offset)] })

        // 2. Attach items
        for (const order of orders) {
            const [items] = await sequelize.query(
                'SELECT * FROM order_items WHERE order_id = ?',
                { replacements: [order.id] }
            )
            order.items = items
            order.customer = {
                full_name: order.customer_name,
                phone: order.customer_phone,
                email: order.customer_email
            }
        }

        // 3. SAFE COUNT: Fetch total count without risky destructuring
        const countResult = await sequelize.query(
            `SELECT COUNT(*) AS total FROM orders o ${whereClause}`,
            { replacements }
        )
        // Correct way to get total from raw query result
        const total = countResult[0][0].total || 0;

        res.json({
            success: true,
            data: orders,
            total: parseInt(total),
            page: parseInt(page),
            pages: Math.ceil(parseInt(total) / parseInt(limit))
        })
    } catch (error) {
        console.error("Order Fetch Error:", error); // Check this in terminal
        res.status(500).json({ success: false, message: error.message })
    }
}

const updateOrderStatus = async (req, res) => {
    const { status } = req.body
    const valid = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'paid']

    if (!valid.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' })
    }

    try {
        await sequelize.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            { replacements: [status, req.params.id] }
        )
        res.json({ success: true, message: 'Status updated' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

const getOrderById = async (req, res) => {
    try {
        const [orders] = await sequelize.query(`
      SELECT o.*,
             c.full_name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
             da.name AS delivery_area_name, da.charge AS delivery_area_charge
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN delivery_areas da ON o.delivery_area_id = da.id
      WHERE o.id = ?
    `, { replacements: [req.params.id] })

        if (!orders.length) {
            return res.status(404).json({ success: false, message: 'Order not found' })
        }

        const order = orders[0]
        const [items] = await sequelize.query(
            'SELECT * FROM order_items WHERE order_id = ?',
            { replacements: [order.id] }
        )
        order.items = items

        res.json({ success: true, order })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

const getDashboardStats = async (req, res) => {
    try {
        const [[orderStats]] = await sequelize.query(`
      SELECT
        COUNT(*) AS totalOrders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pendingOrders,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS deliveredOrders,
        COALESCE(SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END), 0) AS totalRevenue
      FROM orders
    `)

        const [[custStats]] = await sequelize.query(
            'SELECT COUNT(*) AS totalCustomers FROM customers'
        )

        const [monthlyRevenue] = await sequelize.query(`
      SELECT
        DATE_FORMAT(created_at, '%b') AS month,
        COALESCE(SUM(total), 0) AS revenue,
        COUNT(*) AS orders
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b')
      ORDER BY MIN(created_at) ASC
    `)

        const [topProducts] = await sequelize.query(`
      SELECT
        oi.product_name AS name,
        SUM(oi.quantity) AS total_sold,
        SUM(oi.total_price) AS revenue
      FROM order_items oi
      GROUP BY oi.product_name
      ORDER BY total_sold DESC
      LIMIT 5
    `)

        res.json({
            success: true,
            data: {
                totalOrders: Number(orderStats.totalOrders) || 0,
                pendingOrders: Number(orderStats.pendingOrders) || 0,
                deliveredOrders: Number(orderStats.deliveredOrders) || 0,
                totalRevenue: Number(orderStats.totalRevenue) || 0,
                totalCustomers: Number(custStats.totalCustomers) || 0,
                monthlyRevenue: monthlyRevenue || [],
                topProducts: topProducts || []
            }
        })
    } catch (error) {
        console.error('Dashboard stats error:', error.message)
        res.status(500).json({ success: false, message: error.message })
    }
}

module.exports = { createOrder, trackOrder, getAllOrders, getOrderById, updateOrderStatus, getDashboardStats }