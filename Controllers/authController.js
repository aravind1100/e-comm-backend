import User from "../Models/user.schema.js";
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


