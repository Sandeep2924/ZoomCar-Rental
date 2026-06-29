const { pool } = require("./config/db");

const clearBookings = async () => {
  try {
    console.log("Connecting to PostgreSQL to clear previous orders...");
    await pool.query("DROP TABLE IF EXISTS bookings CASCADE;");
    console.log("Successfully cleared all previous orders and dropped the bookings table schema.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to clear bookings table:", error);
    process.exit(1);
  }
};

clearBookings();
