-- ============================================
-- FoodByMe Database Schema
-- Complete setup for Supabase
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- Stores user accounts with authentication
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_phone_idx ON users (phone);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users (created_at DESC);

-- ============================================
-- 2. RESTAURANTS TABLE
-- Stores restaurant information
-- ============================================

CREATE TABLE IF NOT EXISTS restaurants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for restaurants table
CREATE INDEX IF NOT EXISTS restaurants_name_idx ON restaurants (name);
CREATE INDEX IF NOT EXISTS restaurants_active_idx ON restaurants (is_active);
CREATE INDEX IF NOT EXISTS restaurants_data_idx ON restaurants USING GIN (data);

-- ============================================
-- 3. ORDERS TABLE
-- Stores all customer orders
-- ============================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL,
  user_email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  address_label TEXT DEFAULT 'Home',
  item JSONB,
  items JSONB NOT NULL,
  restaurant JSONB NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('upi', 'card', 'cod')),
  subtotal NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  delivery_fee NUMERIC(10, 2) DEFAULT 0,
  platform_fee NUMERIC(10, 2) DEFAULT 0,
  discount NUMERIC(10, 2) DEFAULT 0,
  coupon_code TEXT,
  delivery_note TEXT,
  taxes_and_charges NUMERIC(10, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  cancelled_reason TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for orders table
CREATE INDEX IF NOT EXISTS orders_user_email_idx ON orders (user_email);
CREATE INDEX IF NOT EXISTS orders_order_id_idx ON orders (order_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_payment_method_idx ON orders (payment_method);

-- ============================================
-- 4. ADDRESSES TABLE (Optional - for saved addresses)
-- Stores user's saved delivery addresses
-- ============================================

CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Home',
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  landmark TEXT,
  phone TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for addresses table
CREATE INDEX IF NOT EXISTS addresses_user_email_idx ON addresses (user_email);
CREATE INDEX IF NOT EXISTS addresses_default_idx ON addresses (is_default);

-- ============================================
-- 5. COUPONS TABLE (Optional - for discount coupons)
-- Stores promotional coupons
-- ============================================

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL,
  min_order_value NUMERIC(10, 2) DEFAULT 0,
  max_discount NUMERIC(10, 2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for coupons table
CREATE INDEX IF NOT EXISTS coupons_code_idx ON coupons (code);
CREATE INDEX IF NOT EXISTS coupons_active_idx ON coupons (is_active);
CREATE INDEX IF NOT EXISTS coupons_valid_idx ON coupons (valid_from, valid_until);

-- ============================================
-- 6. REVIEWS TABLE (Optional - for restaurant reviews)
-- Stores user reviews and ratings
-- ============================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  restaurant_id TEXT NOT NULL,
  order_id TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for reviews table
CREATE INDEX IF NOT EXISTS reviews_user_email_idx ON reviews (user_email);
CREATE INDEX IF NOT EXISTS reviews_restaurant_id_idx ON reviews (restaurant_id);
CREATE INDEX IF NOT EXISTS reviews_rating_idx ON reviews (rating);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_restaurants_updated_at ON restaurants;
CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_addresses_updated_at ON addresses;
CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS (Optional - for analytics)
-- ============================================

-- View for order statistics
CREATE OR REPLACE VIEW order_stats AS
SELECT 
  DATE(created_at) as order_date,
  COUNT(*) as total_orders,
  SUM(total) as total_revenue,
  AVG(total) as avg_order_value,
  COUNT(DISTINCT user_email) as unique_customers
FROM orders
WHERE status != 'cancelled'
GROUP BY DATE(created_at)
ORDER BY order_date DESC;

-- View for popular restaurants
CREATE OR REPLACE VIEW popular_restaurants AS
SELECT 
  restaurant->>'id' as restaurant_id,
  restaurant->>'name' as restaurant_name,
  COUNT(*) as order_count,
  SUM(total) as total_revenue,
  AVG(total) as avg_order_value
FROM orders
WHERE status != 'cancelled'
GROUP BY restaurant->>'id', restaurant->>'name'
ORDER BY order_count DESC;

-- View for user order history
CREATE OR REPLACE VIEW user_order_summary AS
SELECT 
  user_email,
  full_name,
  COUNT(*) as total_orders,
  SUM(total) as total_spent,
  AVG(total) as avg_order_value,
  MAX(created_at) as last_order_date
FROM orders
WHERE status != 'cancelled'
GROUP BY user_email, full_name
ORDER BY total_spent DESC;

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Optional
-- Uncomment if you want to enable RLS
-- ============================================

-- Enable RLS on tables
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies for users table
-- CREATE POLICY "Users can view own data" ON users
--   FOR SELECT USING (auth.uid() = id);

-- CREATE POLICY "Users can update own data" ON users
--   FOR UPDATE USING (auth.uid() = id);

-- Policies for orders table
-- CREATE POLICY "Users can view own orders" ON orders
--   FOR SELECT USING (user_email = auth.email());

-- CREATE POLICY "Users can create orders" ON orders
--   FOR INSERT WITH CHECK (user_email = auth.email());

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample coupon
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_value, max_discount, valid_until)
VALUES 
  ('WELCOME50', 'Welcome offer - 50 off', 'fixed', 50, 199, 50, NOW() + INTERVAL '30 days'),
  ('SAVE20', '20% off on orders above 299', 'percentage', 20, 299, 100, NOW() + INTERVAL '30 days')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- Run these to verify tables were created
-- ============================================

-- Check all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database schema created successfully!';
  RAISE NOTICE '📊 Tables created: users, restaurants, orders, addresses, coupons, reviews';
  RAISE NOTICE '🔍 Indexes created for optimal performance';
  RAISE NOTICE '⚡ Triggers set up for automatic timestamp updates';
  RAISE NOTICE '📈 Views created for analytics';
  RAISE NOTICE '🎉 Your database is ready to use!';
END $$;
