const { Customer, Order } = require('../models');

const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ created_at: -1 });
    
    const customersWithStats = await Promise.all(customers.map(async (cust) => {
        const orders = await Order.find({ customer_id: cust._id });
        let totalSpent = 0;
        let lastOrderDate = null;
        orders.forEach(o => {
            totalSpent += Number(o.total || 0);
            if (!lastOrderDate || o.created_at > lastOrderDate) {
                lastOrderDate = o.created_at;
            }
        });
        const custObj = cust.toJSON();
        custObj.total_orders = orders.length;
        custObj.total_spent = totalSpent;
        custObj.last_order_date = lastOrderDate;
        return custObj;
    }));

    // Send both variants to guarantee compatibility with your frontend table parsing mapping
    res.json({
      success: true,
      customers: customersWithStats,
      data: customersWithStats
    });
  } catch (error) {
    console.error("❌ Customer Fetch Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllCustomers };