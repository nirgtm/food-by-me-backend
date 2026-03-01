const express = require("express");
const router = express.Router();
const supabase = require("../lib/supabase");

// Get all orders (admin only)
router.get("/orders", async (req, res) => {
  try {
    // For now, allow access if any authorization header is present
    // In production, implement proper admin authentication
    const adminToken = req.headers.authorization?.replace("Bearer ", "");
    
    console.log("Admin token received:", adminToken);

    // Fetch all orders
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ error: "Failed to fetch orders" });
    }

    console.log(`Found ${orders?.length || 0} orders`);

    // Format orders to match expected structure
    const formattedOrders = (orders || []).map(order => ({
      id: order.id,
      orderId: order.order_id,
      status: order.status,
      total: order.total,
      createdAt: order.created_at,
      items: order.items || [order.item],
      item: order.item,
      restaurant: order.restaurant,
      user: {
        fullName: order.full_name,
        email: order.user_email,
      },
      deliveryAddress: {
        address: order.address,
        phone: order.phone,
      },
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error("Admin orders error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get dashboard statistics
router.get("/stats", async (req, res) => {
  try {
    // For now, allow access if any authorization header is present
    const adminToken = req.headers.authorization?.replace("Bearer ", "");
    
    console.log("Admin stats token received:", adminToken);

    // Get order counts by status
    const { data: orders, error } = await supabase
      .from("orders")
      .select("status, total");

    if (error) {
      console.error("Error fetching stats:", error);
      return res.status(500).json({ error: "Failed to fetch statistics" });
    }

    const stats = {
      total: orders.length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      onTheWay: orders.filter((o) => o.status === "on_the_way").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
      revenue: orders
        .filter((o) => o.status === "delivered")
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0),
    };

    res.json(stats);
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
