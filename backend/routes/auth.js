const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const { OAuth2Client } = require("google-auth-library");
const { pool } = require("../config/db");
const { sendVerificationEmail } = require("../services/email");
const { requireAuth } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimit");

require("dotenv").config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to check password complexity
const passwordValidator = body("password")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters long.")
  .matches(/[a-z]/)
  .withMessage("Password must contain at least one lowercase letter.")
  .matches(/[A-Z]/)
  .withMessage("Password must contain at least one uppercase letter.")
  .matches(/[0-9]/)
  .withMessage("Password must contain at least one number.")
  .matches(/[\W_]/)
  .withMessage("Password must contain at least one special character.");

// Helper to sign JWT token
const signToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};

// Helper to set HttpOnly Cookie
const setAuthCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax", // Must be "none" for cross-site cookie sharing in production
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
};

// ── 1. REGISTER ENDPOINT ──
router.post(
  "/register",
  authLimiter,
  [
    body("name").trim().notEmpty().withMessage("Full name is required."),
    body("email").trim().isEmail().withMessage("Must be a valid email address.").normalizeEmail(),
    passwordValidator,
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      // Check if user already exists
      const userCheck = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
      if (userCheck.rows.length > 0) {
        return res.status(409).json({ error: "An account with this email address already exists." });
      }

      // Generate verification token and hash password
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const passwordHash = await bcrypt.hash(password, 10);

      // Create new user in DB
      await pool.query(
        `INSERT INTO users (name, email, password_hash, is_verified, verification_token) 
         VALUES ($1, $2, $3, FALSE, $4)`,
        [name, email, passwordHash, verificationToken]
      );

      // Log verification URL directly to terminal console for local development testing
      const backendPort = process.env.PORT || 5000;
      console.log(`\n==================================================`);
      console.log(`🔑 [DEVELOPMENT ONLY] Email Verification URL for ${email}:`);
      console.log(`http://localhost:${backendPort}/api/auth/verify-email?token=${verificationToken}`);
      console.log(`==================================================\n`);

      // Send verification email (async, doesn't block response)
      try {
        await sendVerificationEmail(email, name, verificationToken);
      } catch (err) {
        console.error("Failed to send verification email during signup:", err);
      }

      res.status(201).json({
        message: "Registration successful! Please check your email to verify your account before logging in.",
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── 2. EMAIL VERIFICATION ENDPOINT ──
router.get("/verify-email", async (req, res, next) => {
  try {
    const { token } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    if (!token) {
      return res.redirect(`${frontendUrl}?verified=false&error=missing_token`);
    }

    // Verify token exists and belongs to unverified user
    const userResult = await pool.query(
      "SELECT id, name FROM users WHERE verification_token = $1",
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.redirect(`${frontendUrl}?verified=false&error=invalid_token`);
    }

    const userId = userResult.rows[0].id;

    // Update user: mark verified and remove token
    await pool.query(
      "UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1",
      [userId]
    );

    console.log(`User ID ${userId} has successfully verified their email.`);
    
    // Redirect user to frontend with success query parameter
    res.redirect(`${frontendUrl}?verified=true`);
  } catch (error) {
    next(error);
  }
});

// ── 3. LOGIN ENDPOINT ──
router.post(
  "/login",
  authLimiter,
  [
    body("email").trim().notEmpty().withMessage("Email is required.").isEmail().withMessage("Must be a valid email."),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const userResult = await pool.query(
        "SELECT id, name, email, password_hash, is_verified, login_attempts, lock_until FROM users WHERE email = $1",
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const user = userResult.rows[0];

      // Check account lockout
      if (user.lock_until && new Date(user.lock_until) > new Date()) {
        const timeRemaining = Math.ceil((new Date(user.lock_until) - new Date()) / 1000 / 60);
        return res.status(403).json({
          error: `This account is locked due to multiple failed login attempts. Please try again in ${timeRemaining} minute(s).`,
        });
      }

      // Check if user registered via Google only (no password_hash)
      if (!user.password_hash) {
        return res.status(400).json({
          error: "This account was created using Google Sign-in. Please log in using Google.",
        });
      }

      // Verify Password
      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        // Increment login attempts
        const attempts = user.login_attempts + 1;
        let lockUntil = null;
        let message = `Invalid email or password. Attempt ${attempts} of 5.`;

        if (attempts >= 5) {
          lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lockout
          message = "Account locked due to 5 failed login attempts. Please try again in 15 minutes.";
        }

        await pool.query(
          "UPDATE users SET login_attempts = $1, lock_until = $2 WHERE id = $3",
          [attempts, lockUntil, user.id]
        );

        return res.status(401).json({ error: message });
      }

      // Check if email is verified
      if (!user.is_verified) {
        return res.status(403).json({
          error: "Your email address has not been verified. Please check your inbox for the verification link.",
        });
      }

      // Success: Reset lockout data
      await pool.query(
        "UPDATE users SET login_attempts = 0, lock_until = NULL WHERE id = $1",
        [user.id]
      );

      // Sign JWT and set cookie
      const token = signToken(user.id);
      setAuthCookie(res, token);

      res.status(200).json({
        message: "Logged in successfully.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── 4. GOOGLE OAUTH LOGIN ENDPOINT ──
router.post(
  "/google-login",
  authLimiter,
  [body("idToken").notEmpty().withMessage("Google ID Token is required.")],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { idToken } = req.body;

      let ticket;
      try {
        ticket = await googleClient.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
      } catch (err) {
        console.error("Google token verification failed:", err);
        return res.status(400).json({ error: "Invalid Google ID Token." });
      }

      const payload = ticket.getPayload();
      const { sub: googleId, email, name, email_verified } = payload;

      if (!email_verified) {
        return res.status(403).json({ error: "Google account email is not verified." });
      }

      // Find user by Google ID or by Email
      let userResult = await pool.query(
        "SELECT id, name, email, google_id FROM users WHERE google_id = $1 OR email = $2",
        [googleId, email]
      );

      let user;

      if (userResult.rows.length > 0) {
        user = userResult.rows[0];

        // Link Google ID if registered via manual email before
        if (!user.google_id) {
          await pool.query(
            "UPDATE users SET google_id = $1, is_verified = TRUE WHERE id = $2",
            [googleId, user.id]
          );
        }
      } else {
        // Create user since they do not exist
        const result = await pool.query(
          `INSERT INTO users (name, email, is_verified, google_id) 
           VALUES ($1, $2, TRUE, $3) RETURNING id, name, email`,
          [name, email, googleId]
        );
        user = result.rows[0];
      }

      // Reset lockout just in case
      await pool.query(
        "UPDATE users SET login_attempts = 0, lock_until = NULL WHERE id = $1",
        [user.id]
      );

      // Sign JWT and set cookie
      const token = signToken(user.id);
      setAuthCookie(res, token);

      res.status(200).json({
        message: "Logged in via Google successfully.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── 5. LOGOUT ENDPOINT ──
router.post("/logout", (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });
  res.status(200).json({ message: "Logged out successfully." });
});

// ── 6. GET CURRENT SESSION USER (ME) ──
router.get("/me", requireAuth, (req, res) => {
  res.status(200).json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    },
  });
});

module.exports = router;
