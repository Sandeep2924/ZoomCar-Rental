import "./dist/styles.css";
import { useState, useEffect } from "react";
import About from "./Pages/About";
import Home from "./Pages/Home";
import Navbar from "./components/Navbar";
import { Route, Routes, useSearchParams } from "react-router-dom";
import Models from "./Pages/Models";
import TestimonialsPage from "./Pages/TestimonialsPage";
import Team from "./Pages/Team";
import Contact from "./Pages/Contact";
import Profile from "./Pages/Profile";
import Terms from "./Pages/Terms";
import { GoogleOAuthProvider } from "@react-oauth/google";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function App() {
  const [user, setUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [verificationAlert, setVerificationAlert] = useState(null);

  const handleLoginSuccess = (userData, token) => {
    if (token) {
      localStorage.setItem("session_token", token);
    }
    setUser(userData);
  };
  
  const handleLogout = async () => {
    const token = localStorage.getItem("session_token");
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem("session_token");
    setUser(null);
  };

  // Restore session on load
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("session_token");
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
          },
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
          } else {
            // Guest: no user, clear any stale token
            localStorage.removeItem("session_token");
          }
        } else {
          localStorage.removeItem("session_token");
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
      } finally {
        setSessionLoading(false);
      }
    };
    checkSession();
  }, []);

  // Handle email verification alert from URL redirect
  useEffect(() => {
    const verified = searchParams.get("verified");
    const error = searchParams.get("error");

    if (verified === "true") {
      setVerificationAlert({
        type: "success",
        message: "Email verified successfully! You can now sign in.",
      });
      searchParams.delete("verified");
      setSearchParams(searchParams);
    } else if (verified === "false") {
      let errMsg = "Email verification failed.";
      if (error === "invalid_token") errMsg = "Verification link is invalid or expired.";
      else if (error === "missing_token") errMsg = "Verification token is missing.";

      setVerificationAlert({
        type: "error",
        message: errMsg,
      });
      searchParams.delete("verified");
      searchParams.delete("error");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || "your_google_client_id.apps.googleusercontent.com"}>
      {verificationAlert && (
        <div 
          className={`auth-global-toast auth-global-toast--${verificationAlert.type}`}
          onClick={() => setVerificationAlert(null)}
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            background: verificationAlert.type === "success" ? "#4caf50" : "#f44336",
            color: "white",
            padding: "12px 24px",
            borderRadius: "5px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            cursor: "pointer",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            transition: "all 0.3s ease"
          }}
        >
          <i className={verificationAlert.type === "success" ? "fa-solid fa-circle-check" : "fa-solid fa-circle-exclamation"}></i>
          <span>{verificationAlert.message}</span>
          <i className="fa-solid fa-xmark" style={{ marginLeft: "10px", fontSize: "0.8rem", opacity: 0.8 }}></i>
        </div>
      )}
      <Navbar
        user={user}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />
      <Routes>
        <Route index path="/"              element={<Home />}             />
        <Route path="about"                element={<About />}            />
        <Route path="models"               element={<Models />}           />
        <Route path="testimonials"         element={<TestimonialsPage />} />
        <Route path="team"                 element={<Team />}             />
        <Route path="contact"              element={<Contact />}          />
        <Route path="profile"              element={<Profile user={user} sessionLoading={sessionLoading} />}          />
        <Route path="terms"                element={<Terms />}            />
      </Routes>
    </GoogleOAuthProvider>
  );
}

export default App;
