require("dotenv").config();

const errorHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  
  // Log full error details securely on the server
  console.error(`[${timestamp}] ERROR: ${err.message}`);
  console.error(err.stack);

  const isDevelopment = process.env.NODE_ENV === "development";

  // Enforce consistent error responses
  const statusCode = err.statusCode || 500;
  const clientMessage = statusCode === 500 
    ? "An internal server error occurred. Our team has been notified."
    : err.message;

  res.status(statusCode).json({
    error: clientMessage,
    ...(isDevelopment && { stack: err.stack, details: err }),
  });
};

module.exports = errorHandler;
