/**
 * Email Service — ZoomCarz
 * Uses Resend HTTP API (port 443) instead of Nodemailer SMTP.
 * Render blocks outbound TCP on SMTP ports (25/465/587) from Gmail servers.
 * Resend communicates over HTTPS, which is never blocked.
 *
 * Setup:
 * 1. Sign up free at https://resend.com
 * 2. Go to API Keys → Create API Key
 * 3. Add RESEND_API_KEY to Render environment variables
 * 4. (Optional) Verify your domain at resend.com for a custom sender address
 */

const { Resend } = require("resend");
require("dotenv").config();

// Lazy-initialize Resend client only when API key is present
let resendClient = null;

const getResendClient = () => {
  if (resendClient) return resendClient;

  if (process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
    console.log("[MAIL SERVICE] Resend email client initialized.");
  } else {
    console.warn(
      "[MAIL SERVICE] RESEND_API_KEY not set. Emails will only be logged to the console.\n" +
      "[MAIL SERVICE] Sign up at https://resend.com and add RESEND_API_KEY to your environment variables."
    );
  }

  return resendClient;
};

// Sender address — change to your verified domain after setting up Resend
// e.g. "ZoomCarz <noreply@yourdomain.com>"
const FROM_ADDRESS = process.env.EMAIL_FROM || "ZoomCarz <onboarding@resend.dev>";

// ─────────────────────────────────────────────────────────────────
// 1. SEND VERIFICATION EMAIL
// ─────────────────────────────────────────────────────────────────
const sendVerificationEmail = async (email, name, token) => {
  const backendBase = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
  const verifyUrl = `${backendBase}/api/auth/verify-email?token=${token}`;

  // Always log the verification URL for manual testing fallback
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🔑 [EMAIL VERIFICATION URL] for ${email}:`);
  console.log(`${verifyUrl}`);
  console.log(`${"=".repeat(50)}\n`);

  console.log(`[MAIL SERVICE] sendVerificationEmail invoked for: ${email}`);

  const client = getResendClient();
  if (!client) {
    console.warn("[MAIL SERVICE] Skipping email send — no RESEND_API_KEY configured.");
    return;
  }

  try {
    const { data, error } = await client.emails.send({
      from: FROM_ADDRESS,
      to: [email],
      subject: "Verify your email address — ZoomCarz",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #eee; border-radius: 12px; background-color: #fcfcfc;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #ff4d30; margin: 0; font-size: 28px;">ZoomCarz</h1>
            <p style="color: #888; font-size: 13px; margin-top: 5px;">Your trusted car rental partner</p>
          </div>
          <h2 style="color: #1a1a2e; text-align: center; font-size: 22px;">Welcome aboard, ${name}! 🎉</h2>
          <p style="color: #555; line-height: 1.7;">Thank you for creating an account with ZoomCarz. To activate your account and start booking your dream rides, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 35px 0;">
            <a href="${verifyUrl}" style="background: linear-gradient(135deg, #ff4d30, #ff6347); color: white; padding: 14px 32px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(255, 77, 48, 0.35);">
              ✅ Verify Email Address
            </a>
          </div>
          <p style="font-size: 13px; color: #888; text-align: center;">Button not working? Copy and paste this URL into your browser:</p>
          <p style="font-size: 13px; color: #ff4d30; word-break: break-all; text-align: center; background: #fff5f3; padding: 10px; border-radius: 6px;">${verifyUrl}</p>
          <p style="font-size: 12px; color: #bbb; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            This link expires in 24 hours. If you didn't create a ZoomCarz account, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("[MAIL SERVICE] Resend API error (verification email):", error);
    } else {
      console.log(`[MAIL SERVICE] Verification email sent successfully via Resend. ID: ${data?.id}`);
    }
  } catch (err) {
    console.error("[MAIL SERVICE] Unexpected error sending verification email:", err);
  }
};

// ─────────────────────────────────────────────────────────────────
// 2. SEND BOOKING CONFIRMATION EMAIL
// ─────────────────────────────────────────────────────────────────
const sendBookingConfirmationEmail = async (email, name, booking) => {
  console.log(`[MAIL SERVICE] sendBookingConfirmationEmail invoked for: ${email}`);

  const client = getResendClient();
  if (!client) {
    console.warn("[MAIL SERVICE] Skipping email send — no RESEND_API_KEY configured.");
    return;
  }

  try {
    const { data, error } = await client.emails.send({
      from: FROM_ADDRESS,
      to: [email],
      subject: `Booking Confirmed! — ZoomCarz Reservation #${booking.id}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #eee; border-radius: 12px; background-color: #fcfcfc;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #ff4d30; margin: 0; font-size: 28px;">ZoomCarz</h1>
            <p style="color: #888; font-size: 13px; margin-top: 5px;">Your trusted car rental partner</p>
          </div>
          <div style="text-align: center; background: linear-gradient(135deg, #4caf50, #2e7d32); padding: 20px; border-radius: 10px; margin-bottom: 25px;">
            <h2 style="color: white; margin: 0; font-size: 24px;">🚗 Booking Confirmed!</h2>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 14px;">Your reservation has been successfully processed.</p>
          </div>
          <p style="color: #555; line-height: 1.7;">Hi <strong>${name}</strong>, thank you for choosing ZoomCarz! Here's your trip summary:</p>
          <div style="background: #fff5f3; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff4d30;">
            <h4 style="margin-top: 0; color: #ff4d30; font-size: 16px;">📋 Trip Details</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #444;">
              <tr><td style="padding: 8px 0; font-weight: 600; width: 45%;">Reservation ID:</td><td style="padding: 8px 0;"><strong>#${booking.id}</strong></td></tr>
              <tr><td style="padding: 8px 0; font-weight: 600;">Vehicle:</td><td style="padding: 8px 0;">${booking.carType}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: 600;">Pick-Up Location:</td><td style="padding: 8px 0;">${booking.pickupLocation}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: 600;">Drop-Off Location:</td><td style="padding: 8px 0;">${booking.dropoffLocation}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: 600;">Pick-Up:</td><td style="padding: 8px 0;">${booking.pickupDate} at ${booking.pickupTime}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: 600;">Drop-Off:</td><td style="padding: 8px 0;">${booking.dropoffDate} at ${booking.dropoffTime}</td></tr>
            </table>
          </div>
          <p style="color: #555; line-height: 1.7; font-size: 14px;">Your vehicle will be ready at the pick-up location. Need assistance? Call us at <strong>+91 98765 43210</strong> or email <strong>hello@zoomcarz.in</strong>.</p>
          <div style="text-align: center; margin-top: 25px; padding: 15px; background: #f0f8f0; border-radius: 8px;">
            <p style="margin: 0; color: #4caf50; font-weight: bold; font-size: 15px;">🌟 Have a safe and wonderful trip!</p>
            <p style="margin: 5px 0 0 0; color: #888; font-size: 12px;">The ZoomCarz Team</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("[MAIL SERVICE] Resend API error (booking confirmation):", error);
    } else {
      console.log(`[MAIL SERVICE] Booking confirmation email sent via Resend. ID: ${data?.id}`);
    }
  } catch (err) {
    console.error("[MAIL SERVICE] Unexpected error sending booking confirmation email:", err);
  }
};

