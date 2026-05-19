const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendEmail = require('../utils/sendEmail');

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    // Generate a 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to User Schema
    user.resetOTP = otp;
    user.resetOTPExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 minutes
    await user.save();

    console.log('\n==================================================');
    console.log(`🔑 [OTP SECURITY] FOR PASSWORD RESET (${user.email}): ${otp}`);
    console.log('==================================================\n');

    // Send email using SMTP
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded-lg: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <h2 style="color: #6d28d9; text-align: center; margin-bottom: 30px;">🔑 Reset Your Password</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>We received a request to reset your password for your Wedding Expense Tracker account.</p>
        <p>Please use the following 6-digit One-Time Password (OTP) to verify your request. This OTP is valid for the next <strong>10 minutes</strong>:</p>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; text-align: center; margin: 25px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #6d28d9;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 13px; text-align: center; margin-top: 40px; border-top: 1px solid #f3f4f6; padding-top: 15px;">
          If you did not request a password reset, please ignore this email. Your account remains fully secure.
        </p>
      </div>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Wedding Expense Tracker - Password Reset OTP',
        html
      });
      res.json({ message: 'OTP sent successfully to your email' });
    } catch (emailError) {
      console.error('Email sending failed, but OTP was generated:', emailError);
      res.json({ 
        message: 'OTP generated. Email delivery failed, but you can check server logs or proceed if you have the OTP.',
        emailFailed: true
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ 
      email, 
      resetOTP: otp,
      resetOTPExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ 
      email, 
      resetOTP: otp,
      resetOTPExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP session' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetOTP = undefined;
    user.resetOTPExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.name = name || user.name;
    await user.save();
    res.json({ name: user.name, email: user.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getProfile, forgotPassword, verifyOTP, resetPassword, updateProfile };

