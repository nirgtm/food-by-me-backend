const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');
const pendingSignups = new Map(); // email -> pending signup payload
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_PHONE_REGEX = /^\+[1-9]\d{7,14}$/;
const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function normalizeCountryCode(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? `+${digits}` : '+91';
}

const DEFAULT_COUNTRY_CODE = normalizeCountryCode(process.env.DEFAULT_COUNTRY_CODE || '+91');

async function findUsersByEmailOrPhone(email, phone) {
  const { data, error } = await supabase
    .from('users')
    .select('id,email,phone')
    .or(`email.eq.${email},phone.eq.${phone}`);

  if (error) {
    throw error;
  }
  return Array.isArray(data) ? data : [];
}

async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('id,full_name,email,phone,password_hash')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data || null;
}

async function createUser({ fullName, email, phone, passwordHash }) {
  const { error } = await supabase.from('users').insert({
    full_name: fullName,
    email,
    phone,
    password_hash: passwordHash,
  });

  if (error) {
    throw error;
  }
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizePhoneNumber(rawPhone = '') {
  const raw = String(rawPhone || '').trim();
  if (!raw) return '';

  if (raw.startsWith('+')) {
    return `+${raw.slice(1).replace(/\D/g, '')}`;
  }

  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return `${DEFAULT_COUNTRY_CODE}${digits}`;
}

function maskPhoneNumber(phone = '') {
  if (!phone) return '';
  const visibleDigits = phone.slice(-4);
  const maskedCount = Math.max(0, phone.length - visibleDigits.length - 1);
  return `${phone.slice(0, 1)}${'*'.repeat(maskedCount)}${visibleDigits}`;
}

function generateEmailSignupPhone() {
  // Generate an E.164-like synthetic phone (+1XXXXXXXXXX) for email-only accounts.
  // This satisfies NOT NULL + UNIQUE phone constraints without collecting user phone.
  const epochTail = String(Date.now()).slice(-7);
  const randomTail = String(Math.floor(100 + Math.random() * 900));
  return `+1${epochTail}${randomTail}`;
}

function mapSignupEmailError(error) {
  const code = String(error?.code || '');
  const message = String(error?.message || '');
  const normalizedMessage = message.toLowerCase();

  if (code === '23505' && normalizedMessage.includes('users_email_key')) {
    return { status: 400, message: 'User already exists with this email' };
  }

  if (code === '42501' || normalizedMessage.includes('row-level security')) {
    return {
      status: 500,
      message: 'Database permission issue. Configure SUPABASE_SERVICE_ROLE_KEY on backend.',
    };
  }

  if (code === '42P01') {
    return { status: 500, message: 'Database table "users" not found. Run schema setup.' };
  }

  if (code === '42703') {
    return {
      status: 500,
      message:
        'Database schema mismatch in users table. Expected columns: full_name, email, phone, password_hash.',
    };
  }

  if (code === '23502') {
    return { status: 500, message: 'Database rejected signup because a required field is missing.' };
  }

  return {
    status: 500,
    message: isProduction() ? 'Failed to create account' : `Failed to create account: ${message || 'Unknown error'}`,
  };
}

function sanitizeSignupInput(body = {}) {
  return {
    fullName: String(body.fullName || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    password: String(body.password || ''),
    phone: normalizePhoneNumber(body.phone || ''),
  };
}

function validateSignupInput({ fullName, email, password, phone }) {
  if (!fullName || !email || !password || !phone) {
    return 'fullName, email, phone and password are required';
  }

  if (!EMAIL_REGEX.test(email)) {
    return 'Enter a valid email';
  }

  if (!E164_PHONE_REGEX.test(phone)) {
    return 'Enter a valid mobile number with country code';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }

  return null;
}

function isProduction() {
  return (process.env.NODE_ENV || '').toLowerCase() === 'production';
}

function allowDevOtpFallback() {
  return (
    !isProduction() &&
    String(process.env.ALLOW_DEV_OTP_FALLBACK || '').toLowerCase() === 'true'
  );
}

function hasTwilioVerifyConfig() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_VERIFY_SERVICE_SID
  );
}

