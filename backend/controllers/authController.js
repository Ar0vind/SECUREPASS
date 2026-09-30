const crypto = require("crypto");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

// How long a password reset link stays valid.
const RESET_TOKEN_EXPIRES_MINUTES =
  Number(process.env.RESET_TOKEN_EXPIRES_MINUTES) || 15;

// Regex for strong password validation (used as a fallback for backend security)
const isValidPassword = (password) => {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 2. Validate password strength
    if (!isValidPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters, and include uppercase, lowercase, number, and special character.",
      });
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword, // NEVER store raw password
    });

    if (user) {
      res.status(201).json({ message: "User registered successfully" });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body; // 'identifier' can be email OR username

    // 1. Find user by email OR username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    // 2. Check user and passwords match
    if (user && (await bcrypt.compare(password, user.password))) {
      // 3. Generate JWT
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
      });

      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token,
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Request a password reset link
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return the same generic response whether or not the account
    // exists — this stops the endpoint from being used to find out which
    // emails are registered.
    const genericResponse = {
      message:
        "If an account with that email exists, a password reset link has been sent.",
    };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Generate a random token. Only its SHA-256 hash is stored, so a leaked
    // database can't be used to reset accounts even before the link expires.
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // The reset token is saved regardless of whether the email step
    // succeeds — {validateBeforeSave:false} is a defensive no-op here since
    // we're only touching the two reset fields, not user-provided data.
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

    // Sending the email is deliberately isolated from the rest of the
    // handler: if SMTP hiccups (auth error, throttling, timeout...), we log
    // it server-side for debugging but still return the same generic
    // response below — a delivery failure should never surface as a 500
    // to the client, and it should never block a retry.
    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your SecurePass password",
        text:
          `We received a request to reset your SecurePass password.\n\n` +
          `Reset it here (expires in ${RESET_TOKEN_EXPIRES_MINUTES} minutes):\n${resetUrl}\n\n` +
          `If you didn't request this, you can safely ignore this email.`,
        html:
          `<p>We received a request to reset your SecurePass password.</p>` +
          `<p><a href="${resetUrl}">Click here to reset your password</a> ` +
          `(expires in ${RESET_TOKEN_EXPIRES_MINUTES} minutes).</p>` +
          `<p>If you didn't request this, you can safely ignore this email.</p>`,
      });
    } catch (emailError) {
      console.error(
        `[forgotPassword] sendEmail failed for ${user.email}:`,
        emailError,
      );
      // Deliberately no error response here — see comment above.
    }

    res.status(200).json(genericResponse);
  } catch (error) {
    console.error("[forgotPassword] Unexpected error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Reset password using a valid reset token
// @route   POST /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "New password is required" });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters, and include uppercase, lowercase, number, and special character.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset link. Please request a new one." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    console.error("[resetPassword] Unexpected error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword };
