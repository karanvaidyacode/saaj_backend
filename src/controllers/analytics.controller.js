const { Order, Product, Customer } = require('../models/postgres');
const { Sequelize } = require('sequelize');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.count();
    const totalRevenueResult = await Order.sum('totalAmount', { where: { paymentStatus: 'paid' } });
    const totalRevenue = parseFloat(totalRevenueResult || 0);
    const totalCustomers = await Customer.count();
    const totalProducts = await Product.count();

    const ordersByStatus = await Order.findAll({
      attributes: ['status', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      group: ['status']
    });

    res.json({
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      ordersByStatus
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get dashboard analytics
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const totalRevenueResult = await Order.sum('totalAmount', { where: { paymentStatus: 'paid' } });
    const totalRevenue = parseFloat(totalRevenueResult || 0);
    const totalOrders = await Order.count();
    const totalCustomers = await Customer.count();
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get sales trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const salesData = await Order.findAll({
      attributes: [
        [Sequelize.fn('TO_CHAR', Sequelize.col('createdAt'), 'Mon'), 'month'],
        [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'revenue']
      ],
      where: {
        paymentStatus: 'paid',
        createdAt: { [Sequelize.Op.gte]: sixMonthsAgo }
      },
      group: [Sequelize.fn('TO_CHAR', Sequelize.col('createdAt'), 'Mon'), Sequelize.fn('DATE_PART', 'month', Sequelize.col('createdAt'))],
      order: [[Sequelize.fn('DATE_PART', 'month', Sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    res.json({
      totalRevenue,
      totalOrders,
      totalCustomers,
      avgOrderValue,
      salesData: salesData.map(item => ({ month: item.month, revenue: parseFloat(item.revenue) }))
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};

// Get sales data
exports.getSalesData = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const salesData = await Order.findAll({
      attributes: [
        [Sequelize.fn('TO_CHAR', Sequelize.col('createdAt'), 'Mon'), 'month'],
        [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'revenue']
      ],
      where: {
        paymentStatus: 'paid',
        createdAt: { [Sequelize.Op.gte]: sixMonthsAgo }
      },
      group: [Sequelize.fn('TO_CHAR', Sequelize.col('createdAt'), 'Mon'), Sequelize.fn('DATE_PART', 'month', Sequelize.col('createdAt'))],
      order: [[Sequelize.fn('DATE_PART', 'month', Sequelize.col('createdAt')), 'ASC']],
      raw: true
    });
    
    res.json(salesData.map(item => ({ month: item.month, revenue: parseFloat(item.revenue) })));
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ message: 'Error fetching sales data', error: error.message });
  }
};

// Get order statistics
exports.getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.count();
    const pendingOrders = await Order.count({ where: { status: 'pending' } });
    const completedOrders = await Order.count({ where: { status: 'delivered' } });
    const cancelledOrders = await Order.count({ where: { status: 'cancelled' } });
    
    const orderTrend = await Order.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('createdAt')), 'DESC']],
      limit: 7,
      raw: true
    });
    
    res.json({
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      orderTrend: orderTrend.reverse().map(item => ({ date: item.date, count: parseInt(item.count) }))
    });
  } catch (error) {
    console.error("Error fetching order stats:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get top products
exports.getTopProducts = async (req, res) => {
  try {
    // In a real app we'd need an OrderItems table. For now we use the JSON 'items' column in Order.
    // This is a simplified approach.
    const orders = await Order.findAll({ where: { paymentStatus: 'paid' }, raw: true });
    const productSales = {};
    
    orders.forEach(order => {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      if (Array.isArray(items)) {
        items.forEach(item => {
          const name = item.name || item.productName || 'Unknown';
          productSales[name] = (productSales[name] || 0) + (item.quantity || 1);
        });
      }
    });
    
    const topProducts = Object.entries(productSales)
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
      
    res.json(topProducts);
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ message: 'Error fetching top products', error: error.message });
  }
};

// Get customer analytics
exports.getCustomerAnalytics = async (req, res) => {
  try {
    const totalCustomers = await Customer.count();
    const activeCustomers = await Customer.count({ where: { status: 'active' } });
    
    res.json({
      totalCustomers,
      activeCustomers,
      newCustomers: 0, // Placeholder
      returningCustomers: 0, // Placeholder
      customerGrowth: [] // Placeholder
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({ message: 'Error fetching customer analytics', error: error.message });
  }
};

// Get product performance data
exports.getProductPerformance = async (req, res) => {
  try {
    const topSellingProducts = await this.getTopProducts(req, { json: (data) => data }); // Reusing logic
    
    const categoryStats = await Product.findAll({
      attributes: [
        'category',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['category']
    });
    
    res.json({
      topSellingProducts,
      categoryPerformance: categoryStats.map(c => ({ category: c.category, count: parseInt(c.get('count')) }))
    });
  } catch (error) {
    console.error("Error fetching product performance:", error);
    res.status(500).json({ error: error.message });
  }
};

// Generic Search (Moved from Vector Search to DB ILIKE)
exports.searchAnalytics = async (req, res) => {
  try {
    const { query } = req.body;
    const orders = await Order.findAll({
      where: {
        [Sequelize.Op.or]: [
          { orderNumber: { [Sequelize.Op.iLike]: `%${query}%` } },
          { customerName: { [Sequelize.Op.iLike]: `%${query}%` } }
        ]
      },
      limit: 10
    });
    res.json(orders);
  } catch (error) {
    console.error("Error searching analytics data:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update analytics data (Stubs to maintain parity with routes)
exports.updateAnalytics = async (req, res) => {
  res.json({ success: true, message: "Stats are now real-time from database" });
};