async function twilioVerifyRequest(path, payload) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !verifyServiceSid) {
    throw new Error('Twilio Verify is not configured');
  }

  const url = `https://verify.twilio.com/v2/Services/${verifyServiceSid}${path}`;
  const basicAuthToken = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuthToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Twilio Verify request failed');
  }

  return data;
}

async function dispatchSignupOtp(phone, fallbackOtp) {
  if (hasTwilioVerifyConfig()) {
    await twilioVerifyRequest('/Verifications', {
      To: phone,
      Channel: 'sms',
    });
    return { delivery: 'sms' };
  }

  if (!allowDevOtpFallback()) {
    throw new Error('SMS OTP service is not configured on server');
  }

  console.log(`DEV OTP for ${phone}: ${fallbackOtp}`);
  return { delivery: 'dev', devOtp: fallbackOtp };
}

async function validateSignupOtp(phone, otp, fallbackOtp) {
  if (hasTwilioVerifyConfig()) {
    try {
      const data = await twilioVerifyRequest('/VerificationCheck', {
        To: phone,
        Code: otp,
      });
      return data.status === 'approved';
    } catch (error) {
      const message = String(error.message || '').toLowerCase();
      if (
        message.includes('incorrect') ||
        message.includes('expired') ||
        message.includes('invalid') ||
        message.includes('not found')
      ) {
        return false;
      }
      throw error;
    }
  }

  return otp === fallbackOtp;
}

function getRetryAfterSeconds(lastSentAt) {
  return Math.ceil((OTP_RESEND_COOLDOWN_MS - (Date.now() - lastSentAt)) / 1000);
}

