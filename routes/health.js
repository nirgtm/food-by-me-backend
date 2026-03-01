const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    build: {
      nodeEnv: process.env.NODE_ENV || 'development',
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA || '',
      signupEmailPatch: 'enabled',
    },
    config: {
      jwtSecretConfigured: Boolean(process.env.JWT_SECRET),
      supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    endpoints: {
      auth: '/api/auth',
      restaurants: '/api/restaurants',
      orders: '/api/orders'
    }
  });
});

module.exports = router;
