import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config()

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
});

export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `https://yourapp.com/reset-password/${resetToken}`;
  const mailOptions = {
    from: `"Your App 🛡️" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔑 Password Reset Request",
    text: `You requested a password reset. Copy and paste this link into your browser:\n\n${resetUrl}\n\nThis link expires in 10 minutes.`,
    html: `
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p><em>This link will expire in 10 minutes.</em></p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", info.messageId);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
  }
};
