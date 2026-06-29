import { useEffect, useState } from "react";
// 1. Imported your CAR_DATA array
import { CAR_DATA } from "../components/CarData"; 

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Dynamic car options resolved from CAR_DATA

const LOCATIONS = ["Delhi", "Kolkata", "Bengaluru", "Mumbai", "Goa", "Chennai", "Hyderabad"];

function BookCar() {
  // ── Booking form state ──
  const [carType,   setCarType]   = useState("");
  const [pickUp,    setPickUp]    = useState("");
  const [dropOff,   setDropOff]   = useState("");
  const [pickTime,  setPickTime]  = useState("");
  const [dropTime,  setDropTime]  = useState("");

  // ── Modal state ──
  const [modal,     setModal]     = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // ── Personal info ──
  const [name,      setName]      = useState("");
  const [lastName,  setLastName]  = useState("");
  const [phone,     setPhone]     = useState("");
  const [age,       setAge]       = useState("");
  const [email,     setEmail]     = useState("");
  const [address,   setAddress]   = useState("");
  const [city,      setCity]      = useState("");
  const [zipcode,   setZipCode]   = useState("");
  const [newsletter, setNewsletter] = useState(false);

  // ── Form validation errors ──
  const [formError, setFormError]   = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // 🛠️ FIXED: Drills into index [0] of the inner array to match your CAR_DATA structure
  const selectedCarDetails = CAR_DATA.find((subArray) => subArray[0]?.name === carType)?.[0];

  // Price calculations based on selected car details and duration
  const getBookingPriceDetails = () => {
    if (!selectedCarDetails || !pickTime || !dropTime) return { dailyRate: 0, days: 1, total: 0 };
    const rate = parseInt(selectedCarDetails.price.toString().replace(/,/g, "")) || 0;
    const start = new Date(pickTime);
    const end = new Date(dropTime);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalDays = diffDays <= 0 ? 1 : diffDays;
    return {
      dailyRate: rate,
      days: totalDays,
      total: rate * totalDays
    };
  };

  const { dailyRate, days, total } = getBookingPriceDetails();

  // Lock scroll when modal open
  useEffect(() => {
    document.body.style.overflow = modal ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [modal]);

  // ESC closes modal
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && modal) { setModal(false); setBookingSuccessData(null); setTermsAccepted(false); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modal]);

  // Auto-fill user details if logged in
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            const parts = data.user.name.split(" ");
            setName(parts[0] || "");
            setLastName(parts.slice(1).join(" ") || "");
            setEmail(data.user.email || "");
          }
        }
      } catch (error) {
        // Ignored
      }
    };
    if (modal) {
      fetchUser();
    }
  }, [modal]);

  // Today's date for min attribute
  const today = new Date().toISOString().split("T")[0];

  // Car emoji helper
  const getCarEmoji = () => {
    return "🚗";
  };

  // ── Open modal: validate booking form ──
  const openModal = (e) => {
    e.preventDefault();
    setFormError("");
    if (!carType || !pickUp || !dropOff || !pickTime || !dropTime) {
      setFormError("Please fill in all fields before searching.");
      return;
    }
    if (pickTime > dropTime) {
      setFormError("Drop-off date must be after pick-up date.");
      return;
    }
    if (pickUp === dropOff) {
      setFormError("Pick-up and drop-off locations must be different.");
      return;
    }
    setModal(true);
    // Scroll modal to top
    setTimeout(() => {
      const modalEl = document.querySelector(".booking-modal.active-modal");
      if (modalEl) modalEl.scrollTo(0, 0);
    }, 50);
  };

  // ── Confirm reservation: validate personal info ──
  const confirmBooking = (e) => {
    e.preventDefault();
    const errors = {};
    if (!name.trim())     errors.name     = "Required";
    if (!lastName.trim()) errors.lastName = "Required";
    if (!phone.trim())    errors.phone    = "Required";
    if (!age)             errors.age      = "Required";
    if (!email.trim())    errors.email    = "Required";
    if (!address.trim())  errors.address  = "Required";
    if (!city.trim())     errors.city     = "Required";
    if (!zipcode.trim())  errors.zipcode  = "Required";
    if (!termsAccepted)   errors.terms    = "You must accept the terms and conditions.";

    if (parseInt(age) < 18) { errors.age = "Must be 18+"; }

    const phoneRegex = /^[0-9]{10}$/;
    if (phone && !phoneRegex.test(phone)) errors.phone = "10 digits only";

    const zipRegex = /^[0-9]{6}$/;
    if (zipcode && !zipRegex.test(zipcode)) errors.zipcode = "6 digits only";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    // Submit booking request to backend securely
    const submitBooking = async () => {
      try {
        const response = await fetch(`${API_URL}/api/bookings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            carType,
            pickupLocation: pickUp,
            dropoffLocation: dropOff,
            pickupDate: pickTime,
            dropoffDate: dropTime,
            name,
            lastName,
            phone,
            age,
            email,
            address,
            city,
            zipcode,
            newsletter,
          }),
          credentials: "include", // Pass cookies if logged in
        });

        const data = await response.json();
        
        if (response.ok) {
          setConfirmed(true);
          setBookingSuccessData({ id: data.bookingId });
          window.dispatchEvent(new Event("booking-updated"));
          setTermsAccepted(false);
          // Reset form states
          setCarType("");
          setPickUp("");
          setDropOff("");
          setPickTime("");
          setDropTime("");
        } else {
          setFieldErrors({
            api: data.error || (data.errors && data.errors[0].msg) || "Booking validation failed.",
          });
        }
      } catch (err) {
        setFieldErrors({ api: "Booking server is currently offline. Please try again later." });
      }
    };

    submitBooking();
  };

  return (
    <>
      {/* ═════════════════════════════════════════
          BOOKING FORM SECTION
      ═════════════════════════════════════════ */}
      <section id="booking-section" className="book-section">
        <div className="container">
          <div className="book-content">
            <div className="book-content__box">
              <h2>Book a Car</h2>
              <p className="book-subtitle">
                Select your vehicle, pick-up &amp; drop-off details to get started
              </p>

              {/* Error Message */}
              {formError && (
                <p className="error-message" style={{ display: "flex" }}>
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  {formError}
                  <i className="fa-solid fa-xmark" style={{ marginLeft: "auto", cursor: "pointer" }} onClick={() => setFormError("")}></i>
                </p>
              )}

              {/* Booking Done */}
              {confirmed && (
                <p className="booking-done" style={{ display: "flex" }}>
                  <i className="fa-solid fa-circle-check"></i>
                  Reservation confirmed! Check your email for the voucher.
                  <i className="fa-solid fa-xmark" style={{ marginLeft: "auto", cursor: "pointer" }} onClick={() => setConfirmed(false)}></i>
                </p>
              )}

              {/* Live Cost Estimator Widget */}
              {carType && pickTime && dropTime && (
                <div className="live-cost-estimate" style={{
                  margin: "0 0 20px 0",
                  padding: "15px",
                  background: "var(--off-white)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px"
                }}>
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Selected Vehicle</span>
                    <h4 style={{ fontSize: "1.15rem", color: "var(--dark)", fontWeight: "bold", margin: "2px 0 0 0" }}>🚗 {carType}</h4>
                  </div>
                  <div style={{ display: "flex", gap: "25px", flexWrap: "wrap" }}>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Daily Rate</span>
                      <h5 style={{ fontSize: "1rem", color: "var(--dark)", fontWeight: "bold", margin: "2px 0 0 0" }}>₹{dailyRate.toLocaleString()}/day</h5>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Duration</span>
                      <h5 style={{ fontSize: "1rem", color: "var(--dark)", fontWeight: "bold", margin: "2px 0 0 0" }}>{days} day(s)</h5>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Est. Total</span>
                      <h5 style={{ fontSize: "1.15rem", color: "#ff4d30", fontWeight: "bold", margin: "2px 0 0 0" }}>₹{total.toLocaleString()}</h5>
                    </div>
                  </div>
                </div>
              )}

              <form className="box-form">
                {/* Car Type */}
                <div className="box-form__car-type">
                  <label>
                    <i className="fa-solid fa-car"></i> Select Car Type <b>*</b>
                  </label>
                  <select value={carType} onChange={(e) => setCarType(e.target.value)}>
                    <option value="">Select your car type</option>
                    {CAR_DATA.map((subArray) => {
                      const car = subArray[0];
                      if (!car) return null;
                      return (
                        <option key={car.name} value={car.name}>
                          🚗 {car.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Pick-Up */}
                <div className="box-form__car-type">
                  <label>
                    <i className="fa-solid fa-location-dot"></i> Pick-Up <b>*</b>
                  </label>
                  <select value={pickUp} onChange={(e) => setPickUp(e.target.value)}>
                    <option value="">Select pick-up location</option>
                    {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>

                {/* Drop-Off */}
                <div className="box-form__car-type">
                  <label>
                    <i className="fa-solid fa-location-dot"></i> Drop-Off <b>*</b>
                  </label>
                  <select value={dropOff} onChange={(e) => setDropOff(e.target.value)}>
                    <option value="">Select drop-off location</option>
                    {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>

                {/* Pick-Up Date */}
                <div className="box-form__car-time">
                  <label 
                    htmlFor="picktime"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById("picktime")?.showPicker();
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <i className="fa-regular fa-calendar-days"></i> Pick-Up Date <b>*</b>
                  </label>
                  <input
                    id="picktime"
                    value={pickTime}
                    onChange={(e) => setPickTime(e.target.value)}
                    type="date"
                    min={today}
                  />
                </div>

                {/* Drop-Off Date */}
                <div className="box-form__car-time">
                  <label 
                    htmlFor="droptime"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById("droptime")?.showPicker();
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <i className="fa-regular fa-calendar-days"></i> Drop-Off Date <b>*</b>
                  </label>
                  <input
                    id="droptime"
                    value={dropTime}
                    onChange={(e) => setDropTime(e.target.value)}
                    type="date"
                    min={pickTime || today}
                  />
                </div>

                <button onClick={openModal} type="submit" className="book-search-btn">
                  <i className="fa-solid fa-magnifying-glass"></i>&nbsp; Search
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════
          COMPLETE RESERVATION MODAL
      ═════════════════════════════════════════ */}
      <div
        className={`booking-modal ${modal ? "active-modal" : ""}`}
        onClick={(e) => { if (e.target.classList.contains("booking-modal")) { setModal(false); setBookingSuccessData(null); setTermsAccepted(false); } }}
      >
        <div className="booking-modal__inner">
          <style>{`
            @keyframes bounce-checkmark {
              0% { transform: scale(0.3); opacity: 0; }
              50% { transform: scale(1.1); }
              70% { transform: scale(0.9); }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
          {bookingSuccessData ? (
            <div className="booking-success-screen" style={{ padding: "40px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
              <div 
                className="success-checkmark-circle" 
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "#e2f9f5",
                  color: "#2ec4b6",
                  fontSize: "3.2rem",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: "10px",
                  boxShadow: "0 4px 15px rgba(46, 196, 182, 0.2)",
                  animation: "bounce-checkmark 0.5s ease-out"
                }}
              >
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <h2 style={{ fontSize: "1.8rem", color: "#111", fontWeight: "bold", margin: 0 }}>Booking Confirmed!</h2>
              <p style={{ color: "#666", fontSize: "1rem", maxWidth: "450px", lineHeight: "1.5", margin: 0 }}>
                Thank you for booking with ZoomCarz. Your reservation has been successfully processed. A confirmation receipt has been sent to your email.
              </p>
              
              <div style={{ background: "#f9f9f9", padding: "15px 30px", borderRadius: "10px", border: "1px solid #eee", fontSize: "1.1rem", fontWeight: "bold", color: "#333", margin: "10px 0" }}>
                Reservation ID: <span style={{ color: "#ff4d30" }}>{bookingSuccessData.id}</span>
              </div>
              
              <div style={{ display: "flex", gap: "15px", marginTop: "10px" }}>
                <a 
                  href="/profile" 
                  onClick={(e) => {
                    e.preventDefault();
                    setModal(false);
                    setBookingSuccessData(null);
                    setTermsAccepted(false);
                    window.location.href = "/profile";
                  }}
                  className="book-btn-link"
                  style={{ textDecoration: "none", display: "inline-block" }}
                >
                  <i className="fa-solid fa-user-gear"></i> View My Bookings
                </a>
                <button 
                  onClick={() => {
                    setModal(false);
                    setBookingSuccessData(null);
                    setTermsAccepted(false);
                  }}
                  style={{
                    background: "#111",
                    color: "white",
                    padding: "12px 30px",
                    border: "none",
                    borderRadius: "5px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="booking-modal__title">
                <h2>
                  <i className="fa-solid fa-file-contract"></i>
                  Complete Reservation
                </h2>
                <i
                  className="fa-solid fa-xmark close-icon"
                  onClick={() => { setModal(false); setBookingSuccessData(null); setTermsAccepted(false); }}
                  aria-label="Close"
                ></i>
              </div>

          {/* Notice */}
          <div className="booking-modal__message">
            <i className="fa-solid fa-circle-info"></i>
            <p>
              <strong>Upon completing this reservation</strong> you will receive your rental
              voucher and a toll-free customer support number at your email address.
            </p>
          </div>

          <div className="booking-modal__body">
            {/* ── Car Info ── */}
            <div className="booking-modal__car-info">
              <div>
                <div className="bm-section-label">
                  <i className="fa-solid fa-route"></i> Trip Summary
                </div>
                <div className="dates-div">
                  <div className="booking-modal__car-info__dates">
                    <h5>Date &amp; Time</h5>
                    <span>
                      <i className="fa-solid fa-circle-dot"></i>
                      <div>
                        <h6>Pick-Up Date</h6>
                        <p>
                          {pickTime} &nbsp;/&nbsp;
                          <input type="time" className="input-time" defaultValue="10:00" />
                        </p>
                      </div>
                    </span>
                  </div>
                  <div className="booking-modal__car-info__dates">
                    <span>
                      <i className="fa-solid fa-location-dot"></i>
                      <div>
                        <h6>Drop-Off Date</h6>
                        <p>
                          {dropTime} &nbsp;/&nbsp;
                          <input type="time" className="input-time" defaultValue="10:00" />
                        </p>
                      </div>
                    </span>
                  </div>
                  <div className="booking-modal__car-info__dates">
                    <span>
                      <i className="fa-solid fa-map-marker-alt"></i>
                      <div>
                        <h6>Pick-Up Location</h6>
                        <p>{pickUp}</p>
                      </div>
                    </span>
                  </div>
                  <div className="booking-modal__car-info__dates">
                    <span>
                      <i className="fa-solid fa-flag-checkered"></i>
                      <div>
                        <h6>Drop-Off Location</h6>
                        <p>{dropOff}</p>
                      </div>
                    </span>
                  </div>
                </div>
              </div>

              {/* Selected Car Image Area */}
              <div className="booking-modal__car-info__model">
                <h5><span>Selected Car</span></h5>
                <div className="car-name-display">
                  {carType}
                </div>
                
                <div className="modal-car-image-container" style={{ marginTop: "15px", textAlign: "center" }}>
                  {selectedCarDetails?.img ? (
                    <img 
                      src={selectedCarDetails.img} 
                      alt={carType} 
                      style={{ width: "100%", maxHeight: "180px", objectFit: "contain" }} 
                    />
                  ) : (
                    <span style={{ fontSize: "3.5rem", lineHeight: 1, display: "block" }}>
                      {getCarEmoji()}
                    </span>
                  )}
                </div>

                <div style={{ marginTop: "15px", background: "#fcfcfc", padding: "12px 18px", borderRadius: "10px", border: "1px solid #eee", textAlign: "left" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.85rem" }}>
                    <span style={{ color: "#666" }}>Daily Rate:</span>
                    <span style={{ fontWeight: "bold", color: "#111" }}>₹{dailyRate.toLocaleString()}/day</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.85rem" }}>
                    <span style={{ color: "#666" }}>Duration:</span>
                    <span style={{ fontWeight: "bold", color: "#111" }}>{days} day(s)</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #eee", paddingTop: "6px", fontSize: "1rem", marginTop: "4px" }}>
                    <span style={{ color: "#111", fontWeight: "bold" }}>Total Cost:</span>
                    <span style={{ fontWeight: "bold", color: "#ff4d30" }}>₹{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Personal Info ── */}
            <div className="booking-modal__person-info">
              <h4>
                <i className="fa-solid fa-user"></i>
                Personal Information
              </h4>

              {fieldErrors.api && (
                <div className="auth-alert auth-alert--error" style={{ margin: "10px 0 20px 0", width: "100%", padding: "10px 15px", borderRadius: "5px", background: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb", fontSize: "0.9rem", display: "flex", gap: "10px", alignItems: "center" }}>
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <span>{fieldErrors.api}</span>
                </div>
              )}

              <form className="info-form" onSubmit={confirmBooking} noValidate>
                <div className="info-form__2col">
                  <span>
                    <label>First Name <b>*</b></label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      type="text"
                      placeholder="Ravi"
                      style={fieldErrors.name ? { borderColor: "#e94560" } : {}}
                    />
                    {fieldErrors.name && <p className="error-modal" style={{ display: "block" }}>{fieldErrors.name}</p>}
                  </span>
                  <span>
                    <label>Last Name <b>*</b></label>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      type="text"
                      placeholder="Kumar"
                      style={fieldErrors.lastName ? { borderColor: "#e94560" } : {}}
                    />
                    {fieldErrors.lastName && <p className="error-modal" style={{ display: "block" }}>{fieldErrors.lastName}</p>}
                  </span>
                  <span>
                    <label>Phone Number <b>*</b></label>
                    <input
                      value={phone}
                      onChange={(e) => { if (/^[0-9]{0,10}$/.test(e.target.value)) setPhone(e.target.value); }}
                      type="tel"
                      placeholder="9876543210"
                      maxLength={10}
                      style={fieldErrors.phone ? { borderColor: "#e94560" } : {}}
                    />
                    {fieldErrors.phone && <p className="error-modal" style={{ display: "block" }}>{fieldErrors.phone}</p>}
                  </span>
                  <span>
                    <label>Age <b>*</b></label>
                    <input
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      type="number"
                      placeholder="18"
                      min="18"
                      max="80"
                      style={fieldErrors.age ? { borderColor: "#e94560" } : {}}
                    />
                    {fieldErrors.age && <p className="error-modal" style={{ display: "block" }}>{fieldErrors.age}</p>}
                  </span>
                </div>

                <div className="info-form__1col">
                  <span>
                    <label>Email Address <b>*</b></label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder="ravi@example.com"
                      style={fieldErrors.email ? { borderColor: "#e94560" } : {}}
                    />
                    {fieldErrors.email && <p className="error-modal" style={{ display: "block" }}>{fieldErrors.email}</p>}
                  </span>
                  <span>
                    <label>Street Address <b>*</b></label>
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      type="text"
                      placeholder="123 MG Road"
                      style={fieldErrors.address ? { borderColor: "#e94560" } : {}}
                    />
                    {fieldErrors.address && <p className="error-modal" style={{ display: "block" }}>{fieldErrors.address}</p>}
                  </span>
                </div>

                <div className="info-form__2col">
                  <span>
                    <label>City <b>*</b></label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      type="text"
                      placeholder="New Delhi"
                      style={fieldErrors.city ? { borderColor: "#e94560" } : {}}
                    />
                    {fieldErrors.city && <p className="error-modal" style={{ display: "block" }}>{fieldErrors.city}</p>}
                  </span>
                  <span>
                    <label>PIN Code <b>*</b></label>
                    <input
                      value={zipcode}
                      onChange={(e) => { if (/^[0-9]{0,6}$/.test(e.target.value)) setZipCode(e.target.value); }}
                      type="text"
                      placeholder="110001"
                      maxLength={6}
                      style={fieldErrors.zipcode ? { borderColor: "#e94560" } : {}}
                    />
                    {fieldErrors.zipcode && <p className="error-modal" style={{ display: "block" }}>{fieldErrors.zipcode}</p>}
                  </span>
                </div>

                <span className="info-form__checkbox">
                  <input
                    type="checkbox"
                    id="newsletter"
                    checked={newsletter}
                    onChange={(e) => setNewsletter(e.target.checked)}
                  />
                  <label htmlFor="newsletter" style={{ fontSize: "0.85rem", color: "#666", cursor: "pointer" }}>
                    Send me latest deals, offers and travel tips
                  </label>
                </span>

                <span className="info-form__checkbox" style={{ marginTop: "8px" }}>
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    style={fieldErrors.terms ? { outline: "2px solid #e94560" } : {}}
                  />
                  <label htmlFor="terms" style={{ fontSize: "0.85rem", color: "#666", cursor: "pointer" }}>
                    I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "#ff4d30", fontWeight: "bold", textDecoration: "underline" }}>Terms &amp; Conditions</a> of ZoomCarz <b>*</b>
                  </label>
                </span>
                {fieldErrors.terms && <p className="error-modal" style={{ display: "block", marginTop: "2px", color: "#e94560", fontSize: "0.75rem" }}>{fieldErrors.terms}</p>}

                <div className="reserve-button-sum">
                  <button type="submit">
                    <i className="fa-solid fa-check"></i> Reserve Now
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
        )}
      </div>
    </div>
  </>
  );
}

export default BookCar;