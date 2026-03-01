# Backend Setup Guide with Database

## Option 1: Run WITHOUT Database (Easiest - Start Here!)

The backend works perfectly without MongoDB using in-memory storage.

### Steps:
1. Install dependencies:
```bash
cd backend
npm install
```

2. Start the server:
```bash
npm run dev
```

3. Done! Backend is running on http://localhost:5000

**Note:** Data will be lost when server restarts, but perfect for development and testing.

---

## Option 2: Run WITH MongoDB (Recommended for Production)

### A. Using MongoDB Atlas (Cloud - Free)

1. **Create MongoDB Atlas Account:**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free
   - Create a new cluster (free tier)

2. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://username:password@cluster.mongodb.net/foodbyme`

3. **Update .env file:**
```env
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/foodbyme
```

4. **Start server:**
```bash
npm run dev
```

### B. Using Local MongoDB

1. **Install MongoDB:**
   - Mac: `brew install mongodb-community`
   - Windows: Download from https://www.mongodb.com/try/download/community
   - Linux: `sudo apt-get install mongodb`

2. **Start MongoDB:**
```bash
# Mac/Linux
brew services start mongodb-community

# Or manually
mongod --dbpath /path/to/data
```

3. **Update .env (already set):**
```env
MONGODB_URI=mongodb://localhost:27017/foodbyme
```

4. **Start server:**
```bash
npm run dev
```

---

## How to Check Database Connection

### Success Messages:
```
✓ MongoDB Connected: cluster0.mongodb.net
✓ Database: foodbyme
Server running on http://localhost:5000
```

### Without Database:
```
⚠️  Running without database - using in-memory storage
Server running on http://localhost:5000
```

Both work perfectly! The backend automatically falls back to in-memory storage if MongoDB is not available.

---

## Database Features

When MongoDB is connected:
- ✓ Users are saved permanently
- ✓ Orders are stored in database
- ✓ Restaurants can be managed
- ✓ Data persists across server restarts
- ✓ Can query and filter data

Without MongoDB:
- ✓ Everything still works
- ⚠️  Data resets on server restart
- ✓ Perfect for development/testing

---

## Testing the Backend

1. **Start backend:**
```bash
cd backend
npm run dev
```

2. **Start frontend:**
```bash
npm run dev
```

3. **Visit test page:**
```
http://localhost:5173/test-connection
```

---

## Troubleshooting

### Port 5000 already in use:
```bash
# Mac/Linux
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### MongoDB connection fails:
- Check if MongoDB is running
- Verify connection string in .env
- Check network/firewall settings
- **Don't worry!** Backend will work without it

### Dependencies not installing:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## What's Included

### Models (Database Schemas):
- `User.js` - User accounts
- `Order.js` - Order history
- `Restaurant.js` - Restaurant data

### Routes (API Endpoints):
- `/api/auth` - Signup/Login
- `/api/restaurants` - Restaurant list
- `/api/orders` - Order management
- `/api/health` - Server status

### Features:
- JWT authentication
- Password encryption
- CORS enabled
- Error handling
- Automatic fallback to in-memory storage
- Auto-seeding restaurants from JSON

---

## Quick Start (Recommended)

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Start server (works without MongoDB!)
npm run dev

# 3. In new terminal, start frontend
cd ..
npm run dev

# 4. Open browser
# http://localhost:5173
```

That's it! Your backend is ready to use with or without MongoDB! 🚀
