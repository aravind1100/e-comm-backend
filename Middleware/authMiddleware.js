import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../Models/user.schema.js";
import dotenv from "dotenv";

dotenv.config();

// 1. Protected Route Middleware
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  const authHeader = req.headers.authorization;
   
  if (authHeader && authHeader.startsWith("Bearer")) {
    try {
      // Extract token from header
      token = authHeader.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      
      // Store user ID directly in request
      req.userId = decoded.userId;
     
      // Verify user exists and check password change timestamp
      const user = await User.findById(req.userId).select("passwordChangedAt");
      
      if (!user) {
        res.status(401);
        throw new Error("User not found");
      }

      // Check if password was changed after token was issued
      if (user.passwordChangedAt) {
        const changedTimestamp = parseInt(
          user.passwordChangedAt.getTime() / 1000,
          10
        );

        if (decoded.iat < changedTimestamp) {
          return res
            .status(401)
            .json({ message: "Password changed, please login again" });
        }
      }

      next();
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(401);
      throw new Error("Not authorized, invalid token");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }
});

// 2. Admin Authorization Middleware
const admin = asyncHandler(async (req, res, next) => {
  try {
    // Fetch user role using the stored ID
    const user = await User.findById(req.userId).select("role");
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    
    if (user.role === 'admin') {
      next();
    } else {
      res.status(403); // Forbidden
      throw new Error('Admin privileges required');
    }
  } catch (error) {
    console.error('Admin check error:', error);
    throw error;
  }
});

export { protect, admin };