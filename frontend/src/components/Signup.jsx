import React, { useState, useEffect } from "react";
import "../dist/auth_style.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Signup = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState(false);
  const [loading, setLoading]         = useState(false);

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "Very Weak", color: "#e94560", percent: 0 };
    
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[\W_]/.test(pass)) score++;

    let label = "Very Weak";
    let color = "#e94560";
    let percent = 20;

    if (score === 2) {
      label = "Weak";
      color = "#ff9f43";
      percent = 40;
    } else if (score === 3) {
      label = "Medium";
      color = "#ffd200";
      percent = 60;
    } else if (score === 4) {
      label = "Strong";
      color = "#2ec4b6";
      percent = 80;
    } else if (score === 5) {
      label = "Very Strong";
      color = "#4caf50";
      percent = 100;
    }

    return { score, label, color, percent };
  };

  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) { setName(""); setEmail(""); setPassword(""); setConfirm(""); setError(""); setSuccess(false); setLoading(false); setShowPass(false); setShowConfirm(false); }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !password || !confirm) { setError("All fields are required."); return; }
    
    // Strict client-side password validations matching backend rules
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!/[a-z]/.test(password)) { setError("Password must contain at least one lowercase letter."); return; }
    if (!/[A-Z]/.test(password)) { setError("Password must contain at least one uppercase letter."); return; }
    if (!/[0-9]/.test(password)) { setError("Password must contain at least one number."); return; }
    if (!/[\W_]/.test(password)) { setError("Password must contain at least one special character."); return; }
    
    if (password !== confirm) { setError("Passwords do not match."); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) { setError("Please enter a valid email address."); return; }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        setLoading(false);
        setTimeout(() => { 
          onClose(); 
          onSwitchToLogin && onSwitchToLogin(); 
        }, 3500);
      } else {
        setLoading(false);
        setError(data.error || (data.errors && data.errors[0].msg) || "Registration failed.");
      }
    } catch (err) {
      setLoading(false);
      setError("Unable to connect to security server. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="signup-title">

        <div className="auth-modal-header">
          <div className="auth-modal-header__icon auth-modal-header__icon--signup">
            <i className="fa-solid fa-user-plus"></i>
          </div>
          <h2 id="signup-title">Create Account</h2>
          <p>Join ZoomCarz and start booking your dream rides</p>
          <button className="auth-modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <div className="auth-modal-body">
          {error && (
            <div className="auth-alert auth-alert--error">
              <i className="fa-solid fa-circle-exclamation"></i> {error}
            </div>
          )}
          {success && (
            <div className="auth-alert auth-alert--success" style={{ lineHeight: "1.4" }}>
              <i className="fa-solid fa-circle-check"></i> Registration successful! A verification link has been sent to your email. Redirecting to Sign In...
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="signup-name">Full Name</label>
              <div className="auth-input-wrap">
                <i className="fa-solid fa-user field-icon"></i>
                <input id="signup-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ravi Kumar" autoComplete="name" required />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-email">Email Address</label>
              <div className="auth-input-wrap">
                <i className="fa-regular fa-envelope field-icon"></i>
                <input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-password">Password</label>
              <div className="auth-input-wrap">
                <i className="fa-solid fa-lock field-icon"></i>
                <input id="signup-password" type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 characters" autoComplete="new-password" required />
                <button type="button" className="auth-toggle-pass" onClick={() => setShowPass(!showPass)}>
                  <i className={showPass ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i>
                </button>
              </div>
              {password && (
                <div style={{ marginTop: "8px", fontSize: "0.8rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ color: "#666" }}>Password Strength:</span>
                    <span style={{ color: strength.color, fontWeight: "bold" }}>{strength.label}</span>
                  </div>
                  <div style={{ width: "100%", height: "5px", backgroundColor: "#eee", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${strength.percent}%`, height: "100%", backgroundColor: strength.color, transition: "width 0.3s ease" }}></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 10px", marginTop: "8px", color: "#888", fontSize: "0.75rem" }}>
                    <span style={{ color: password.length >= 8 ? "#2ec4b6" : "#aaa" }}><i className={password.length >= 8 ? "fa-solid fa-check" : "fa-regular fa-circle"}></i> 8+ characters</span>
                    <span style={{ color: /[A-Z]/.test(password) ? "#2ec4b6" : "#aaa" }}><i className={/[A-Z]/.test(password) ? "fa-solid fa-check" : "fa-regular fa-circle"}></i> Uppercase letter</span>
                    <span style={{ color: /[a-z]/.test(password) ? "#2ec4b6" : "#aaa" }}><i className={/[a-z]/.test(password) ? "fa-solid fa-check" : "fa-regular fa-circle"}></i> Lowercase letter</span>
                    <span style={{ color: /[0-9]/.test(password) ? "#2ec4b6" : "#aaa" }}><i className={/[0-9]/.test(password) ? "fa-solid fa-check" : "fa-regular fa-circle"}></i> Number</span>
                    <span style={{ color: /[\W_]/.test(password) ? "#2ec4b6" : "#aaa" }}><i className={/[\W_]/.test(password) ? "fa-solid fa-check" : "fa-regular fa-circle"}></i> Special character</span>
                  </div>
                </div>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="signup-confirm">Confirm Password</label>
              <div className="auth-input-wrap">
                <i className="fa-solid fa-shield-halved field-icon"></i>
                <input id="signup-confirm" type={showConfirm ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" autoComplete="new-password" required />
                <button type="button" className="auth-toggle-pass" onClick={() => setShowConfirm(!showConfirm)}>
                  <i className={showConfirm ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn auth-submit-btn--signup" disabled={loading || success}>
              {loading ? <><i className="fa-solid fa-spinner fa-spin"></i> Creating Account…</> : <>Create Account &nbsp;<i className="fa-solid fa-arrow-right"></i></>}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <button type="button" onClick={() => { onClose(); onSwitchToLogin && onSwitchToLogin(); }}>Sign In</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
