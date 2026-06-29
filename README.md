# 🚗 ZoomCarz — Premium Car Rental Web Application

ZoomCarz is a premium, feature-rich, and highly secure web application designed to deliver a seamless car rental reservation experience. The application features a clean, accessible layout designed using a custom **Spruce Emerald & Mint Green** style system, dynamic vehicle filtering, side-by-side specs comparison, real-time trip cost estimations, self-service cancellations, and a secure authentication backend.

---

## ✨ Features & Capabilities

### 🎨 Premium Visual Theme
* **Accessibility Compliant (WCAG AA)**: Fully optimized color contrast ratios (exceeding 4.5:1 for body copy and 3:1 for UI elements) for maximum readability.
* **Deep Forest Accent Navbar**: A locked, dark-themed top navigation header provides high contrast and visual structure across all pages.
* **Spruce Green Design Tokens**: Clean, white body panels accented with vibrant mint greens and high-contrast orange CTA buttons.

### 📅 Real-Time Cost Estimator & Booking Widget
* **Live Price Preview**: Instant calculations of daily rates, duration (days), and estimated total cost display inside the home search widget as soon as dates are selected, before opening confirmation modals.
* **Smart Date Picker**: Auto-opens the calendar dropdown upon clicking labels.
* **Random Voucher Code Generator**: Generates unique confirmation codes (e.g., `ZC-849102`) for verified orders.

### 📊 Dealership Catalog & Spec Comparison (`/models`)
* **Dynamic Database Binding**: Automatically resolves vehicle listings from a single source of truth (`CarData.js`).
* **Category Filters**: Quick tab controls to sort vehicles by category (All, SUV, Sedan, Hatchback).
* **Side-by-Side Comparator**: Select any two vehicles to open a specs modal comparing price rates, door counts/seats, transmission types, fuel capacities, air conditioning, and manufacturing year side-by-side.

### 👤 Self-Service Booking Dashboard (`/profile`)
* **Reservations Category Tabs**: Sort bookings by All, Active (upcoming/current), and Past (completed) trips.
* **Interactive Cancellation Portal**: Active reservations feature a cancellation trigger. Clicking this opens a confirmation warning dialog explaining policies.
* **Secure API Deletion**: Deletes reservation records from the PostgreSQL database and dispatches a detailed cancellation notification email to the customer's address.

---

## 🛡️ Security Architecture

1. **Session Protection (JWT & Cookies)**: Server-signed JSON Web Tokens are stored inside `HttpOnly` and `SameSite=Lax` cookies, preventing Cross-Site Scripting (XSS) session hijacking.
2. **Brute Force Protection (Account Lockouts)**: Tracks failed login attempts. Automatically locks out credentials for **15 minutes** after **5 consecutive password failures** to prevent dictionary brute-force attacks.
3. **Email Verification**: Registrations are saved in a pending state until users verify their accounts via a secure verification token link emailed to their inbox.
4. **Strict Payload Validation**: All endpoints sanitize inputs using `express-validator` and escape HTML sequences to prevent Stored XSS injections.
5. **SQL Injection Defense**: Built-in shields block injections by executing parameterized PostgreSQL queries (e.g., `$1`, `$2`) throughout all route handlers.
6. **Secure Headers & CORS**: Integrated `helmet` security headers and restricted CORS policies to whitelist exclusively the frontend origin.

---

## 💻 Tech Stack

* **Frontend**: React JS, React Router DOM, FontAwesome Icons, Vanilla CSS (Theme variables).
* **Backend**: Node.js, Express, PostgreSQL (`pg`), JSON Web Tokens (`jsonwebtoken`), Bcryptjs.
* **Services**: Google OAuth2 verification, Gmail SMTP mail dispatcher (`nodemailer`).

---

## 📂 Project Directory Structure

```
Car-Rental/
├── backend/
│   ├── config/
│   │   └── db.js            # PostgreSQL connection pool & Schema initialization
│   ├── middleware/
│   │   ├── auth.js          # Authentication validation guards
│   │   ├── error.js         # Secure global exception handler
│   │   └── rateLimit.js     # API requests rate limiters
│   ├── routes/
│   │   ├── auth.js          # User auth routes (Session, Registration, Verification, Login)
│   │   ├── bookings.js      # Booking routes (Creation, Listing, Cancellation)
│   │   └── contact.js       # Contact message submissions
│   ├── services/
│   │   └── email.js         # Nodemailer SMTP mail templates
│   ├── server.js            # Express server initialization
│   └── package.json         # Backend node packages
│
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (BookCar, CarBox, Navbar, Login, Signup)
│   │   ├── Pages/           # App pages (Home, About, Models, Profile, Terms, Contact)
│   │   ├── dist/            # Stylesheets (styles.css, nav_style.css, CarBox.css)
│   │   └── App.js           # Route mappings & main entry
│   └── package.json         # Frontend node packages
│
├── package.json             # Root orchestrator (supports concurrent runs)
└── README.md                # Project documentation
```

---

## 🚀 How to Run the App & Configuration Steps

### 1. Database Connection (PostgreSQL)
Create a PostgreSQL instance on a cloud provider like [Supabase](https://supabase.com) or [Neon](https://neon.tech):
1. Create a project and copy the **Connection URI** (starting with `postgresql://`).
2. Open `backend/.env` (duplicate `backend/.env.example` if it doesn't exist) and add the URL:
   ```env
   DATABASE_URL=postgresql://your_db_user:your_db_password@your_db_host:5432/postgres?sslmode=require
   ```
*(Upon launch, the backend will automatically set up the `users`, `bookings`, and `contact_messages` tables).*

### 2. Google OAuth Credentials
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services > Credentials** and create an **OAuth client ID** (Web application).
3. Set Authorized JavaScript origins and Redirect URIs to `http://localhost:3000`.
4. Copy the Client ID and add it to:
   * Backend `.env`: `GOOGLE_CLIENT_ID=your_client_id`
   * Frontend `.env` (or `frontend/.env`): `REACT_APP_GOOGLE_CLIENT_ID=your_client_id`

### 3. Gmail SMTP Setup
To send verified registration links and booking/cancellation receipt emails, configure Nodemailer:
1. Go to your Google Account > **Security** > enable **2-Step Verification**.
2. Click **App passwords** (at the bottom of 2-Step Verification options) and generate a 16-character app password (e.g., `qfxbsfbrifwpyaxo`).
3. Add details to your `backend/.env`:
   ```env
   EMAIL_USER=your_gmail_address@gmail.com
   EMAIL_PASS=your_16_character_app_password
   ```
*(If left blank, the server skips actual email transmission but prints links/summaries directly in the terminal console for easy testing).*

### 4. Running the Servers
To boot both the Express server (port `5000`) and the React development server (port `3000`) concurrently, run this single command in the project root folder:

```bash
npm run dev
```

Your browser will automatically open to `http://localhost:3000` with the fully operational ZoomCarz web application!

---

## 📄 License
This project is licensed under the MIT License.
