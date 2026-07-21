const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  medicalName: {
    type: String,
    required: [true, 'Medical name is required'],
    trim: true,
  },
  ownerName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
  },
  licenseNo: {
    type: String,
    required: [true, 'License number is required'],
    trim: true,
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    trim: true,
  },
  location: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordOtp: {
    type: String,
  },
  resetPasswordExpire: {
    type: Date,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationOtp: {
    type: String,
  },
  verificationExpire: {
    type: Date,
  },
  loginOtp: {
    type: String,
  },
  loginOtpExpire: {
    type: Date,
  },
  website: {
    type: String,
    trim: true,
    default: '',
  },
  profilePhoto: {
    type: String,
    default: '',
  },
  maxLoginDistanceKm: {
    type: Number,
    default: null, // null = use global MAX_LOGIN_DISTANCE_KM env setting
    min: 0.5,
    max: 500,
  },
});

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
