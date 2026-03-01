# Supabase Authentication Setup Guide

This guide will help you enable phone OTP authentication using Supabase's built-in auth system.

## Step 1: Enable Phone Authentication in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `yancdrqpgjfseoajcwwzs`
3. Click **Authentication** in the left sidebar
4. Go to **Providers** tab
5. Find **Phone** and click to enable it

## Step 2: Configure Phone Provider

Supabase supports multiple SMS providers. Choose one:

### Option A: Twilio (Recommended - Most Reliable)
1. Sign up at https://www.twilio.com/try-twilio
2. Get your credentials:
   - Account SID
   - Auth Token
   - Phone Number (or Messaging Service SID)
3. In Supabase Phone settings, enter:
   - Twilio Account SID
   - Twilio Auth Token
   - Twilio Message Service SID (or Phone Number)

### Option B: MessageBird (Alternative)
1. Sign up at https://messagebird.com
2. Get API key
3. Configure in Supabase Phone settings

### Option C: Vonage (Alternative)
1. Sign up at https://vonage.com
2. Get API credentials
3. Configure in Supabase Phone settings

## Step 3: Get Supabase Anon Key

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy the **anon public** key (NOT the service_role key)
3. Add it to your environment variables

## Step 4: Update Environment Variables

### Local Development (.env file):
```env
SUPABASE_URL=https://yancdrqpgjfseoajcwwzs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_public_key_here
```

### Vercel Production:
1. Go to Vercel Dashboard → foodbymebackend project
2. Settings → Environment Variables
3. Add new variable:
   - Key: `SUPABASE_ANON_KEY`
   - Value: Your anon public key
4. Redeploy the backend

## Step 5: Test the New Auth Flow

### API Endpoints:

#### 1. Signup - Send OTP
```bash
POST /api/auth-supabase/signup/send-otp
Body: {
  "phone": "+919876543210"
}
```

#### 2. Signup - Verify OTP
```bash
POST /api/auth-supabase/signup/verify-otp
Body: {
  "phone": "+919876543210",
  "otp": "123456",
  "fullName": "John Doe",
  "email": "john@example.com"
}
```

#### 3. Login - Send OTP
```bash
POST /api/auth-supabase/login/send-otp
Body: {
  "phone": "+919876543210"
}
```

#### 4. Login - Verify OTP
```bash
POST /api/auth-supabase/login/verify-otp
Body: {
  "phone": "+919876543210",
  "otp": "123456"
}
```

## Step 6: Update Frontend (Optional)

To use the new Supabase auth endpoints in your frontend:

1. Update API endpoints in `src/config/api.js`:
```javascript
AUTH: {
  SEND_SIGNUP_OTP: `${API_BASE_URL}/api/auth-supabase/signup/send-otp`,
  VERIFY_SIGNUP_OTP: `${API_BASE_URL}/api/auth-supabase/signup/verify-otp`,
  SEND_LOGIN_OTP: `${API_BASE_URL}/api/auth-supabase/login/send-otp`,
  VERIFY_LOGIN_OTP: `${API_BASE_URL}/api/auth-supabase/login/verify-otp`,
}
```

2. Update your signup/login components to use the new two-step flow

## Benefits of Supabase Auth

✅ Built-in OTP generation and verification
✅ Automatic rate limiting
✅ Session management
✅ Multiple SMS provider support
✅ Email auth support (can add later)
✅ Social auth support (Google, Facebook, etc.)
✅ No need for separate JWT implementation

## Troubleshooting

### OTP not sending?
- Check Supabase logs: Dashboard → Logs → Auth Logs
- Verify SMS provider credentials are correct
- Check phone number format (must be E.164: +919876543210)

### "Invalid credentials" error?
- Make sure SUPABASE_ANON_KEY is set correctly
- Verify phone provider is enabled in Supabase dashboard

### OTP expired?
- Default OTP expiry is 60 seconds
- Can be configured in Supabase Auth settings

## Cost Considerations

- Supabase Auth: Free for up to 50,000 monthly active users
- SMS costs depend on your provider:
  - Twilio: ~$0.0075 per SMS in India
  - MessageBird: ~$0.006 per SMS in India
  - Vonage: ~$0.005 per SMS in India

## Next Steps

Once phone auth is working:
1. Add email OTP (same process, just enable Email provider)
2. Add social logins (Google, Facebook)
3. Implement password reset via OTP
4. Add two-factor authentication
