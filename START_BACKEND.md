# How to Start the Backend

## Prerequisites Check

Before starting, make sure you have:
- ✅ Node.js installed (v16 or higher)
- ✅ npm installed
- ✅ Supabase account (or ready to create one)

## Step-by-Step Instructions

### 1. Install Dependencies (First Time Only)

```bash
cd backend
npm install
```

This installs all required packages:
- express (web server)
- @supabase/supabase-js (database)
- bcryptjs (password encryption)
- jsonwebtoken (authentication)
- cors (cross-origin requests)
- dotenv (environment variables)

### 2. Configure Supabase

#### Option A: You Have Supabase Credentials

1. Open `backend/.env` file
2. Add your credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Option B: Create New Supabase Project

1. Go to https://supabase.com
2. Sign up / Login
3. Click "New Project"
4. Fill in:
   - Name: foodbyme
   - Database Password: (create a strong password)
   - Region: (choose closest to you)
5. Wait for project to be created (~2 minutes)
6. Go to Settings → API
7. Copy:
   - Project URL → SUPABASE_URL
   - service_role key → SUPABASE_SERVICE_ROLE_KEY
8. Paste into `backend/.env`

### 3. Set Up Database Tables

1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Copy content from `backend/supabase/schema.sql`
4. Paste and click "Run"
5. Tables will be created: users, orders, restaurants

### 4. Seed Restaurant Data (Optional)

```bash
npm run seed:restaurants
```

This adds sample restaurants to your database.

### 5. Start the Backend

```bash
npm run dev
```

You should see:
```
🚀 Starting FoodByMe Backend Server...
✅ Server running on http://localhost:5001
📝 Environment: development
🔗 API Endpoints:
   - Health: http://localhost:5001/api/health
   - Auth: http://localhost:5001/api/auth
   - Restaurants: http://localhost:5001/api/restaurants
   - Orders: http://localhost:5001/api/orders
```

### 6. Test the Backend

Open browser and visit:
- http://localhost:5001/api/health

You should see:
```json
{
  "status": "success",
  "message": "Backend is running",
  "timestamp": "2026-02-17T..."
}
```

## Common Issues & Solutions

### Issue 1: "Missing Supabase configuration"

**Problem:** SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set

**Solution:**
```bash
# Check .env file
cat backend/.env

# Make sure these are filled:
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Issue 2: Port 5001 already in use

**Problem:** Another process is using port 5001

**Solution:**
```bash
# Mac/Linux
lsof -ti:5001 | xargs kill -9

# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Or change port in .env
PORT=5002
```

### Issue 3: "Cannot find module"

**Problem:** Dependencies not installed

**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Issue 4: Database connection fails

**Problem:** Supabase credentials incorrect or project paused

**Solution:**
1. Check credentials in .env
2. Go to supabase.com
3. Verify project is active
4. Check if you copied service_role key (not anon key)

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Start backend
npm run dev

# Seed restaurants
npm run seed:restaurants

# Check if backend is running
curl http://localhost:5001/api/health

# View logs
npm run dev

# Stop backend
Ctrl + C
```

## Environment Variables Explained

```env
# Server Configuration
PORT=5001                          # Backend server port
NODE_ENV=development               # Environment mode

# Security
JWT_SECRET=foodbyme_secret_key_2026  # Token encryption key

# Database (Required)
SUPABASE_URL=                      # Your Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=         # Your service role key

# Phone/OTP (Optional)
DEFAULT_COUNTRY_CODE=+91           # Default country code
ALLOW_DEV_OTP_FALLBACK=true        # Allow dev OTP in development

# Twilio (Optional - for real SMS)
TWILIO_ACCOUNT_SID=                # Twilio account SID
TWILIO_AUTH_TOKEN=                 # Twilio auth token
TWILIO_VERIFY_SERVICE_SID=         # Twilio verify service SID
```

## Next Steps

After backend is running:

1. **Start Frontend:**
```bash
# In new terminal
npm run dev
```

2. **Test Full Stack:**
- Visit: http://localhost:5173
- Sign up a new user
- Browse restaurants
- Place an order

3. **Check Database:**
- Go to Supabase Dashboard
- Click "Table Editor"
- View users, orders, restaurants tables

## Need Help?

Check these files:
- `backend/DATABASE_SETUP.md` - Database setup guide
- `backend/SETUP_GUIDE.md` - Detailed backend guide
- `COMPLETE_SETUP_GUIDE.md` - Full stack guide

Or check the logs when running `npm run dev` for error messages.
