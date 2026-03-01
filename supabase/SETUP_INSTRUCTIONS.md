# Supabase Database Setup Instructions

## Step-by-Step Guide

### 1. Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query** button

### 2. Copy and Run the SQL Script

**Option A: Complete Schema (Recommended)**
- Open file: `backend/supabase/complete-schema.sql`
- Copy ALL the content
- Paste into Supabase SQL Editor
- Click **Run** button (or press Ctrl/Cmd + Enter)

**Option B: Basic Schema (Minimal)**
- Open file: `backend/supabase/schema.sql`
- Copy ALL the content
- Paste into Supabase SQL Editor
- Click **Run** button

### 3. Verify Tables Were Created

After running the script, you should see:
```
✅ Database schema created successfully!
📊 Tables created: users, restaurants, orders, addresses, coupons, reviews
```

### 4. Check Tables in Table Editor

1. Click **Table Editor** in left sidebar
2. You should see these tables:
   - ✅ users
   - ✅ restaurants
   - ✅ orders
   - ✅ addresses (optional)
   - ✅ coupons (optional)
   - ✅ reviews (optional)

### 5. Seed Restaurant Data

Now run the seed script to add restaurants:

```bash
cd backend
npm run seed:restaurants
```

This will populate the `restaurants` table with sample data.

---

## What Each Table Does

### Core Tables (Required)

**1. users**
- Stores user accounts
- Fields: email, password, phone, name
- Used for: Authentication, user profiles

**2. restaurants**
- Stores restaurant information
- Fields: id, name, data (JSON with menu, images, etc.)
- Used for: Restaurant listings, menu display

**3. orders**
- Stores all customer orders
- Fields: order_id, user, items, restaurant, payment, status
- Used for: Order management, order history

### Optional Tables (Enhance Features)

**4. addresses**
- Stores saved delivery addresses
- Allows users to save multiple addresses
- Quick checkout with saved addresses

**5. coupons**
- Stores discount coupons
- Apply promo codes at checkout
- Track coupon usage

**6. reviews**
- Stores restaurant reviews and ratings
- Users can rate restaurants
- Display average ratings

---

## Database Features Included

### ✅ Indexes
- Fast queries on email, phone, order_id
- Optimized search performance
- Quick filtering by status, date

### ✅ Triggers
- Auto-update `updated_at` timestamp
- Maintains data consistency

### ✅ Views (Analytics)
- `order_stats` - Daily order statistics
- `popular_restaurants` - Most ordered restaurants
- `user_order_summary` - Customer spending analysis

### ✅ Constraints
- Email and phone must be unique
- Order status must be valid
- Payment method must be valid
- Ratings must be 1-5

---

## Verification Queries

Run these in SQL Editor to check everything:

### Check all tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Count records in each table:
```sql
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'restaurants', COUNT(*) FROM restaurants
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'addresses', COUNT(*) FROM addresses
UNION ALL
SELECT 'coupons', COUNT(*) FROM coupons
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews;
```

### Check sample coupons:
```sql
SELECT code, description, discount_value, valid_until 
FROM coupons 
WHERE is_active = true;
```

---

## Troubleshooting

### Error: "relation already exists"
**Solution:** Tables already created. You're good to go!

### Error: "permission denied"
**Solution:** Make sure you're using the service_role key, not anon key

### Error: "syntax error"
**Solution:** 
1. Make sure you copied the ENTIRE SQL file
2. Check for any missing characters
3. Try running in smaller chunks

### Tables not showing in Table Editor
**Solution:**
1. Refresh the page
2. Check SQL Editor for error messages
3. Re-run the schema script

---

## Next Steps

After database setup:

1. ✅ Tables created
2. ✅ Run seed script: `npm run seed:restaurants`
3. ✅ Add Supabase credentials to `backend/.env`
4. ✅ Start backend: `npm run dev`
5. ✅ Test: http://localhost:5001/api/health

---

## Sample Coupons Included

The schema automatically creates these coupons:

1. **WELCOME50**
   - ₹50 off on orders above ₹199
   - Valid for 30 days

2. **SAVE20**
   - 20% off on orders above ₹299
   - Max discount: ₹100
   - Valid for 30 days

---

## Database Schema Diagram

```
users
├── id (UUID)
├── email (unique)
├── phone (unique)
├── password_hash
└── created_at

restaurants
├── id (text)
├── name
├── data (JSONB)
└── created_at

orders
├── id (UUID)
├── order_id (unique)
├── user_email → users.email
├── items (JSONB)
├── restaurant (JSONB)
├── total
├── status
└── created_at

addresses
├── id (UUID)
├── user_email → users.email
├── address_line1
├── city, state, pincode
└── is_default

coupons
├── id (UUID)
├── code (unique)
├── discount_type
├── discount_value
└── valid_until

reviews
├── id (UUID)
├── user_email → users.email
├── restaurant_id → restaurants.id
├── rating (1-5)
└── comment
```

---

## Need Help?

If you encounter any issues:
1. Check the error message in SQL Editor
2. Verify you're in the correct project
3. Make sure you have admin access
4. Try running the basic schema first (`schema.sql`)
5. Contact support if issues persist

Your database is now ready for production! 🎉
