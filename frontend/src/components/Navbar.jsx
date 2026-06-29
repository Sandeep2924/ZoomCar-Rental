import React, { useState, useEffect, useCallback } from "react";
import { Link, NavLink } from "react-router-dom";
import Logo from "../images/logo/logo.png";
import "../dist/nav_style.css";
import Login from "./Login";
import Signup from "./Signup";

const Navbar = ({ user, onLoginSuccess, onLogout }) => {
  const [navOpen, setNavOpen]     = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [bookingCount, setBookingCount] = useState(0);
  const toggleNav = () => setNavOpen(!navOpen);
  const closeNav  = () => setNavOpen(false);

  // Lock in default theme mode on mount
  useEffect(() => {
    document.documentElement.removeAttribute("data-theme");
  }, []);

  // Lock body scroll when any modal is open
  useEffect(() => {
    document.body.style.overflow = (showLogin || showSignup || navOpen) ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [showLogin, showSignup, navOpen]);

  // Fetch active bookings count dynamically
  const fetchBookingCount = useCallback(async () => {
    if (!user) {
      setBookingCount(0);
      return;
    }
    const token = localStorage.getItem("session_token");
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/bookings`, {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setBookingCount(data.bookings ? data.bookings.length : 0);
      }
    } catch (e) {
      // Ignored
    }
  }, [user]);

  useEffect(() => {
    fetchBookingCount();
    window.addEventListener("booking-updated", fetchBookingCount);
    return () => window.removeEventListener("booking-updated", fetchBookingCount);
  }, [fetchBookingCount]);

  const navLinks = [
    { to: "/",             label: "Home"           },
    { to: "/about",        label: "About"          },
    { to: "/models",       label: "Vehicle Models" },
    { to: "/testimonials", label: "Testimonials"   },
    { to: "/team",         label: "Our Team"       },
    { to: "/contact",      label: "Contact"        },
  ];

  // Short display name from email or name
  const displayName = user
    ? (typeof user === "string" ? user.split("@")[0] : (user.name || user.email.split("@")[0]))
    : "";

  return (
    <>
      <style>{`
        @keyframes pulse-badge {
          0% { transform: scale(1); }
          50% { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
      `}</style>
      {/* ── Mobile Sidebar ── */}
      <div className={`mobile-navbar ${navOpen ? "open-nav" : ""}`}>
        <div onClick={toggleNav} className="mobile-navbar__close" aria-label="Close menu">
          <i className="fas fa-times"></i>
        </div>
        <ul className="mobile-navbar__links">
          {navLinks.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={closeNav}
                className={({ isActive }) => `mobile-navbar__link ${isActive ? "active" : ""}`}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="mobile-navbar__buttons" style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", padding: "0 40px" }}>
          <div style={{ display: "flex", gap: "10px", width: "100%", justifyContent: "center", marginTop: "5px" }}>
            {user ? (
              <>
                <Link to="/profile" onClick={closeNav} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="navbar__user-chip" style={{ cursor: "pointer" }}>
                    <i className="fa-solid fa-circle-check"></i> {displayName}
                  </span>
                  {bookingCount > 0 && (
                    <span className="navbar__booking-badge" style={{ background: "#ff4d30", color: "white", borderRadius: "50%", minWidth: "20px", height: "20px", padding: "0 6px", fontSize: "0.7rem", fontWeight: "bold", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 2px 6px rgba(255, 77, 48, 0.4)", animation: "pulse-badge 2s infinite ease-in-out" }}>
                      {bookingCount}
                    </span>
                  )}
                </Link>
                <button className="navbar__btn navbar__btn--logout" onClick={() => { onLogout(); closeNav(); }}>
                  <i className="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
                </button>
              </>
            ) : (
              <>
                <button className="navbar__btn navbar__btn--signin" onClick={() => { setShowLogin(true); closeNav(); }}>Sign In</button>
                <button className="navbar__btn navbar__btn--register" onClick={() => { setShowSignup(true); closeNav(); }}>Register</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Desktop Navbar ── */}
      <div className="navbar">
        <div className="navbar__logo">
          <Link to="/" onClick={() => window.scrollTo(0, 0)}>
            <img src={Logo} alt="ZoomCarz Logo" loading="lazy" />
          </Link>
          <span className="navbar__company-name">ZoomCarz</span>
        </div>

        <ul className="navbar__links">
          {navLinks.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) => `navbar__link ${isActive ? "active" : ""}`}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="navbar__buttons">
          {user ? (
            <>
              <Link to="/profile" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="navbar__user-chip navbar__user-chip--clickable" style={{ cursor: "pointer", transition: "all 0.3s ease" }}>
                  <i className="fa-solid fa-circle-check"></i> {displayName}
                </span>
                {bookingCount > 0 && (
                  <span className="navbar__booking-badge" style={{ background: "#ff4d30", color: "white", borderRadius: "50%", minWidth: "20px", height: "20px", padding: "0 6px", fontSize: "0.7rem", fontWeight: "bold", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 2px 6px rgba(255, 77, 48, 0.4)", animation: "pulse-badge 2s infinite ease-in-out" }}>
                    {bookingCount}
                  </span>
                )}
              </Link>
              <button className="navbar__btn navbar__btn--logout" onClick={onLogout}>
                <i className="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
              </button>
            </>
          ) : (
            <>
              <button className="navbar__btn navbar__btn--signin" onClick={() => setShowLogin(true)}>Sign In</button>
              <button className="navbar__btn navbar__btn--register" onClick={() => setShowSignup(true)}>Register</button>
            </>
          )}
        </div>

        <div className="mobile-hamb" onClick={toggleNav} aria-label="Open menu">
          <i className="fas fa-bars"></i>
        </div>
      </div>

      {/* ── Auth Modals ── */}
      <Login
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={(email) => { onLoginSuccess && onLoginSuccess(email); }}
        onSwitchToSignup={() => setShowSignup(true)}
      />
      <Signup
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSwitchToLogin={() => setShowLogin(true)}
      />
    </>
  );
};

export default Navbar;
