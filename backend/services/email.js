/**
 * Email Service — ZoomCarz
 * Uses Resend HTTP API (port 443) instead of SMTP.
 * Bypasses Render's outbound SMTP firewall.
 *
 * Setup:
 * 1. Sign up free at https://resend.com
 * 2. Add your custom domain to Domains tab and verify the DNS records (SPF/DKIM)
 * 3. Go to API Keys → Create API Key
 * 4. Add to Render environment variables:
 *      RESEND_API_KEY   = your-resend-key
 *      EMAIL_FROM       = Your Name <noreply@yourverifieddomain.com>
 *      BACKEND_URL      = https://your-backend.onrender.com
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

// ── Resolve backend base URL (for verification links) ────────────
// Priority: BACKEND_URL env var → RENDER_EXTERNAL_URL (auto-set by Render) → localhost fallback
const getBackendUrl = () =>
  process.env.BACKEND_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  `http://localhost:${process.env.PORT || 5000}`;

// Sender address — MUST be from your verified domain on Resend (e.g. "noreply@yourdomain.com")
// Defaults to Resend's testing address if not provided.
const FROM_ADDRESS = process.env.EMAIL_FROM || "ZoomCarz <onboarding@resend.dev>";

// ─────────────────────────────────────────────────────────────────
// 1. SEND VERIFICATION EMAIL
// ─────────────────────────────────────────────────────────────────
const sendVerificationEmail = async (email, name, token) => {
  const backendBase = getBackendUrl();
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
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:auto;padding:0;background:#f4f4f4;">
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#ff4d30,#ff6b4a);padding:35px 30px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;color:#fff;font-size:28px;letter-spacing:-0.5px;">🚗 ZoomCarz</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Your trusted car rental partner</p>
          </div>

          <!-- Body -->
          <div style="background:#fff;padding:35px 30px;border-radius:0 0 12px 12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
            <h2 style="color:#1a1a2e;margin:0 0 12px;font-size:22px;">Welcome aboard, ${name}! 🎉</h2>
            <p style="color:#555;line-height:1.7;margin:0 0 20px;">
              Thank you for creating your ZoomCarz account. One quick step — please verify your email address so we can activate your account and get you behind the wheel!
            </p>

            <!-- CTA Button -->
            <div style="text-align:center;margin:30px 0;">
              <a href="${verifyUrl}"
                 style="display:inline-block;background:linear-gradient(135deg,#ff4d30,#ff6b4a);
                        color:#fff;padding:15px 38px;border-radius:8px;font-size:16px;
                        font-weight:700;text-decoration:none;letter-spacing:0.3px;
                        box-shadow:0 6px 20px rgba(255,77,48,0.4);">
                ✅ Verify My Email Address
              </a>
            </div>

            <!-- Fallback link -->
            <div style="background:#f9f9f9;border-radius:8px;padding:14px 16px;margin:20px 0;">
              <p style="margin:0 0 6px;font-size:12px;color:#888;">Button not working? Copy and paste this link into your browser:</p>
              <p style="margin:0;font-size:12px;color:#ff4d30;word-break:break-all;">${verifyUrl}</p>
            </div>

            <!-- Features teaser -->
            <div style="display:flex;gap:12px;margin:24px 0;flex-wrap:wrap;">
              <div style="flex:1;min-width:140px;background:#fff5f3;border-radius:8px;padding:14px;text-align:center;">
                <div style="font-size:22px;">🚗</div>
                <div style="font-size:12px;color:#555;margin-top:6px;font-weight:600;">6 Premium Cars</div>
              </div>
              <div style="flex:1;min-width:140px;background:#f0f8ff;border-radius:8px;padding:14px;text-align:center;">
                <div style="font-size:22px;">📍</div>
                <div style="font-size:12px;color:#555;margin-top:6px;font-weight:600;">7 Cities Across India</div>
              </div>
              <div style="flex:1;min-width:140px;background:#f0fff4;border-radius:8px;padding:14px;text-align:center;">
                <div style="font-size:22px;">⚡</div>
                <div style="font-size:12px;color:#555;margin-top:6px;font-weight:600;">Instant Booking</div>
              </div>
            </div>

            <p style="font-size:12px;color:#aaa;text-align:center;margin:20px 0 0;padding-top:16px;border-top:1px solid #f0f0f0;">
              This link expires in 24 hours. If you didn't create a ZoomCarz account, you can safely ignore this email.
            </p>
          </div>
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
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:auto;background:#f4f4f4;">
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#ff4d30,#ff6b4a);padding:35px 30px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;color:#fff;font-size:28px;">🚗 ZoomCarz</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Your trusted car rental partner</p>
          </div>

          <!-- Body -->
          <div style="background:#fff;padding:35px 30px;border-radius:0 0 12px 12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
            <!-- Status badge -->
            <div style="text-align:center;margin-bottom:24px;">
              <span style="display:inline-block;background:#d1fae5;color:#065f46;padding:8px 22px;border-radius:50px;font-size:14px;font-weight:700;">
                ✅ Reservation Confirmed
              </span>
            </div>

            <h2 style="color:#1a1a2e;margin:0 0 8px;font-size:20px;">Hi ${name}, you're all set! 🎉</h2>
            <p style="color:#555;line-height:1.7;margin:0 0 24px;">
              Your ZoomCarz reservation has been confirmed. Here's your complete trip summary:
            </p>

            <!-- Booking card -->
            <div style="background:linear-gradient(135deg,#fff5f3,#fff8f6);border:1px solid #fdddd8;border-radius:10px;padding:20px;margin-bottom:20px;">
              <h3 style="margin:0 0 16px;color:#ff4d30;font-size:15px;display:flex;align-items:center;gap:6px;">
                📋 Trip Details
              </h3>
              <table style="width:100%;border-collapse:collapse;font-size:14px;color:#444;">
                <tr style="border-bottom:1px solid #fdddd8;">
                  <td style="padding:10px 0;font-weight:700;width:42%;color:#1a1a2e;">Reservation ID</td>
                  <td style="padding:10px 0;"><strong style="color:#ff4d30;">#${booking.id}</strong></td>
                </tr>
                <tr style="border-bottom:1px solid #fdddd8;">
                  <td style="padding:10px 0;font-weight:700;color:#1a1a2e;">Vehicle</td>
                  <td style="padding:10px 0;">${booking.carType}</td>
                </tr>
                <tr style="border-bottom:1px solid #fdddd8;">
                  <td style="padding:10px 0;font-weight:700;color:#1a1a2e;">Pick-Up Location</td>
                  <td style="padding:10px 0;">📍 ${booking.pickupLocation}</td>
                </tr>
                <tr style="border-bottom:1px solid #fdddd8;">
                  <td style="padding:10px 0;font-weight:700;color:#1a1a2e;">Drop-Off Location</td>
                  <td style="padding:10px 0;">📍 ${booking.dropoffLocation}</td>
                </tr>
                <tr style="border-bottom:1px solid #fdddd8;">
                  <td style="padding:10px 0;font-weight:700;color:#1a1a2e;">Pick-Up Date</td>
                  <td style="padding:10px 0;">📅 ${booking.pickupDate} at ${booking.pickupTime}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;font-weight:700;color:#1a1a2e;">Drop-Off Date</td>
                  <td style="padding:10px 0;">📅 ${booking.dropoffDate} at ${booking.dropoffTime}</td>
                </tr>
              </table>
            </div>

            <!-- Support -->
            <div style="background:#f8f8f8;border-radius:8px;padding:14px 16px;font-size:13px;color:#555;">
              Need help? Contact us at <strong>+91 98765 43210</strong> or <strong>hello@zoomcarz.in</strong>
            </div>

            <p style="text-align:center;color:#4caf50;font-weight:700;font-size:15px;margin:24px 0 8px;">
              🌟 Have a safe and wonderful trip!
            </p>
            <p style="text-align:center;color:#aaa;font-size:12px;margin:0;">The ZoomCarz Team</p>
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
// 3. BOOKING CANCELLATION EMAIL
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
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:auto;background:#f4f4f4;">
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:35px 30px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;color:#fff;font-size:28px;">🚗 ZoomCarz</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Your trusted car rental partner</p>
          </div>

          <!-- Body -->
          <div style="background:#fff;padding:35px 30px;border-radius:0 0 12px 12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
            <!-- Status badge -->
            <div style="text-align:center;margin-bottom:24px;">
              <span style="display:inline-block;background:#fee2e2;color:#991b1b;padding:8px 22px;border-radius:50px;font-size:14px;font-weight:700;">
                ❌ Reservation Cancelled
              </span>
            </div>

            <h2 style="color:#1a1a2e;margin:0 0 8px;font-size:20px;">Hi ${name},</h2>
            <p style="color:#555;line-height:1.7;margin:0 0 24px;">
              We're confirming that your reservation <strong>#${booking.id}</strong> has been successfully cancelled as requested.
            </p>

            <!-- Cancelled booking card -->
            <div style="background:#fff5f5;border:1px solid #fecaca;border-radius:10px;padding:20px;margin-bottom:20px;">
              <h3 style="margin:0 0 16px;color:#ef4444;font-size:15px;">📋 Cancelled Booking Details</h3>
              <table style="width:100%;border-collapse:collapse;font-size:14px;color:#444;">
                <tr style="border-bottom:1px solid #fecaca;">
                  <td style="padding:10px 0;font-weight:700;width:42%;color:#1a1a2e;">Reservation ID</td>
                  <td style="padding:10px 0;"><strong>#${booking.id}</strong></td>
                </tr>
                <tr style="border-bottom:1px solid #fecaca;">
                  <td style="padding:10px 0;font-weight:700;color:#1a1a2e;">Vehicle</td>
                  <td style="padding:10px 0;">${booking.car_type || booking.carType}</td>
                </tr>
                <tr style="border-bottom:1px solid #fecaca;">
                  <td style="padding:10px 0;font-weight:700;color:#1a1a2e;">Pick-Up</td>
                  <td style="padding:10px 0;">📍 ${booking.pickup_location || booking.pickupLocation}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;font-weight:700;color:#1a1a2e;">Travel Dates</td>
                  <td style="padding:10px 0;">📅 ${booking.pickup_date || booking.pickupDate} → ${booking.dropoff_date || booking.dropoffDate}</td>
                </tr>
              </table>
            </div>

            <!-- Alert -->
            <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;font-size:13px;color:#92400e;margin-bottom:20px;">
              ⚠️ Did not request this cancellation? Contact us immediately at <strong>+91 98765 43210</strong> or <strong>hello@zoomcarz.in</strong>
            </div>

            <p style="text-align:center;color:#aaa;font-size:12px;margin:20px 0 0;">
              Thank you for considering ZoomCarz.<br/><strong>The ZoomCarz Team</strong>
          </p>
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
