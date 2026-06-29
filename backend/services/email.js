/**
 * Email Service — ZoomCarz
 * Uses Brevo (Sendinblue) HTTP API over HTTPS (port 443).
 * No domain verification needed — just verify a sender email address.
 * Free tier: 300 emails/day, 9,000/month.
 *
 * Setup:
 * 1. Sign up free at https://brevo.com
 * 2. Go to Settings → Senders & IP → Senders → Add a sender (your Gmail)
 *    Brevo will send a verification link to that Gmail → click it
 * 3. Go to Settings → SMTP & API → API Keys → Create API Key → Copy it
 * 4. Add to Render environment variables:
 *      BREVO_API_KEY   = your-api-key-here
 *      BREVO_SENDER    = Your Name <yourgmail@gmail.com>
 *      BACKEND_URL     = https://your-render-service.onrender.com
 */

require("dotenv").config();

// ── Resolve backend base URL (for verification links) ────────────
// Priority: BACKEND_URL env var → RENDER_EXTERNAL_URL (auto-set by Render) → localhost fallback
const getBackendUrl = () =>
  process.env.BACKEND_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  `http://localhost:${process.env.PORT || 5000}`;

// ── Parse "Name <email>" sender string ───────────────────────────
const parseSender = () => {
  const raw = process.env.BREVO_SENDER || "";
  const match = raw.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  if (raw.includes("@")) return { name: "ZoomCarz", email: raw.trim() };
  return { name: "ZoomCarz", email: "noreply@zoomcarz.in" };
};

// ── Core send helper ──────────────────────────────────────────────
const sendEmail = async ({ to, toName, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn(
      "[MAIL SERVICE] BREVO_API_KEY not set — skipping email send.\n" +
      "[MAIL SERVICE] Sign up at https://brevo.com and add BREVO_API_KEY to your Render environment."
    );
    return;
  }

  const sender = parseSender();

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender,
        to: [{ email: to, name: toName || to }],
        subject,
        htmlContent: html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[MAIL SERVICE] Brevo API error:", data);
    } else {
      console.log(`[MAIL SERVICE] Email sent via Brevo to ${to}. Message ID: ${data.messageId}`);
    }
  } catch (err) {
    console.error("[MAIL SERVICE] Network error calling Brevo API:", err.message);
  }
};

// ─────────────────────────────────────────────────────────────────
// 1. VERIFICATION EMAIL
// ─────────────────────────────────────────────────────────────────
const sendVerificationEmail = async (email, name, token) => {
  const backendBase = getBackendUrl();
  const verifyUrl = `${backendBase}/api/auth/verify-email?token=${token}`;

  // Always log URL for manual fallback
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🔑 [EMAIL VERIFICATION URL] for ${email}:`);
  console.log(`${verifyUrl}`);
  console.log(`${"=".repeat(50)}\n`);

  console.log(`[MAIL SERVICE] sendVerificationEmail invoked for: ${email}`);

  await sendEmail({
    to: email,
    toName: name,
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
};

// ─────────────────────────────────────────────────────────────────
// 2. BOOKING CONFIRMATION EMAIL
// ─────────────────────────────────────────────────────────────────
const sendBookingConfirmationEmail = async (email, name, booking) => {
  console.log(`[MAIL SERVICE] sendBookingConfirmationEmail invoked for: ${email}`);

  await sendEmail({
    to: email,
    toName: name,
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
};

// ─────────────────────────────────────────────────────────────────
// 3. BOOKING CANCELLATION EMAIL
// ─────────────────────────────────────────────────────────────────
const sendBookingCancellationEmail = async (email, name, booking) => {
  console.log(`[MAIL SERVICE] sendBookingCancellationEmail invoked for: ${email}`);

  await sendEmail({
    to: email,
    toName: name,
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
};

module.exports = {
  sendVerificationEmail,
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
};
