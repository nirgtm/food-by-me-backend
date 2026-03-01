const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// Simulate order progression
// confirmed -> preparing (2 mins) -> on_the_way (5 mins) -> delivered (10-15 mins)

const ORDER_TIMINGS = {
  confirmed_to_preparing: 2 * 60 * 1000, // 2 minutes
  preparing_to_on_the_way: 5 * 60 * 1000, // 5 minutes
  on_the_way_to_delivered: 12 * 60 * 1000, // 12 minutes (10-15 mins average)
};

// Check and update order statuses
async function updateOrderStatuses() {
  try {
    const now = new Date();

    // Get all non-delivered, non-cancelled orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['confirmed', 'preparing', 'on_the_way'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }

    if (!orders || orders.length === 0) {
      return;
    }

    for (const order of orders) {
      const createdAt = new Date(order.created_at);
      const timeSinceCreated = now - createdAt;

      let newStatus = order.status;
      let shouldUpdate = false;

      // Determine new status based on time elapsed
      if (order.status === 'confirmed' && timeSinceCreated >= ORDER_TIMINGS.confirmed_to_preparing) {
        newStatus = 'preparing';
        shouldUpdate = true;
      } else if (
        order.status === 'preparing' &&
        timeSinceCreated >= ORDER_TIMINGS.confirmed_to_preparing + ORDER_TIMINGS.preparing_to_on_the_way
      ) {
        newStatus = 'on_the_way';
        shouldUpdate = true;
      } else if (
        order.status === 'on_the_way' &&
        timeSinceCreated >=
          ORDER_TIMINGS.confirmed_to_preparing +
            ORDER_TIMINGS.preparing_to_on_the_way +
            ORDER_TIMINGS.on_the_way_to_delivered
      ) {
        newStatus = 'delivered';
        shouldUpdate = true;
      }

      // Update order status if needed
      if (shouldUpdate) {
        const updateData = {
          status: newStatus,
          updated_at: now.toISOString(),
        };

        // Add delivered_at timestamp when order is delivered
        if (newStatus === 'delivered') {
          updateData.delivered_at = now.toISOString();
        }

        const { error: updateError } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', order.id);

        if (updateError) {
          console.error(`Error updating order ${order.order_id}:`, updateError);
        } else {
          console.log(`✓ Order ${order.order_id}: ${order.status} → ${newStatus}`);
        }
      }
    }
  } catch (error) {
    console.error('Error in updateOrderStatuses:', error);
  }
}

// Endpoint to manually trigger status update
router.post('/update-statuses', async (req, res) => {
  try {
    await updateOrderStatuses();
    res.json({ success: true, message: 'Order statuses updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order statuses' });
  }
});

// Endpoint to get order progression info
router.get('/progression-info', (req, res) => {
  res.json({
    timings: {
      confirmed_to_preparing: '2 minutes',
      preparing_to_on_the_way: '5 minutes',
      on_the_way_to_delivered: '12 minutes',
      total_delivery_time: '19 minutes',
    },
    stages: [
      { status: 'confirmed', description: 'Order received and confirmed' },
      { status: 'preparing', description: 'Restaurant is preparing your food' },
      { status: 'on_the_way', description: 'Order is out for delivery' },
      { status: 'delivered', description: 'Order has been delivered' },
    ],
  });
});

// Start automatic status updater (runs every minute)
let statusUpdateInterval = null;

function startAutoUpdater() {
  if (statusUpdateInterval) {
    return; // Already running
  }

  console.log('🚀 Starting automatic order status updater...');
  
  // Run immediately
  updateOrderStatuses();
  
  // Then run every minute
  statusUpdateInterval = setInterval(() => {
    updateOrderStatuses();
  }, 60 * 1000); // Check every 1 minute

  console.log('✅ Order status updater is running (checks every 1 minute)');
}

function stopAutoUpdater() {
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval);
    statusUpdateInterval = null;
    console.log('⏹️  Order status updater stopped');
  }
}

// Endpoint to start/stop auto updater
router.post('/auto-updater/start', (req, res) => {
  startAutoUpdater();
  res.json({ success: true, message: 'Auto updater started' });
});

router.post('/auto-updater/stop', (req, res) => {
  stopAutoUpdater();
  res.json({ success: true, message: 'Auto updater stopped' });
});

// Export functions for use in server.js
module.exports = router;
module.exports.startAutoUpdater = startAutoUpdater;
module.exports.stopAutoUpdater = stopAutoUpdater;
module.exports.updateOrderStatuses = updateOrderStatuses;
