const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
require("dotenv").config();

const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: "Access denied. No session token provided." });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists in database
    const userResult = await pool.query(
      "SELECT id, name, email, is_verified FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      res.clearCookie("token");
      return res.status(401).json({ error: "User session not found." });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    
    if (error.name === "TokenExpiredError") {
      res.clearCookie("token");
      return res.status(401).json({ error: "Session expired. Please sign in again." });
    }
    
    res.clearCookie("token");
    return res.status(401).json({ error: "Invalid session. Please sign in again." });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userResult = await pool.query(
      "SELECT id, name, email, is_verified FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (userResult.rows.length > 0) {
      req.user = userResult.rows[0];
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    // If token is invalid or expired, we treat them as a guest rather than crashing
    req.user = null;
    next();
  }
};

module.exports = {
  requireAuth,
  optionalAuth,
};
