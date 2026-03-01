# Database Relationships (Pipelines)

## Overview

This document explains how all tables are connected through foreign keys (pipelines).

---

## Current Table Relationships

```
┌─────────────┐
│   USERS     │ (Main table)
│  - id       │
│  - email    │
│  - phone    │
└──────┬──────┘
       │
       ├──────────────────────────────────┐
       │                                  │
       ▼                                  ▼
┌─────────────┐                    ┌─────────────┐
│  ORDERS     │                    │  ADDRESSES  │
│  - user_id  │───────┐            │  - user_id  │
│  - user_email│      │            │  - user_email│
└─────────────┘       │            └─────────────┘
                      │
                      │
                      ▼
               ┌─────────────┐
               │   REVIEWS   │
               │  - user_id  │
               │  - restaurant_id │
               │  - order_uuid│
               └──────┬──────┘
                      │
                      ▼
               ┌─────────────┐
               │ RESTAURANTS │
               │  - id       │
               │  - name     │
               └─────────────┘
```

---

## Relationship Details

### 1. USERS → ORDERS (One-to-Many)
**Connection:** `orders.user_id` → `users.id`

- One user can have many orders
- Each order belongs to one user
- When user is deleted, orders remain (for record keeping)

**Example:**
```sql
-- Get all orders for a user
SELECT * FROM orders WHERE user_id = 'user-uuid-here';

-- Get user info with their orders
SELECT u.full_name, o.order_id, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.email = 'user@example.com';
```

### 2. USERS → ADDRESSES (One-to-Many)
**Connection:** `addresses.user_id` → `users.id`

- One user can have many saved addresses
- Each address belongs to one user
- When user is deleted, their addresses are deleted (CASCADE)

**Example:**
```sql
-- Get all addresses for a user
SELECT * FROM addresses WHERE user_id = 'user-uuid-here';

-- Get user's default address
SELECT * FROM addresses 
WHERE user_id = 'user-uuid-here' 
AND is_default = true;
```

### 3. USERS → REVIEWS (One-to-Many)
**Connection:** `reviews.user_id` → `users.id`

- One user can write many reviews
- Each review belongs to one user
- When user is deleted, their reviews are deleted (CASCADE)

**Example:**
```sql
-- Get all reviews by a user
SELECT * FROM reviews WHERE user_id = 'user-uuid-here';

-- Get user's reviews with restaurant names
SELECT u.full_name, r.rating, r.comment, res.name as restaurant_name
FROM reviews r
JOIN users u ON r.user_id = u.id
JOIN restaurants res ON r.restaurant_id = res.id;
```

### 4. RESTAURANTS → REVIEWS (One-to-Many)
**Connection:** `reviews.restaurant_id` → `restaurants.id`

- One restaurant can have many reviews
- Each review is for one restaurant
- When restaurant is deleted, its reviews are deleted (CASCADE)

**Example:**
```sql
-- Get all reviews for a restaurant
SELECT * FROM reviews WHERE restaurant_id = 'biryani';

-- Get restaurant with average rating
SELECT 
  r.name,
  AVG(rev.rating) as avg_rating,
  COUNT(rev.id) as review_count
FROM restaurants r
LEFT JOIN reviews rev ON r.id = rev.restaurant_id
GROUP BY r.id, r.name;
```

### 5. ORDERS → REVIEWS (One-to-One)
**Connection:** `reviews.order_uuid` → `orders.id`

- One order can have one review
- Each review can be linked to an order
- When order is deleted, review's order link is set to NULL

**Example:**
```sql
-- Get review for a specific order
SELECT * FROM reviews WHERE order_uuid = 'order-uuid-here';

-- Get orders with their reviews
SELECT o.order_id, o.total, r.rating, r.comment
FROM orders o
LEFT JOIN reviews r ON o.id = r.order_uuid;
```

---

## Auto-Sync Features

### Automatic user_id Syncing

When you create an order/address/review with just an email, the system automatically finds and sets the user_id:

```sql
-- You insert with email
INSERT INTO orders (user_email, ...) VALUES ('user@example.com', ...);

-- System automatically sets user_id
-- Trigger finds user by email and sets user_id
```

