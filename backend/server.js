const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { initializeDatabase } = require("./config/db");
const errorHandler = require("./middleware/error");
const { apiLimiter } = require("./middleware/rateLimit");

// Import Routes
const authRoutes = require("./routes/auth");
const bookingRoutes = require("./routes/bookings");
const contactRoutes = require("./routes/contact");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database connection and table schemas
initializeDatabase()
  .then(() => {
    // ── Middleware Configurations ──
    
    // 1. Helmet for secure HTTP headers
    app.use(helmet());

    const allowedOrigins = [
      process.env.FRONTEND_URL,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://zoom-car-rental-tau.vercel.app"
    ].filter(Boolean).map(url => url.replace(/\/$/, ""));
    app.use(
      cors({
        origin: (origin, callback) => {
          // Allow requests with no origin (like mobile apps or curl/Postman)
          if (!origin) return callback(null, true);
          const normalizedOrigin = origin.replace(/\/$/, "");
          if (allowedOrigins.indexOf(normalizedOrigin) === -1) {
            const msg = `The CORS policy for this site does not allow access from origin: ${origin}`;
            return callback(new Error(msg), false);
          }
          return callback(null, true);
        },
        credentials: true,
      })
    );

    // 3. Body parsers
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // 4. Cookie Parser
    app.use(cookieParser());

    // 5. Apply general API Rate Limiter
    app.use("/api", apiLimiter);

    // ── Routes Registration ──
    app.use("/api/auth", authRoutes);
    app.use("/api/bookings", bookingRoutes);
    app.use("/api/contact", contactRoutes);

    // Health check endpoint
    app.get("/health", (req, res) => {
      res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
    });

    // ── Global Error Handling Middleware ──
    app.use(errorHandler);

    // Start listening
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`🚀 Secure backend server is running on port ${PORT}`);
      console.log(`🔧 Node Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 Allowed Frontend Origin: ${allowedOrigins.join(", ")}`);
      console.log(`=================================================`);
    });
  })
  .catch((err) => {
    console.error("FATAL ERROR: Server failed to start due to database connection error:", err);
    process.exit(1);
  });