// ─────────────────────────────────────────────────────────────────
// 3. SEND BOOKING CANCELLATION EMAIL
// ─────────────────────────────────────────────────────────────────
const sendBookingCancellationEmail = async (email, name, booking) => {
  console.log(`[MAIL SERVICE] sendBookingCancellationEmail invoked for: ${email}`);

  const client = getResendClient();
  if (!client) {
    console.warn("[MAIL SERVICE] Skipping email send — no RESEND_API_KEY configured.");
    return;
  }

  try {
    const { data, error } = await client.emails.send({
      from: FROM_ADDRESS,
      to: [email],
      subject: `Reservation Cancelled — ZoomCarz #${booking.id}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #eee; border-radius: 12px; background-color: #fcfcfc;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #ff4d30; margin: 0; font-size: 28px;">ZoomCarz</h1>
            <p style="color: #888; font-size: 13px; margin-top: 5px;">Your trusted car rental partner</p>
          </div>
          <div style="text-align: center; background: linear-gradient(135deg, #ef4444, #dc2626); padding: 20px; border-radius: 10px; margin-bottom: 25px;">
            <h2 style="color: white; margin: 0; font-size: 24px;">❌ Reservation Cancelled</h2>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 14px;">Your cancellation request has been processed.</p>
          </div>
          <p style="color: #555; line-height: 1.7;">Hi <strong>${name}</strong>, we're confirming the cancellation of your reservation <strong>#${booking.id}</strong>.</p>
          <div style="background: #fff5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <h4 style="margin-top: 0; color: #ef4444; font-size: 16px;">📋 Cancelled Booking Details</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #444;">
              <tr><td style="padding: 8px 0; font-weight: 600; width: 45%;">Reservation ID:</td><td style="padding: 8px 0;"><strong>#${booking.id}</strong></td></tr>
              <tr><td style="padding: 8px 0; font-weight: 600;">Vehicle:</td><td style="padding: 8px 0;">${booking.car_type || booking.carType}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: 600;">Pick-Up Location:</td><td style="padding: 8px 0;">${booking.pickup_location || booking.pickupLocation}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: 600;">Travel Dates:</td><td style="padding: 8px 0;">${booking.pickup_date || booking.pickupDate} → ${booking.dropoff_date || booking.dropoffDate}</td></tr>
            </table>
          </div>
          <p style="color: #555; font-size: 14px;">If you did not request this cancellation, please contact us immediately at <strong>+91 98765 43210</strong> or <strong>hello@zoomcarz.in</strong>.</p>
          <div style="text-align: center; margin-top: 25px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
            <p style="margin: 0; color: #888; font-size: 12px;">Thank you for considering ZoomCarz.<br/><strong>The ZoomCarz Team</strong></p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("[MAIL SERVICE] Resend API error (cancellation email):", error);
    } else {
      console.log(`[MAIL SERVICE] Cancellation email sent via Resend. ID: ${data?.id}`);
    }
  } catch (err) {
    console.error("[MAIL SERVICE] Unexpected error sending cancellation email:", err);
  }
};

module.exports = {
  sendVerificationEmail,
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
};
