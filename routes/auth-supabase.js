const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// Signup with phone OTP (Step 1: Send OTP)
router.post('/signup/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Send OTP via Supabase Auth
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
    });

    if (error) {
      console.error('Supabase OTP error:', error);
      return res.status(400).json({ message: error.message });
    }

    return res.status(200).json({
      message: 'OTP sent to your phone number',
      maskedPhone: phone.slice(0, 3) + '****' + phone.slice(-4),
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// Signup with phone OTP (Step 2: Verify OTP and create user)
router.post('/signup/verify-otp', async (req, res) => {
  try {
    const { phone, otp, fullName, email } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    // Verify OTP with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      phone: phone,
      token: otp,
      type: 'sms',
    });

    if (authError) {
      console.error('OTP verification error:', authError);
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Create user profile in your users table
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id, // Use Supabase auth user ID
        full_name: fullName || '',
        email: email || '',
        phone: phone,
      });

    if (profileError && profileError.code !== '23505') { // Ignore duplicate key error
      console.error('Profile creation error:', profileError);
    }

    return res.status(200).json({
      message: 'Signup successful',
      user: {
        id: authData.user.id,
        phone: authData.user.phone,
        email: email,
        fullName: fullName,
      },
      session: authData.session,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

// Login with phone OTP (Step 1: Send OTP)
router.post('/login/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Send OTP via Supabase Auth
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
    });

    if (error) {
      console.error('Supabase OTP error:', error);
      return res.status(400).json({ message: error.message });
    }

    return res.status(200).json({
      message: 'OTP sent to your phone number',
      maskedPhone: phone.slice(0, 3) + '****' + phone.slice(-4),
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// Login with phone OTP (Step 2: Verify OTP)
router.post('/login/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    // Verify OTP with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      phone: phone,
      token: otp,
      type: 'sms',
    });

    if (authError) {
      console.error('OTP verification error:', authError);
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    return res.status(200).json({
      message: 'Login successful',
      user: profile || {
        id: authData.user.id,
        phone: authData.user.phone,
      },
      session: authData.session,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

// Email/Password Login (keep existing method)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Use Supabase Auth for email/password login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return res.status(200).json({
      message: 'Login successful',
      user: profile || {
        id: data.user.id,
        email: data.user.email,
      },
      session: data.session,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Login failed' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      await supabase.auth.signOut();
    }

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Logout failed' });
  }
});

module.exports = router;
