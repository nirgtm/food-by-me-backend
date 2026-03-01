# Database Setup Guide

Your backend currently uses **Supabase** (cloud database). This guide shows you how it works and how to check the connection.

## Current Setup: Supabase

### What is Supabase?
- Cloud-based PostgreSQL database
- Free tier available
- Already configured in your backend
- Handles users, orders, and restaurants

### Check Supabase Connection

1. **Check .env file:**
```bash
cat backend/.env
```

Look for:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-key-here
```

2. **Test the connection:**
```bash
cd backend
npm run dev
```

Look for these messages:
```
✓ Supabase client initialized
Server running on http://localhost:5001
```

3. **Visit test page:**
```
http://localhost:5173/test-connection
```

### Supabase Dashboard

1. Go to: https://supabase.com
2. Login to your account
3. Select your project
4. View your data in the Table Editor

### Tables in Supabase:
- `users` - User accounts
- `orders` - Order history  
- `restaurants` - Restaurant data

---

## Alternative: MongoDB (Optional)

If you want to switch to MongoDB instead of Supabase:

### Option 1: MongoDB Atlas (Cloud - Free)

1. **Create account:**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free tier

2. **Get connection string:**
   - Create a cluster
   - Click "Connect"
   - Copy connection string

3. **Update .env:**
```env
# Comment out Supabase
# SUPABASE_URL=...
# SUPABASE_ANON_KEY=...

# Add MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/foodbyme
```

4. **Install mongoose:**
```bash
cd backend
npm install mongoose
```

### Option 2: Local MongoDB

1. **Install MongoDB:**
```bash
# Mac
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

2. **Update .env:**
```env
MONGODB_URI=mongodb://localhost:27017/foodbyme
```

---

## How to Check Database Connection

### Method 1: Backend Logs
Start backend and look for:
```
✓ Supabase client initialized
Server running on http://localhost:5001
```

### Method 2: Test Page
Visit: http://localhost:5173/test-connection

### Method 3: API Test
```bash
# Health check
curl http://localhost:5001/api/health

# Restaurants
curl http://localhost:5001/api/restaurants
```

### Method 4: Browser
Open: http://localhost:5001/api/health

---

## Troubleshooting

### Supabase Connection Issues:
1. Check SUPABASE_URL and SUPABASE_ANON_KEY in .env
2. Verify project is active on supabase.com
3. Check network/firewall settings

### Port Already in Use:
```bash
# Mac/Linux
lsof -ti:5001 | xargs kill -9

# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F
```

### Can't Find .env File:
```bash
cd backend
ls -la .env
```

If missing, copy from .env.example:
```bash
cp .env.example .env
```

---

## Quick Start

```bash
# 1. Check backend folder
cd backend

# 2. Install dependencies (if needed)
npm install

# 3. Check .env file exists
cat .env

# 4. Start backend
npm run dev

# 5. Test connection
# Open: http://localhost:5001/api/health
```

---

## Database Status

Your backend is currently configured with:
- ✓ Supabase (Cloud PostgreSQL)
- ✓ User authentication
- ✓ Order management
- ✓ Restaurant data

Everything is already set up and working! Just start the backend and test the connection.