This happens through database triggers:
- `sync_order_user_id_trigger`
- `sync_address_user_id_trigger`
- `sync_review_user_id_trigger`

---

## Cascade Behaviors

### ON DELETE CASCADE
When a parent record is deleted, child records are automatically deleted:

**Example:**
```sql
-- Delete a user
DELETE FROM users WHERE email = 'user@example.com';

-- Automatically deletes:
-- ✅ All their addresses
-- ✅ All their reviews
-- ❌ Orders are kept (for business records)
```

### ON DELETE SET NULL
When a parent record is deleted, child records keep existing but reference is removed:

**Example:**
```sql
-- Delete an order
DELETE FROM orders WHERE order_id = 'ORD123';

-- Review still exists but:
-- ✅ Review remains
-- ✅ order_uuid is set to NULL
```

---

## How to Add Foreign Keys

If you haven't added foreign keys yet, run this in Supabase SQL Editor:

1. Go to **SQL Editor**
2. Open file: `backend/supabase/add-foreign-keys.sql`
3. Copy all content
4. Paste and click **Run**

---

## Verification Queries

### Check all foreign keys:
```sql
SELECT
  tc.table_name, 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public';
```

### Test relationships:
```sql
-- Create a test user
INSERT INTO users (full_name, email, phone, password_hash)
VALUES ('Test User', 'test@example.com', '+919999999999', 'hash123')
RETURNING id;

-- Create an address for that user (auto-syncs user_id)
INSERT INTO addresses (user_email, label, address_line1, city, state, pincode, phone)
VALUES ('test@example.com', 'Home', '123 Main St', 'Mumbai', 'Maharashtra', '400001', '+919999999999');

-- Verify relationship
SELECT u.full_name, a.label, a.address_line1
FROM users u
JOIN addresses a ON u.id = a.user_id
WHERE u.email = 'test@example.com';
```

---

## Benefits of Foreign Keys

✅ **Data Integrity**
- Can't create order for non-existent user
- Can't create review for non-existent restaurant

✅ **Automatic Cleanup**
- Delete user → addresses and reviews deleted automatically
- No orphaned records

✅ **Better Queries**
- JOIN tables easily
- Get related data in one query

✅ **Database Enforced**
- Rules enforced at database level
- Can't bypass in code

---

## Common Queries Using Relationships

### Get user with all their data:
```sql
SELECT 
  u.full_name,
  u.email,
  COUNT(DISTINCT o.id) as total_orders,
  COUNT(DISTINCT a.id) as saved_addresses,
  COUNT(DISTINCT r.id) as total_reviews
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
LEFT JOIN addresses a ON u.id = a.user_id
LEFT JOIN reviews r ON u.id = r.user_id
WHERE u.email = 'user@example.com'
GROUP BY u.id, u.full_name, u.email;
```

### Get restaurant with reviews and ratings:
```sql
SELECT 
  r.name,
  r.data->>'cuisines' as cuisines,
  AVG(rev.rating) as avg_rating,
  COUNT(rev.id) as review_count,
  json_agg(
    json_build_object(
      'user', u.full_name,
      'rating', rev.rating,
      'comment', rev.comment
    )
  ) as reviews
FROM restaurants r
LEFT JOIN reviews rev ON r.id = rev.restaurant_id
LEFT JOIN users u ON rev.user_id = u.id
WHERE r.id = 'biryani'
GROUP BY r.id, r.name, r.data;
```

### Get order with full details:
```sql
SELECT 
  o.order_id,
  u.full_name as customer_name,
  u.email,
  u.phone,
  o.restaurant->>'name' as restaurant_name,
  o.items,
  o.total,
  o.status,
  o.created_at
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.order_id = 'ORD123';
```

---

## Summary

Your database now has proper relationships (pipelines):

✅ **Users** are the center - everything connects to them  
✅ **Orders** track purchases and link to users  
✅ **Addresses** store delivery locations for users  
✅ **Reviews** connect users to restaurants  
✅ **Restaurants** store menu and info  
✅ **Auto-sync** keeps user_id updated  
✅ **Cascade delete** keeps data clean  

All tables are properly connected through foreign keys! 🎉