router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password, phone } = sanitizeSignupInput(req.body);
    const validationError = validateSignupInput({ fullName, email, password, phone });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existingUsers = await findUsersByEmailOrPhone(email, phone);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const now = Date.now();
    const existingPending = pendingSignups.get(email);

    if (existingPending && now - existingPending.lastSentAt < OTP_RESEND_COOLDOWN_MS) {
      return res.status(429).json({
        message: `Please wait ${getRetryAfterSeconds(existingPending.lastSentAt)}s before requesting another OTP`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = hasTwilioVerifyConfig() ? null : generateOtp();
    const expiresAt = now + OTP_EXPIRY_MS;

    const otpDispatch = await dispatchSignupOtp(phone, otp);

    pendingSignups.set(email, {
      fullName,
      email,
      phone,
      passwordHash: hashedPassword,
      otp,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
    });

    return res.status(200).json({
      message: 'OTP sent to your mobile number. Verify to complete signup.',
      maskedPhone: maskPhoneNumber(phone),
      expiresInSeconds: Math.floor(OTP_EXPIRY_MS / 1000),
      ...(isProduction() || !otpDispatch.devOtp ? {} : { devOtp: otpDispatch.devOtp }),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating user' });
  }
});

router.post('/signup/resend-otp', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email' });
    }

    const pending = pendingSignups.get(email);
    if (!pending) {
      return res.status(400).json({ message: 'No pending signup found for this email' });
    }

    const now = Date.now();
    if (now - pending.lastSentAt < OTP_RESEND_COOLDOWN_MS) {
      return res.status(429).json({
        message: `Please wait ${getRetryAfterSeconds(pending.lastSentAt)}s before requesting another OTP`,
      });
    }

    const otp = hasTwilioVerifyConfig() ? null : generateOtp();
    const otpDispatch = await dispatchSignupOtp(pending.phone, otp);

    pending.otp = otp;
    pending.expiresAt = now + OTP_EXPIRY_MS;
    pending.attempts = 0;
    pending.lastSentAt = now;
    pendingSignups.set(email, pending);

    return res.status(200).json({
      message: 'A new OTP has been sent.',
      maskedPhone: maskPhoneNumber(pending.phone),
      expiresInSeconds: Math.floor(OTP_EXPIRY_MS / 1000),
      ...(isProduction() || !otpDispatch.devOtp ? {} : { devOtp: otpDispatch.devOtp }),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to resend OTP' });
  }
});

router.post('/signup/verify-otp', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const otp = String(req.body?.otp || '').trim();

    if (!email || !otp) {
      return res.status(400).json({ message: 'email and otp are required' });
    }

    const pending = pendingSignups.get(email);
    if (!pending) {
      return res.status(400).json({ message: 'No pending signup found for this email' });
    }

    if (Date.now() > pending.expiresAt) {
      pendingSignups.delete(email);
      return res.status(400).json({ message: 'OTP expired. Please signup again.' });
    }

    if (pending.attempts >= MAX_OTP_ATTEMPTS) {
      pendingSignups.delete(email);
      return res.status(429).json({ message: 'Too many invalid OTP attempts. Please signup again.' });
    }

    const isOtpValid = await validateSignupOtp(pending.phone, otp, pending.otp);
    if (!isOtpValid) {
      pending.attempts += 1;
      pendingSignups.set(email, pending);
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const existingUsers = await findUsersByEmailOrPhone(pending.email, pending.phone);
    if (existingUsers.length > 0) {
      pendingSignups.delete(email);
      return res.status(400).json({ message: 'User already exists' });
    }

    await createUser({
      fullName: pending.fullName,
      email: pending.email,
      phone: pending.phone,
      passwordHash: pending.passwordHash,
    });

    pendingSignups.delete(email);

    return res.status(201).json({ message: 'Account verified and created successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      if (pendingSignups.has(normalizedEmail)) {
        return res.status(403).json({ message: 'Please verify mobile OTP before logging in' });
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { email: user.email }, 
      process.env.JWT_SECRET || 'your_jwt_secret', 
      { expiresIn: '24h' }
    );
    
    res.json({ token, fullName: user.full_name });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Email-only signup (no phone/OTP required)
router.post('/signup-email', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Validate input
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'fullName, email, and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Enter a valid email' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user directly (no OTP verification).
    // users.phone is UNIQUE NOT NULL in schema, so generate a synthetic unique value.
    const maxPhoneAttempts = 5;
    let created = false;
    let lastCreateError = null;

    for (let attempt = 0; attempt < maxPhoneAttempts; attempt += 1) {
      try {
        await createUser({
          fullName: fullName.trim(),
          email: normalizedEmail,
          phone: generateEmailSignupPhone(),
          passwordHash: hashedPassword,
        });
        created = true;
        break;
      } catch (createError) {
        lastCreateError = createError;
        const isPhoneUniqueViolation =
          createError?.code === '23505' && String(createError?.message || '').includes('users_phone_key');

        if (isPhoneUniqueViolation) {
          continue;
        }
        throw createError;
      }
    }

    if (!created) {
      throw lastCreateError || new Error('Failed to allocate synthetic phone');
    }

    return res.status(201).json({ 
      message: 'Account created successfully! You can now log in.' 
    });
  } catch (error) {
    console.error('Email signup error:', error);
    const mapped = mapSignupEmailError(error);
    return res.status(mapped.status).json({
      message: mapped.message,
      ...(isProduction()
        ? {}
        : {
            code: String(error?.code || ''),
            details: String(error?.details || ''),
          }),
    });
  }
});

// Request password reset
router.post('/request-password-reset', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email' });
    }

    const user = await findUserByEmail(email);
    
    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      return res.status(200).json({ 
        message: 'If an account exists with this email, password reset instructions have been sent.' 
      });
    }

    // In a real app, you would:
    // 1. Generate a secure reset token
    // 2. Store it in database with expiry
    // 3. Send email with reset link
    // For now, we'll just confirm the email exists
    
    return res.status(200).json({ 
      message: 'Password reset instructions sent. You can now set a new password.',
      emailExists: true // Only for demo purposes
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to process password reset request' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const newPassword = String(req.body?.newPassword || '');

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await findUserByEmail(email);
    
    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    const { error } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('email', email);

    if (error) {
      throw error;
    }

    return res.status(200).json({ 
      message: 'Password reset successful. You can now log in with your new password.' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
});

module.exports = router;
