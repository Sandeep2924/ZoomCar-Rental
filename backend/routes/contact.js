const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { pool } = require("../config/db");
const { submissionLimiter } = require("../middleware/rateLimit");

// ── SUBMIT CONTACT MESSAGE ENDPOINT ──
router.post(
  "/",
  submissionLimiter,
  [
    body("name").trim().notEmpty().withMessage("Full name is required.").escape(),
    body("email").trim().isEmail().withMessage("Valid email is required.").normalizeEmail(),
    body("message").trim().notEmpty().withMessage("Message content is required.").escape(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, message } = req.body;

      // Insert message securely into PostgreSQL using parameterized query
      await pool.query(
        "INSERT INTO messages (name, email, message) VALUES ($1, $2, $3)",
        [name, email, message]
      );

      console.log(`New contact message received from: ${email}`);

      res.status(201).json({
        message: "Your message has been sent successfully. We will get back to you shortly!",
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
