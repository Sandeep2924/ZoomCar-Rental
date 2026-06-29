const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { pool } = require("../config/db");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { submissionLimiter } = require("../middleware/rateLimit");
const { sendBookingConfirmationEmail, sendBookingCancellationEmail } = require("../services/email");

// ── 1. SUBMIT BOOKING ENDPOINT ──
router.post(
  "/",
  submissionLimiter,
  optionalAuth,
  [
    body("carType").trim().notEmpty().withMessage("Car type is required."),
    body("pickupLocation").trim().notEmpty().withMessage("Pick-up location is required."),
    body("dropoffLocation").trim().notEmpty().withMessage("Drop-off location is required."),
    body("pickupDate").trim().notEmpty().withMessage("Pick-up date is required."),
    body("dropoffDate").trim().notEmpty().withMessage("Drop-off date is required."),
    body("pickupTime").trim().optional(),
    body("dropoffTime").trim().optional(),
    body("name").trim().notEmpty().withMessage("First name is required.").escape(),
    body("lastName").trim().notEmpty().withMessage("Last name is required.").escape(),
    body("phone").trim().isMobilePhone().withMessage("Valid phone number is required."),
    body("age").isInt({ min: 18, max: 120 }).withMessage("Driver must be 18 years or older."),
    body("email").trim().isEmail().withMessage("Valid email is required.").normalizeEmail(),
    body("address").trim().notEmpty().withMessage("Street address is required.").escape(),
    body("city").trim().notEmpty().withMessage("City is required.").escape(),
    body("zipcode").trim().isLength({ min: 6, max: 6 }).withMessage("PIN code must be exactly 6 digits.").isNumeric().withMessage("PIN code must be numeric."),
    body("newsletter").isBoolean().optional(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        carType,
        pickupLocation,
        dropoffLocation,
        pickupDate,
        dropoffDate,
        pickupTime = "10:00",
        dropoffTime = "10:00",
        name,
        lastName,
        phone,
        age,
        email,
        address,
        city,
        zipcode,
        newsletter = false,
      } = req.body;

      // Link to logged-in user if available
      const userId = req.user ? req.user.id : null;

      // Generate a unique random booking ID (ZC- followed by 6 random digits)
      const bookingId = `ZC-${Math.floor(100000 + Math.random() * 900000)}`;

      // Insert booking into database securely using parameterized query
      const insertQuery = `
        INSERT INTO bookings (
          id, user_id, car_type, pickup_location, dropoff_location, pickup_date, dropoff_date, 
          pickup_time, dropoff_time, name, last_name, phone, age, email, address, city, zipcode, newsletter
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING id;
      `;

      const result = await pool.query(insertQuery, [
        bookingId,
        userId,
        carType,
        pickupLocation,
        dropoffLocation,
        pickupDate,
        dropoffDate,
        pickupTime,
        dropoffTime,
        name,
        lastName,
        phone,
        parseInt(age),
        email,
        address,
        city,
        zipcode,
        newsletter,
      ]);

      console.log(`Booking ID ${result.rows[0].id} created successfully.`);

      // Send booking confirmation email
      try {
        await sendBookingConfirmationEmail(email, `${name} ${lastName}`, {
          id: result.rows[0].id,
          carType,
          pickupLocation,
          dropoffLocation,
          pickupDate,
          dropoffDate,
          pickupTime,
          dropoffTime
        });
      } catch (mailErr) {
        console.error("Failed to send booking confirmation email:", mailErr);
      }

      res.status(201).json({
        message: "Reservation confirmed successfully!",
        bookingId: result.rows[0].id,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ── 2. GET USER'S BOOKINGS HISTORY ENDPOINT ──
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const bookingsResult = await pool.query(
      "SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    res.status(200).json({
      bookings: bookingsResult.rows,
    });
  } catch (error) {
    next(error);
  }
});

// ── 3. CANCEL RESERVATION ENDPOINT ──
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    // Fetch booking details first to confirm ownership and extract details for email notice
    const bookingQuery = await pool.query(
      "SELECT * FROM bookings WHERE id = $1 AND user_id = $2",
      [bookingId, userId]
    );

    if (bookingQuery.rows.length === 0) {
      return res.status(404).json({ error: "Reservation not found or unauthorized to cancel." });
    }

    const bookingDetails = bookingQuery.rows[0];

    // Delete the booking from database
    await pool.query(
      "DELETE FROM bookings WHERE id = $1 AND user_id = $2",
      [bookingId, userId]
    );

    console.log(`Booking ID ${bookingId} cancelled and deleted successfully.`);

    // Send cancellation notice email
    try {
      await sendBookingCancellationEmail(bookingDetails.email, `${bookingDetails.name} ${bookingDetails.last_name}`, bookingDetails);
    } catch (mailErr) {
      console.error("Failed to send cancellation email:", mailErr);
    }

    res.status(200).json({
      message: "Reservation cancelled and refunded successfully!",
      bookingId,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
