import { useState } from "react";
import Footer from "../components/Footer";
import HeroPages from "../components/HeroPages";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await response.json();

      if (response.ok) {
        setSuccessMsg(data.message || "Your message was sent successfully!");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setErrorMsg(data.error || (data.errors && data.errors[0].msg) || "Failed to send message.");
      }
    } catch (err) {
      setErrorMsg("Failed to connect to contact server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="contact-page">
        <HeroPages name="Contact" />
        <div className="container">
          <div className="contact-div">
            <div className="contact-div__text">
              <h2>Reach Out to Us</h2>
              <p>We're here to assist with any questions. With over 15 years of industry experience and a commitment to excellent service, we're your trusted car rental partner in India.</p>
              <a href="tel:+919876543210"><i className="fa-solid fa-phone"></i> +91 98765 43210</a>
              <a href="mailto:hello@zoomcarz.in"><i className="fa-solid fa-envelope"></i> hello@zoomcarz.in</a>
              <a href="https://maps.google.com/?q=Sector+22B,+Chandigarh" target="_blank" rel="noopener noreferrer">
                <i className="fa-solid fa-location-dot"></i> 123, Sector 22B, Chandigarh, 160022
              </a>
            </div>
            <div className="contact-div__form">
              {successMsg && (
                <div className="auth-alert auth-alert--success" style={{ margin: "0 0 20px 0", background: "#d4edda", color: "#155724", padding: "10px 15px", borderRadius: "5px", border: "1px solid #c3e6cb", display: "flex", gap: "10px", alignItems: "center" }}>
                  <i className="fa-solid fa-circle-check"></i>
                  <span>{successMsg}</span>
                </div>
              )}
              {errorMsg && (
                <div className="auth-alert auth-alert--error" style={{ margin: "0 0 20px 0", background: "#f8d7da", color: "#721c24", padding: "10px 15px", borderRadius: "5px", border: "1px solid #f5c6cb", display: "flex", gap: "10px", alignItems: "center" }}>
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>{errorMsg}</span>
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <label>Full Name <b>*</b></label>
                <input 
                  type="text" 
                  placeholder='E.g. "Ravi Kumar"' 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                  disabled={loading}
                />
                <label>Email <b>*</b></label>
                <input 
                  type="email" 
                  placeholder="you@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  disabled={loading}
                />
                <label>Message <b>*</b></label>
                <textarea 
                  placeholder="Write your message here..." 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  disabled={loading}
                ></textarea>
                <button type="submit" disabled={loading}>
                  {loading ? (
                    <><i className="fa-solid fa-spinner fa-spin"></i>&nbsp; Sending...</>
                  ) : (
                    <><i className="fa-solid fa-envelope-open-text"></i>&nbsp; Send Message</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
        <div className="book-banner">
          <div className="book-banner__overlay"></div>
          <div className="container">
            <div className="text-content">
              <h2>Book a car by getting in touch with us</h2>
              <span><i className="fa-solid fa-phone"></i><h3>+91 98765-43210</h3></span>
            </div>
          </div>
        </div>
        <Footer />
      </section>
    </>
  );
}

export default Contact;
