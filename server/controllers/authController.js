const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// ── Haversine distance (km) between two [lng, lat] GeoJSON coordinates ────────
const haversineKm = ([lng1, lat1], [lng2, lat2]) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Max km allowed between login device and registered pharmacy (env or default 10)
const MAX_LOGIN_KM = parseFloat(process.env.MAX_LOGIN_DISTANCE_KM || '10');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { medicalName, ownerName, email, phone, licenseNo, address, pincode, location, password } = req.body;

    // Validations
    if (!medicalName || !ownerName || !email || !phone || !licenseNo || !address || !pincode || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone must be a 10-digit number' });
    }

    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({ message: 'Phone number already registered' });
    }
    
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Block registration using the admin email
    const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    if (ADMIN_EMAIL && email.trim().toLowerCase() === ADMIN_EMAIL) {
      return res.status(400).json({ message: 'This email address cannot be used for registration' });
    }

    // Default location if not provided
    const userLocation = location && location.coordinates
      ? { type: 'Point', coordinates: location.coordinates }
      : { type: 'Point', coordinates: [0, 0] };

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate 6-digit verification OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, salt);
    const otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    const user = await User.create({
      medicalName,
      ownerName,
      email,
      phone,
      licenseNo,
      address,
      pincode,
      location: userLocation,
      password: hashedPassword,
      isVerified: false, // User is unverified until they check OTP
      verificationOtp: hashedOtp,
      verificationExpire: otpExpire,
    });

    // Send Verification Email
    try {
      await sendEmail({
        email: user.email,
        subject: 'DisPharma — Verify Your Email Address 🔑',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; background-color: #f0fdf4; border-radius: 12px; border: 1px solid #dcfce7;">
            <h2 style="color: #166534; text-align: center; margin-bottom: 8px;">Email Verification</h2>
            <p style="color: #334155; font-size: 15px;">Hello <strong>${user.ownerName}</strong>,</p>
            <p style="color: #334155; font-size: 15px;">Thank you for registering your pharmacy, <strong>${user.medicalName}</strong>, on DisPharma.</p>
            <p style="color: #334155; font-size: 15px;">Please verify your email address by using the 6-digit OTP below. It expires in <strong>10 minutes</strong>.</p>
            <div style="text-align: center; margin: 28px 0;">
              <span style="font-size: 38px; font-weight: bold; letter-spacing: 8px; color: #16a34a; background: #dcfce7; padding: 14px 28px; border-radius: 10px; display: inline-block;">${otp}</span>
            </div>
            <p style="color: #64748b; font-size: 13px;">If you did not initiate this registration, please ignore this email.</p>
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">&copy; ${new Date().getFullYear()} DisPharma Network. All rights reserved.</p>
          </div>
        `
      });
    } catch (emailErr) {
      console.error('⚠️ Verification email failed:', emailErr.message);
      // Clean up the created user so they can try again
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ message: 'Could not send verification email. Please check your email address or try again.' });
    }

    res.status(201).json({
      message: 'Registration successful. Verification OTP sent to email.',
      email: user.email,
      verificationRequired: true
    });
  } catch (error) {
    console.error('Register error:', error);
    // Handle Mongoose duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      const fieldLabel = field === 'email' ? 'Email' : field === 'phone' ? 'Phone number' : 'A field';
      return res.status(400).json({ message: `${fieldLabel} is already registered` });
    }
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages[0] || 'Validation error' });
    }
    res.status(500).json({ message: 'Server error during registration. Please try again.' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { identifier, phone, password, loginLat, loginLng } = req.body;
    
    // Support either new 'identifier' field or legacy 'phone' field
    const loginId = identifier || phone;

    if (!loginId || !password) {
      return res.status(400).json({ message: 'Email/Phone and password are required' });
    }

    const user = await User.findOne({
      $or: [
        { email: loginId },
        { phone: loginId }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in' });
    }

    // ── Location verification ────────────────────────────────────────────────
    const regCoords = user.location?.coordinates; // [lng, lat]
    const hasRegisteredLocation = regCoords && !(regCoords[0] === 0 && regCoords[1] === 0);
    const hasLoginLocation = loginLat != null && loginLng != null;

    if (hasRegisteredLocation && hasLoginLocation) {
      const distKm = haversineKm(regCoords, [parseFloat(loginLng), parseFloat(loginLat)]);
      if (distKm > MAX_LOGIN_KM) {
        return res.status(403).json({
          message: `Login blocked: Your current location is ${distKm.toFixed(1)} km away from your registered pharmacy. Maximum allowed is ${MAX_LOGIN_KM} km.`,
          locationError: true,
          distanceKm: distKm.toFixed(1),
        });
      }
    }

    res.json({
      _id: user._id,
      medicalName: user.medicalName,
      ownerName: user.ownerName,
      email: user.email,
      phone: user.phone,
      licenseNo: user.licenseNo,
      address: user.address,
      pincode: user.pincode,
      location: user.location,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  const u = req.user;
  res.json({
    _id: u._id,
    medicalName: u.medicalName,
    ownerName: u.ownerName,
    email: u.email,
    phone: u.phone,
    licenseNo: u.licenseNo,
    address: u.address,
    pincode: u.pincode,
    location: u.location,
    profilePhoto: u.profilePhoto || '',
  });
};

// @desc    Upload profile photo
// @route   POST /api/auth/upload-photo
// @access  Private
const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const photoUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePhoto: photoUrl },
      { new: true }
    );
    res.json({ profilePhoto: user.profilePhoto });
  } catch (err) {
    console.error('Upload photo error:', err);
    res.status(500).json({ message: 'Failed to upload photo' });
  }
};

// @desc    Forgot Password (Send OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return 200 even if user not found for security (prevent email enumeration)
      return res.status(200).json({ message: 'If that email is registered, an OTP has been sent.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP before saving to DB
    const salt = await bcrypt.genSalt(10);
    user.resetPasswordOtp = await bcrypt.hash(otp, salt);
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send Email
    try {
      await sendEmail({
        email: user.email,
        subject: 'DisPharma - Password Reset OTP',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f0fdf4; border-radius: 10px;">
            <h2 style="color: #166534; text-align: center;">Password Reset Request</h2>
            <p style="color: #334155; font-size: 16px;">Hello <strong>${user.ownerName}</strong>,</p>
            <p style="color: #334155; font-size: 16px;">We received a request to reset your password for DisPharma. Here is your 6-digit OTP:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #16a34a; background: #e2e8f0; padding: 10px 20px; border-radius: 8px;">${otp}</span>
            </div>
            <p style="color: #334155; font-size: 16px;">This OTP is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 40px;">&copy; ${new Date().getFullYear()} DisPharma Network</p>
          </div>
        `
      });
      res.status(200).json({ message: 'OTP sent to email successfully' });
    } catch (err) {
      console.error('OTP email error:', err);
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during forgot password' });
  }
};

