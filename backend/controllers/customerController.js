const sequelize = require('../config/database') // Assumes direct instance export based on previous fixes

const getAllCustomers = async (req, res) => {
  try {
    const [customers] = await sequelize.query(`
      SELECT 
        c.id,
        c.full_name,
        c.phone,
        c.email,
        c.created_at,
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(o.total), 0) AS total_spent,
        MAX(o.created_at) AS last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      GROUP BY c.id, c.full_name, c.phone, c.email, c.created_at
      ORDER BY c.created_at DESC
    `)

    // Send both variants to guarantee compatibility with your frontend table parsing mapping
    res.json({
      success: true,
      customers: customers,
      data: customers
    })
  } catch (error) {
    console.error("❌ Customer Fetch Error:", error.message)
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { getAllCustomers }