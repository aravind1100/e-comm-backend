import User from "../Models/user.schema.js";
import asyncHandler from "express-async-handler";


// GET /api/users/me
export const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    // req.userId is already set by protect middleware
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Fetch user excluding password
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});



// @desc    Get all users (Admin only)
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({role:"user"})
      .select("-password -resetPasswordToken -resetPasswordExpire")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching users",
    });
  }
};

// @desc    Get single user by ID
// @access  Private
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -resetPasswordToken -resetPasswordExpire"
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Authorization: Only admin or the user themselves can access
    if (user.role !== "admin" && user.id !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this user",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching user",
    });
  }
};

// @desc    Update user
// @access  Private
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find user
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
 
   const requestingUser = await User.findById(req.userId);
    // Authorization: Only admin or the user themselves can update
    if (requestingUser.role !== "admin" && req.userId !== id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this user",
      });
    }
    
    
    // Prevent role escalation (only admin can change roles)
    if (updates.role && requestingUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can change user roles",
      });
    }

    // Prevent email change through this route
    if (updates.email) {
      return res.status(400).json({
        success: false,
        message: "Please use the dedicated email update route",
      });
    }

    // Handle password update separately
    if (updates.password) {
      return res.status(400).json({
        success: false,
        message: "Please use the password reset route",
      });
    }

    // Apply updates
    Object.keys(updates).forEach((key) => {
      if (key !== "email" && key !== "password" ) {
        user[key] = updates[key];
      }
    });

    // Save updated user
    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating user",
    });
  }
};

// @desc    Delete user
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
   
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
     const requestingUser = await User.findById(req.userId)
    if(requestingUser.role !== "admin" && req.userId !== req.params.id){
      return res.status(403).json({
        success:false,
        message:"Not authorized to delete this user"
      })
    }

    await user.deleteOne();

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting user",
    });
  }
};

// @desc    Update email address
// @access  Private
export const updateEmail = async (req, res) => {
  try {
    const { newEmail } = req.body;
     const requestingUser = await User.findById(req.userId)
     if(requestingUser.role !== "admin" && req.userId !== req.params.id){
      return res.status(403).json({
        success:false,
        message:"Not authorized to update email to this user"
      })
    }
    if (!newEmail) {
      return res.status(400).json({
        success: false,
        message: "New email is required",
      });
    }

    // Check if email is already registered
    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "Email already in use",
      });
    }

    // Checks proper format of email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
      }

      
    // Update email
    const targetId = req.userId === req.params.id ? req.userId : req.params.id;
    const user = await User.findById(targetId);
    user.email = newEmail;
    user.emailVerified = false; // Reset verification status

    await user.save();

    // TODO: Send verification email to new address
      // await sendVerificationEmail(newEmail, verificationToken);

    return res.status(200).json({
      success: true,
      message: "Email updated successfully. Verification required.",
      email: user.email,
    });
    } catch (error) {
    console.error("Error updating email:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating email",
    });
  }
};
