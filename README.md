# FoodByMe Backend

Express.js backend server for the FoodByMe food delivery application.

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

This will install:
- express - Web server
- cors - Cross-origin requests
- bcryptjs - Password encryption
- jsonwebtoken - Authentication tokens
- dotenv - Environment variables
- body-parser - Parse request data

### 2. Start the Server
```bash
npm run dev
```

Server will run on: **http://localhost:<PORT>** (from `backend/.env`)

### 3. Test the Server
Open browser and visit:
- http://localhost:5001/ - Should show "FoodByMe API Server"
- http://localhost:5001/api/health - Health check
- http://localhost:5001/api/restaurants - Restaurant list

## Supabase Setup

### 1. Create Tables
Run the SQL in `backend/supabase/schema.sql` inside the Supabase SQL editor.

### 2. Configure Environment
Add these to `backend/.env` (do not expose service role key to the frontend):
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Seed Restaurants
```bash
cd backend
npm run seed:restaurants
```

## API Endpoints

### Public Endpoints
- `GET /` - Server status
- `GET /api/health` - Health check
- `POST /api/auth/signup` - Request signup OTP (mobile SMS)
- `POST /api/auth/signup/verify-otp` - Verify OTP and create user
- `POST /api/auth/signup/resend-otp` - Resend signup OTP
- `POST /api/auth/login` - Login user
- `GET /api/restaurants` - Get all restaurants
- `GET /api/restaurants/:id` - Get restaurant by ID

### Protected Endpoints (Require JWT Token)
- `POST /api/orders/place-order` - Place order
- `GET /api/orders/my-orders` - Get user orders

## Environment Variables

Create `.env` file (already created):
```
PORT=5001
JWT_SECRET=foodbyme_secret_key_2026
NODE_ENV=development
DEFAULT_COUNTRY_CODE=+91
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ALLOW_DEV_OTP_FALLBACK=false
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Twilio Setup (Real Mobile OTP)
1. Create a Twilio account.
2. In Twilio console, create a **Verify Service**.
3. Add your phone number as a verified recipient (for trial accounts).
4. Put `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_VERIFY_SERVICE_SID` in `backend/.env`.
5. Restart backend server.
6. Keep `ALLOW_DEV_OTP_FALLBACK=false` for real OTP-only flow.

If Twilio config is missing and fallback is disabled, signup OTP requests fail by design.

### Cross-Device Requirement
For OTP and login from your mobile or any other device:
1. Backend must be reachable from that device (deployed server or same LAN IP, not localhost).
2. Frontend must call that reachable backend URL via `VITE_API_URL`.
3. CORS should include your frontend origin using `CORS_ORIGIN` in backend env.

## Project Structure
```
backend/
├── data/
│   └── restaurants.json    # Restaurant data
├── lib/
│   └── supabase.js         # Supabase client
├── middleware/
│   └── auth.js            # JWT authentication
├── routes/
│   ├── auth.js           # Signup/Login
│   ├── health.js         # Health check
│   ├── orders.js         # Order management
│   └── restaurants.js    # Restaurant endpoints
├── scripts/
│   └── seed-restaurants.js # Seed Supabase with restaurants
├── supabase/
│   └── schema.sql         # Supabase schema
├── .env                  # Environment variables
├── .gitignore           # Git ignore file
├── package.json         # Dependencies
└── server.js           # Main server file
```

## Testing

### Using Browser
Visit: http://localhost:5173/test-connection

### Using curl
```bash
curl http://localhost:5001/api/health
curl http://localhost:5001/api/restaurants
```

## Notes
- Users, restaurants, and orders are stored in Supabase.
- JWT tokens expire after 24 hours
- OTP is sent via Twilio Verify SMS when configured.
- In production, SMS OTP config is required.
