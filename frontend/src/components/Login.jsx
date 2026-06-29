import React, { useState, useEffect } from "react";
import "../dist/auth_style.css";
import { GoogleLogin } from "@react-oauth/google";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Login = ({ isOpen, onClose, onLoginSuccess, onSwitchToSignup }) => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  // Resend verification state
  const [showResend, setShowResend]       = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg]         = useState("");
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setEmail(""); setPassword(""); setError(""); setShowPass(false); setLoading(false);
      setShowResend(false); setResendLoading(false); setResendMsg(""); setResendSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShowResend(false);
    setResendMsg("");
    if (!email.trim() || !password) { setError("Please fill in all fields."); return; }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await response.json();
      
      if (response.ok) {
        onLoginSuccess && onLoginSuccess(data.user, data.token);
        onClose();
      } else {
        setError(data.error || "Invalid email or password.");
        // Show resend button if unverified email error
        if (response.status === 403 && data.error && data.error.toLowerCase().includes("not been verified")) {
          setShowResend(true);
        }
      }
    } catch (err) {
      console.error("Manual login network error:", err);
      setError(`Unable to connect to security server: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setResendMsg("Please enter your email address above first.");
      setResendSuccess(false);
      return;
    }
    setResendLoading(true);
    setResendMsg("");
    try {
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setResendMsg(data.message || "Verification email sent!");
      setResendSuccess(true);
      if (data.alreadyVerified) {
        setShowResend(false);
        setError("");
      }
    } catch (err) {
      setResendMsg("Failed to resend. Please try again.");
      setResendSuccess(false);
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
        credentials: "include",
      });
      const data = await response.json();
      
      if (response.ok) {
        onLoginSuccess && onLoginSuccess(data.user, data.token);
        onClose();
      } else {
        setError(data.error || "Google login failed.");
      }
    } catch (err) {
      console.error("Google login network/parse error:", err);
      setError(`Google authentication service error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-In failed. Please try again.");
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="login-title">

        <div className="auth-modal-header">
          <div className="auth-modal-header__icon auth-modal-header__icon--login">
            <i className="fa-solid fa-key"></i>
          </div>
          <h2 id="login-title">Welcome Back</h2>
          <p>Sign in to manage your bookings &amp; preferences</p>
          <button className="auth-modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <div className="auth-modal-body">
          <div className="google-login-container" style={{ margin: "5px 0 15px 0", display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center" }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              shape="pill"
              size="large"
              text="signin_with"
            />
            <div style={{ display: "flex", alignItems: "center", width: "100%", margin: "15px 0 10px 0", color: "#888", fontSize: "0.85rem" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#eee" }}></div>
              <span style={{ padding: "0 10px", fontWeight: "500" }}>or Sign In with Email</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#eee" }}></div>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="auth-alert auth-alert--error">
              <i className="fa-solid fa-circle-exclamation"></i> {error}
            </div>
          )}

          {/* ── Resend Verification Block ── */}
          {showResend && (
            <div style={{
              background: "linear-gradient(135deg, #fff8e1, #fff3cd)",
              border: "1px solid #ffc107",
              borderRadius: "10px",
              padding: "14px 16px",
              marginBottom: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <i className="fa-solid fa-envelope-circle-check" style={{ color: "#f59e0b", fontSize: "1.2rem", marginTop: "2px" }}></i>
                <div>
                  <p style={{ margin: 0, fontWeight: "600", color: "#92400e", fontSize: "0.9rem" }}>Email not verified yet</p>
                  <p style={{ margin: "4px 0 0 0", color: "#78350f", fontSize: "0.8rem", lineHeight: "1.5" }}>
                    Check your inbox (and spam folder) for the verification link. Didn't receive it?
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="resend-verification-btn"
                onClick={handleResendVerification}
                disabled={resendLoading}
                style={{
                  background: resendLoading ? "#d4a017" : "#f59e0b",
                  color: "white",
                  border: "none",
                  borderRadius: "7px",
                  padding: "9px 16px",
                  fontWeight: "600",
                  fontSize: "0.85rem",
                  cursor: resendLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                  width: "100%",
                }}
              >
                {resendLoading
                  ? <><i className="fa-solid fa-spinner fa-spin"></i> Sending new link…</>
                  : <><i className="fa-solid fa-paper-plane"></i> Resend Verification Email</>
                }
              </button>
              {resendMsg && (
                <div style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  fontWeight: "500",
                  background: resendSuccess ? "#d1fae5" : "#fee2e2",
                  color: resendSuccess ? "#065f46" : "#991b1b",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                }}>
                  <i className={`fa-solid ${resendSuccess ? "fa-circle-check" : "fa-circle-exclamation"}`}></i>
                  {resendMsg}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="login-email">Email Address</label>
              <div className="auth-input-wrap">
                <i className="fa-regular fa-envelope field-icon"></i>
                <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <div className="auth-input-wrap">
                <i className="fa-solid fa-lock field-icon"></i>
                <input id="login-password" type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
                <button type="button" className="auth-toggle-pass" onClick={() => setShowPass(!showPass)}>
                  <i className={showPass ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn auth-submit-btn--login" disabled={loading}>
              {loading ? <><i className="fa-solid fa-spinner fa-spin"></i> Signing In…</> : <>Sign In &nbsp;<i className="fa-solid fa-arrow-right"></i></>}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?{" "}
            <button type="button" onClick={() => { onClose(); onSwitchToSignup && onSwitchToSignup(); }}>Sign Up</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
