import User from "../Models/user.schema.js";
import { sendPasswordResetEmail } from "../Utils/email.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";
import Joi from "joi";

dotenv.config();

// Joi Validation Schemas
const signupSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(30)
    .required()
    .pattern(/^[a-zA-Z0-9_]+$/, 'alphanumeric and underscores')
    .messages({
      'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
      'any.required': 'Username is required',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 30 characters'
    }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'any.required': 'Password is required',
      'string.min': 'Password must be at least 6 characters'
    })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required'
  })
});

const resetPasswordSchema = Joi.object({
  password: Joi.string().min(6).required().messages({
    'any.required': 'Password is required',
    'string.min': 'Password must be at least 6 characters'
  })
});

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

// POST /api/auth/signup
export const signup = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = signupSchema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({ message: "Validation error", errors });
    }
    
    const { username, email, password } = value;
    
    // Check for existing user by email or username
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({ message: "Email already registered" });
      } else {
        return res.status(409).json({ message: "Username already taken" });
      }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });
    
    
    
    // Response without password
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
     
    });
  } catch (error) {
    console.error("Signup error:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: "Validation error", errors });
    }
    
    res.status(500).json({
      message: "Server error during registration",
      error: error.message,
    });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({ message: "Validation error", errors });
    }
    
    const { email, password } = value;
    
    // Find user and include password
    const user = await User.findOne({ email }).select("+password");
    
    // Always return same error for security
    const invalidCreds = () => res.status(401).json({ message: "Invalid credentials" });
    
    if (!user) return invalidCreds();
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return invalidCreds();
    
    // Generate token
    const token = generateToken(user._id);
    
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token,
    });
    // res.cookie('accessToken', token, {
    //     httpOnly: true,
    //     secure: true,            // HTTPS only
    //     sameSite: 'Strict',      // CSRF protection
    //     maxAge: 60 * 60 * 1000,  // 1 hour
    //  });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error during login",
      error: error.message,
    });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = forgotPasswordSchema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({ message: "Validation error", errors });
    }
    
    const { email } = value;
    
    const user = await User.findOne({ email });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({ message: "Password reset email sent if account exists" });
    }
    
    // Generate secure reset token (unhashed)
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // Create hashed token for database storage
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    
    // Set token with expiration (10 minutes)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save();
    
    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Don't fail the request, just log the error
    }
    
    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      message: "Error processing password reset request",
      error: error.message,
    });
  }
};

// POST /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = resetPasswordSchema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({ message: "Validation error", errors });
    }
    
    const { token } = req.params;
    const { password } = value;
    
    // Hash token to match database value
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    
    // Find user by token and check expiration
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
    
    // Update password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.passwordChangedAt = Date.now();
    
    await user.save();
    
    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      message: "Error resetting password",
      error: error.message,
    });
  }
};

