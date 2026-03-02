require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5001;

// Log startup
console.log('🚀 Starting FoodByMe Backend Server...');
console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);

const allowedOriginsFromEnv = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...allowedOriginsFromEnv
]);

const localDevOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const vercelPattern = /^https:\/\/.*\.vercel\.app$/;

const corsOptions = {
  origin: true, // Allow all origins for now
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Load routes with error handling
try {
  const healthRoutes = require('./routes/health');
  const authRoutes = require('./routes/auth');
  const authSupabaseRoutes = require('./routes/auth-supabase');
  const restaurantRoutes = require('./routes/restaurants');
  const orderRoutes = require('./routes/orders');
  const orderSimulatorRoutes = require('./routes/order-simulator');
  const adminRoutes = require('./routes/admin');

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes); // Keep old auth for backward compatibility
  app.use('/api/auth-supabase', authSupabaseRoutes); // New Supabase auth
  app.use('/api/restaurants', restaurantRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/order-simulator', orderSimulatorRoutes);
  app.use('/api/admin', adminRoutes);
  
  console.log('✅ Routes loaded successfully');
  
  // Start automatic order status updater (disabled due to Supabase connection issues)
  // const { startAutoUpdater } = require('./routes/order-simulator');
  // startAutoUpdater();
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
  console.error(error.stack);
}

app.get('/', (req, res) => {
  res.json({ message: 'FoodByMe API Server', status: 'running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Don't call listen in serverless environment
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Endpoints:`);
    console.log(`   - Health: http://localhost:${PORT}/api/health`);
    console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
    console.log(`   - Restaurants: http://localhost:${PORT}/api/restaurants`);
    console.log(`   - Orders: http://localhost:${PORT}/api/orders`);
  });
}

// Export for Vercel serverless
module.exports = app;
