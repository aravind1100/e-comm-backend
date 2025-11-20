import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    // Basic registration info
    username: {
      type: String,
      required: [true, "Please add a name"],
      unique: true,
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },

    // Authentication
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ------------------------
    // Profile fields
    // ------------------------
    profileImage: {
      type: String, // store URL or Base64
      default: "",
    },

    phone: {
      type: String,
      default: "",
      validate: {
        validator: function (v) {
          return v === "" || /^\d{10}$/.test(v); // 10-digit phone
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },

    address: {
      type: String,
      default: "",
      trim: true,
      maxlength: [200, "Address cannot exceed 200 characters"],
    },

    // Forgot password & verification
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,

    passwordChangedAt: Date,

    googleId: String,
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
