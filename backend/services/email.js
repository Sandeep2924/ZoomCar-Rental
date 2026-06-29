const nodemailer = require("nodemailer");
require("dotenv").config();

let transporterInstance = null;

const getTransporter = () => {
  if (transporterInstance) return transporterInstance;

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (emailUser && emailPass) {
    console.log(`Configuring secure Gmail transporter for: ${emailUser}`);
    transporterInstance = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // TLS upgrades to secure via STARTTLS
      auth: {
        user: emailUser,
        pass: emailPass, // Google App Password (16 characters, no spaces)
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 15000, // 15 seconds
      greetingTimeout: 15000,
      socketTimeout: 15000
    });
  } else {
    console.warn("Gmail SMTP credentials not configured in .env. Emails will only be logged to the console.");
    transporterInstance = null;
  }

  return transporterInstance;
};

const sendVerificationEmail = async (email, name, token) => {
  const backendPort = process.env.PORT || 5000;
  const verifyUrl = `http://localhost:${backendPort}/api/auth/verify-email?token=${token}`;

  // Print verification link in console for local testing
  console.log(`\n==================================================`);
  console.log(`🔑 [DEVELOPMENT ONLY] Email Verification URL for ${email}:`);
  console.log(`${verifyUrl}`);
  console.log(`==================================================\n`);

  console.log(`[MAIL SERVICE] sendVerificationEmail invoked for recipient: ${email}`);
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[MAIL SERVICE] Gmail SMTP transporter is not configured.");
    return;
  }

  const mailOptions = {
    from: `"ZoomCarz Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your email address - ZoomCarz",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #fcfcfc;">
        <h2 style="color: #ff4d30; text-align: center;">Welcome to ZoomCarz!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for creating an account with ZoomCarz. To ensure your account is fully secure, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #ff4d30; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px; font-size: 16px;">Verify Email Address</a>
        </div>
        <p style="font-size: 13px; color: #666;">Or copy and paste this URL into your browser:</p>
        <p style="font-size: 13px; color: #ff4d30; word-break: break-all;">${verifyUrl}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">If you did not request this email, please ignore it.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent successfully via Gmail to: ${email}`);
  } catch (error) {
    console.error("[MAIL SERVICE] Error sending verification email via Gmail SMTP:", error);
  }
};

const sendBookingConfirmationEmail = async (email, name, booking) => {
  console.log(`[MAIL SERVICE] sendBookingConfirmationEmail invoked for recipient: ${email}`);
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[MAIL SERVICE] Gmail SMTP transporter is not configured.");
    return;
  }

  const mailOptions = {
    from: `"ZoomCarz Bookings" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Booking Confirmed! - ZoomCarz (Reservation #${booking.id})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #fcfcfc;">
        <h2 style="color: #4caf50; text-align: center;">Booking Confirmed!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for choosing ZoomCarz. Your reservation has been successfully processed and confirmed. Here is your trip summary:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #ff4d30;">
          <h4 style="margin-top: 0; color: #ff4d30;">Trip Summary</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; width: 40%;">Reservation ID:</td>
              <td style="padding: 6px 0;">#${booking.id}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Car Selected:</td>
              <td style="padding: 6px 0;">${booking.carType}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Pick-Up Location:</td>
              <td style="padding: 6px 0;">${booking.pickupLocation}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Drop-Off Location:</td>
              <td style="padding: 6px 0;">${booking.dropoffLocation}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Pick-Up Date & Time:</td>
              <td style="padding: 6px 0;">${booking.pickupDate} at ${booking.pickupTime}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Drop-Off Date & Time:</td>
              <td style="padding: 6px 0;">${booking.dropoffDate} at ${booking.dropoffTime}</td>
            </tr>
          </table>
        </div>
        
        <p>Your vehicle will be ready at our pick-up location. If you need any assistance, feel free to call support at +91 98765 43210 or email us at hello@zoomcarz.in.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">Have a safe and wonderful trip!<br/><strong>The ZoomCarz Team</strong></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Booking confirmation email sent successfully via Gmail to: ${email}`);
  } catch (error) {
    console.error("[MAIL SERVICE] Error sending booking confirmation email via Gmail SMTP:", error);
  }
};

const sendBookingCancellationEmail = async (email, name, booking) => {
  console.log(`[MAIL SERVICE] sendBookingCancellationEmail invoked for recipient: ${email}`);
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[MAIL SERVICE] Gmail SMTP transporter is not configured.");
    return;
  }

  const mailOptions = {
    from: `"ZoomCarz Bookings" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Reservation Cancelled - ZoomCarz (Reservation #${booking.id})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #fcfcfc;">
        <h2 style="color: #ef4444; text-align: center;">Reservation Cancelled</h2>
        <p>Hi ${name},</p>
        <p>We are writing to confirm that your reservation <strong>#${booking.id}</strong> has been successfully cancelled as per your request.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #ef4444;">
          <h4 style="margin-top: 0; color: #ef4444;">Cancelled Details</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; width: 40%;">Reservation ID:</td>
              <td style="padding: 6px 0;">#${booking.id}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Car Type:</td>
              <td style="padding: 6px 0;">${booking.car_type || booking.carType}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Pick-Up Location:</td>
              <td style="padding: 6px 0;">${booking.pickup_location || booking.pickupLocation}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Date & Time:</td>
              <td style="padding: 6px 0;">${booking.pickup_date || booking.pickupDate} to ${booking.dropoff_date || booking.dropoffDate}</td>
            </tr>
          </table>
        </div>
        
        <p>If you did not request this cancellation, please contact our helpdesk immediately at support@zoomcarz.in or call +91 98765 43210.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">Thank you for considering ZoomCarz.<br/><strong>The ZoomCarz Team</strong></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Cancellation confirmation email sent successfully via Gmail to: ${email}`);
  } catch (error) {
    console.error("[MAIL SERVICE] Error sending cancellation email via Gmail SMTP:", error);
  }
};

module.exports = {
  sendVerificationEmail,
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
};