// @desc    Reset Password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordOtp || !user.resetPasswordExpire) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Check expiration
    if (Date.now() > user.resetPasswordExpire) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp.toString(), user.resetPasswordOtp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Hash new password and update
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};

// @desc    Send OTP for login (when email already registered)
// @route   POST /api/auth/send-login-otp
// @access  Public
const sendLoginOtp = async (req, res) => {
  try {
    const { email, loginLat, loginLng } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Store login coordinates in the request for later verification
    req.loginLat = loginLat;
    req.loginLng = loginLng;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash and save with 10-min expiry
    const salt = await bcrypt.genSalt(10);
    user.loginOtp = await bcrypt.hash(otp, salt);
    user.loginOtpExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Send OTP email
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    await sendEmail({
      email: user.email,
      subject: 'DisPharma — Your Login OTP',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; background-color: #f0fdf4; border-radius: 12px; border: 1px solid #dcfce7;">
          <h2 style="color: #166534; text-align: center; margin-bottom: 8px;">Login Verification</h2>
          <p style="color: #334155; font-size: 15px;">Hello <strong>${user.ownerName}</strong>,</p>
          <p style="color: #334155; font-size: 15px;">Use the OTP below to log in to your DisPharma account. It expires in <strong>10 minutes</strong>.</p>
          <div style="text-align: center; margin: 28px 0;">
            <span style="font-size: 38px; font-weight: bold; letter-spacing: 8px; color: #16a34a; background: #dcfce7; padding: 14px 28px; border-radius: 10px; display: inline-block;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 13px;">If you did not request this, please ignore this email. Your account is safe.</p>
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">&copy; ${new Date().getFullYear()} DisPharma Network. All rights reserved.</p>
        </div>
      `,
    });

    res.status(200).json({ message: 'OTP sent to your email successfully' });
  } catch (error) {
    console.error('Send login OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
};

// @desc    Verify login OTP and return JWT
// @route   POST /api/auth/verify-login-otp
// @access  Public
const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp, loginLat, loginLng } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.loginOtp || !user.loginOtpExpire) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please request a new one.' });
    }

    // Check expiry
    if (Date.now() > user.loginOtpExpire) {
      user.loginOtp = undefined;
      user.loginOtpExpire = undefined;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp.toString(), user.loginOtp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    // ── Location verification ────────────────────────────────────────────────
    const regCoords = user.location?.coordinates;
    const hasRegisteredLocation = regCoords && !(regCoords[0] === 0 && regCoords[1] === 0);
    const hasLoginLocation = loginLat != null && loginLng != null;

    if (hasRegisteredLocation && hasLoginLocation) {
      const distKm = haversineKm(regCoords, [parseFloat(loginLng), parseFloat(loginLat)]);
      if (distKm > MAX_LOGIN_KM) {
        return res.status(403).json({
          message: `Login blocked: Your current location is ${distKm.toFixed(1)} km away from your registered pharmacy. Maximum allowed is ${MAX_LOGIN_KM} km.`,
          locationError: true,
          distanceKm: distKm.toFixed(1),
        });
      }
    }

    // Clear OTP after successful use
    user.loginOtp = undefined;
    user.loginOtpExpire = undefined;
    await user.save();

    res.status(200).json({
      _id: user._id,
      medicalName: user.medicalName,
      ownerName: user.ownerName,
      email: user.email,
      phone: user.phone,
      licenseNo: user.licenseNo,
      address: user.address,
      pincode: user.pincode,
      location: user.location,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Verify login OTP error:', error);
    res.status(500).json({ message: 'Server error during OTP verification.' });
  }
};

// @desc    Verify registration OTP and activate account
// @route   POST /api/auth/verify-registration-otp
// @access  Public
const verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    if (!user.verificationOtp || !user.verificationExpire) {
      return res.status(400).json({ message: 'No active verification OTP found. Please register again.' });
    }

    // Check expiration
    if (Date.now() > user.verificationExpire) {
      // Clean up unverified user so they can register again
      await User.findByIdAndDelete(user._id);
      return res.status(400).json({ message: 'Verification OTP has expired. Please register again.' });
    }

    // Verify OTP (allow 999999 bypass in development)
    const isTestBypass = process.env.NODE_ENV === 'development' && otp.toString() === '999999';
    const isMatch = isTestBypass || await bcrypt.compare(otp.toString(), user.verificationOtp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    // Mark as verified
    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationExpire = undefined;
    await user.save();

    // Send Welcome Email
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    sendEmail({
      email: user.email,
      subject: 'Welcome to DisPharma Network! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f0fdf4; border-radius: 10px; border: 1px solid #dcfce7;">
          <h1 style="color: #166534; text-align: center; margin-bottom: 20px;">Welcome to DisPharma!</h1>
          <p style="color: #334155; font-size: 16px;">Hello <strong>${user.ownerName}</strong>,</p>
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">Your pharmacy, <strong>${user.medicalName}</strong>, has been successfully registered on DisPharma!</p>
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">Thank you for joining India's premier inter-pharmacy network. You can now log in, list your stock, search for medicines, and refer customers to nearby pharmacies to earn a 4% referral margin.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${clientUrl}/login" style="background-color: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.2);">Go to Dashboard</a>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">If you have any questions or need assistance, feel free to reply to this email.</p>
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">&copy; ${new Date().getFullYear()} DisPharma Network. All rights reserved.</p>
        </div>
      `
    }).catch(emailErr => {
      console.error('⚠️ Welcome email failed (non-fatal):', emailErr.message);
    });

    res.status(200).json({
      _id: user._id,
      medicalName: user.medicalName,
      ownerName: user.ownerName,
      email: user.email,
      phone: user.phone,
      licenseNo: user.licenseNo,
      address: user.address,
      pincode: user.pincode,
      location: user.location,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Verify registration OTP error:', error);
    res.status(500).json({ message: 'Server error during OTP verification.' });
  }
};

// @desc    Resend registration verification OTP
// @route   POST /api/auth/resend-verification-otp
// @access  Public
const resendVerificationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified. Please login.' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    user.verificationOtp = await bcrypt.hash(otp, salt);
    user.verificationExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail({
      email: user.email,
      subject: 'DisPharma — Verify Your Email Address 🔑',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; background-color: #f0fdf4; border-radius: 12px; border: 1px solid #dcfce7;">
          <h2 style="color: #166534; text-align: center; margin-bottom: 8px;">Email Verification</h2>
          <p style="color: #334155; font-size: 15px;">Hello <strong>${user.ownerName}</strong>,</p>
          <p style="color: #334155; font-size: 15px;">Please verify your email address by using the 6-digit OTP below. It expires in <strong>10 minutes</strong>.</p>
          <div style="text-align: center; margin: 28px 0;">
            <span style="font-size: 38px; font-weight: bold; letter-spacing: 8px; color: #16a34a; background: #dcfce7; padding: 14px 28px; border-radius: 10px; display: inline-block;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">&copy; ${new Date().getFullYear()} DisPharma Network. All rights reserved.</p>
        </div>
      `
    });

    res.status(200).json({ message: 'Verification OTP resent to your email.' });
  } catch (error) {
    console.error('Resend verification OTP error:', error);
    res.status(500).json({ message: 'Failed to send verification OTP. Please try again.' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  sendLoginOtp,
  verifyLoginOtp,
  uploadProfilePhoto,
  verifyRegistrationOtp,
  resendVerificationOtp
};
