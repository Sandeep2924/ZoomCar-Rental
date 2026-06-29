import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import HeroPages from "../components/HeroPages";
import SkeletonLoader from "../components/SkeletonLoader";
import "../dist/profile_style.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function Profile() {
  const [bookings, setBookings] = useState([]);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Booking filters and cancellation dialog states
  const [activeTab, setActiveTab] = useState("all"); // "all", "active", "past"
  const [cancellingId, setCancellingId] = useState(null);
  const [cancellingError, setCancellingError] = useState("");
  const [isSubmittingCancellation, setIsSubmittingCancellation] = useState(false);

  useEffect(() => {
    const fetchProfileAndBookings = async () => {
      try {
        // 1. Fetch user session
        const meResponse = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
        });
        
        if (!meResponse.ok) {
          setError("Please log in to view your profile.");
          setLoading(false);
          setLoadingBookings(false);
          // Redirect to home page after a small delay
          setTimeout(() => navigate("/"), 2500);
          return;
        }
        
        const userData = await meResponse.json();
        setProfileUser(userData.user);
        setLoading(false);

        // 2. Fetch user's bookings
        const bookingsResponse = await fetch(`${API_URL}/api/bookings`, {
          credentials: "include",
        });
        
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          setBookings(bookingsData.bookings);
        } else {
          setError("Failed to load your reservations.");
        }
      } catch (err) {
        setError("Network error. Unable to load profile data.");
      } finally {
        setLoading(false);
        setLoadingBookings(false);
      }
    };

    fetchProfileAndBookings();
  }, [navigate]);

  // Handle Cancellation submission
  const handleCancelBooking = async (id) => {
    setIsSubmittingCancellation(true);
    setCancellingError("");
    try {
      const response = await fetch(`${API_URL}/api/bookings/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (response.ok) {
        // Remove from list
        setBookings(bookings.filter(b => b.id !== id));
        setCancellingId(null);
        // Sync Navbar badge
        window.dispatchEvent(new Event("booking-updated"));
      } else {
        const data = await response.json();
        setCancellingError(data.error || "Booking cancellation failed.");
      }
    } catch (err) {
      setCancellingError("Server is currently offline. Please try again later.");
    } finally {
      setIsSubmittingCancellation(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading-container" style={{ minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "3rem", color: "#ff4d30", marginBottom: "15px" }}></i>
        <h3>Loading your profile...</h3>
      </div>
    );
  }

  if (error && !profileUser) {
    return (
      <div className="profile-error-container" style={{ minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", textAlign: "center", padding: "20px" }}>
        <i className="fa-solid fa-circle-exclamation" style={{ fontSize: "4rem", color: "#e94560", marginBottom: "15px" }}></i>
        <h2>Access Denied</h2>
        <p>{error}</p>
        <p style={{ color: "#888", fontSize: "0.9rem" }}>Redirecting you to the home page...</p>
      </div>
    );
  }

  const userInitials = profileUser ? profileUser.name.split(" ").map(n => n[0]).join("").toUpperCase() : "U";

  // Filter categorization
  const todayStr = new Date().toISOString().split("T")[0];
  const activeTrips = bookings.filter(b => b.dropoff_date >= todayStr);
  const pastTrips = bookings.filter(b => b.dropoff_date < todayStr);

  const displayedBookings = activeTab === "active" 
    ? activeTrips 
    : activeTab === "past" 
      ? pastTrips 
      : bookings;

  return (
    <>
      <section className="profile-page" style={{ transition: "background var(--transition-base)" }}>
        <HeroPages name="My Profile" />
        
        <div className="container">
          <div className="profile-grid">
            {/* User Info Card */}
            <div className="profile-sidebar">
              <div className="profile-user-card" style={{ border: "1px solid var(--border)", background: "var(--bg-white)", transition: "all 0.3s" }}>
                <div className="profile-avatar">
                  {userInitials}
                </div>
                <h3 style={{ color: "var(--dark)" }}>{profileUser.name}</h3>
                <p className="profile-email" style={{ color: "var(--text-muted)" }}><i className="fa-regular fa-envelope"></i> {profileUser.email}</p>
                <div className="profile-meta">
                  <div className="meta-item">
                    <span className="meta-label">Account Status</span>
                    <span className="meta-val badge-verified"><i className="fa-solid fa-circle-check"></i> Verified</span>
                  </div>
                </div>
              </div>
            </div>
 
            {/* Reservations List */}
            <div className="profile-content">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px", marginBottom: "25px", borderBottom: "1px solid var(--border)", paddingBottom: "15px" }}>
                <h2 style={{ color: "var(--dark)", fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>My Reservations</h2>
                
                {/* Filter Tabs */}
                <div style={{ display: "flex", gap: "5px", background: "var(--off-white)", padding: "4px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <button 
                    onClick={() => setActiveTab("all")}
                    style={{
                      padding: "6px 16px",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                      border: "none",
                      cursor: "pointer",
                      background: activeTab === "all" ? "var(--primary)" : "transparent",
                      color: activeTab === "all" ? "#000" : "var(--text-muted)",
                      transition: "all 0.2s"
                    }}
                  >
                    All ({bookings.length})
                  </button>
                  <button 
                    onClick={() => setActiveTab("active")}
                    style={{
                      padding: "6px 16px",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                      border: "none",
                      cursor: "pointer",
                      background: activeTab === "active" ? "var(--primary)" : "transparent",
                      color: activeTab === "active" ? "#000" : "var(--text-muted)",
                      transition: "all 0.2s"
                    }}
                  >
                    Active ({activeTrips.length})
                  </button>
                  <button 
                    onClick={() => setActiveTab("past")}
                    style={{
                      padding: "6px 16px",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                      border: "none",
                      cursor: "pointer",
                      background: activeTab === "past" ? "var(--primary)" : "transparent",
                      color: activeTab === "past" ? "#000" : "var(--text-muted)",
                      transition: "all 0.2s"
                    }}
                  >
                    Past ({pastTrips.length})
                  </button>
                </div>
              </div>
              
              {loadingBookings ? (
                <SkeletonLoader />
              ) : displayedBookings.length === 0 ? (
                <div className="no-bookings-card" style={{ background: "var(--bg-white)", border: "1px solid var(--border)" }}>
                  <i className="fa-solid fa-car-tunnel" style={{ color: "var(--primary)" }}></i>
                  <h3 style={{ color: "var(--dark)" }}>No bookings found</h3>
                  <p style={{ color: "var(--text-muted)" }}>There are no car reservations in this category. Ready to start driving?</p>
                  <Link to="/" className="book-btn-link">Book a Car Now</Link>
                </div>
              ) : (
                <div className="bookings-list">
                  {displayedBookings.map((booking) => {
                    const isActiveTrip = booking.dropoff_date >= todayStr;
                    return (
                      <div key={booking.id} className="booking-card" style={{ background: "var(--bg-white)", border: "1px solid var(--border)", transition: "all 0.3s" }}>
                        <div className="booking-card-header" style={{ borderBottom: "1px solid var(--border)" }}>
                          <div className="car-info">
                            <h4 style={{ color: "var(--dark)" }}><i className="fa-solid fa-car" style={{ color: "var(--primary)" }}></i> {booking.car_type.toUpperCase()}</h4>
                            <span className="booking-id" style={{ color: "var(--text-muted)" }}>ID: #{booking.id}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span className={`booking-status ${isActiveTrip ? "status-confirmed" : "status-completed"}`} style={{ padding: "4px 12px", borderRadius: "50px", fontSize: "0.75rem", fontWeight: "bold", background: isActiveTrip ? "#e8f5f3" : "#f1f3f5", color: isActiveTrip ? "#2a9d8f" : "#6c757d" }}>
                              {isActiveTrip ? "Upcoming/Active" : "Completed"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="booking-card-body">
                          <div className="trip-route">
                            <div className="route-stop">
                              <span className="dot dot-pickup"></span>
                              <div>
                                <h5 style={{ color: "var(--dark)" }}>Pick-Up</h5>
                                <p style={{ color: "var(--dark)" }}>{booking.pickup_location}</p>
                                <small style={{ color: "var(--text-muted)" }}>{booking.pickup_date} at {booking.pickup_time}</small>
                              </div>
                            </div>
                            <div className="route-stop">
                              <span className="dot dot-dropoff"></span>
                              <div>
                                <h5 style={{ color: "var(--dark)" }}>Drop-Off</h5>
                                <p style={{ color: "var(--dark)" }}>{booking.dropoff_location}</p>
                                <small style={{ color: "var(--text-muted)" }}>{booking.dropoff_date} at {booking.dropoff_time}</small>
                              </div>
                            </div>
                          </div>
 
                          <div className="driver-details" style={{ borderTop: "1px dashed var(--border)", paddingTop: "15px" }}>
                            <h5 style={{ color: "var(--dark)", marginBottom: "10px" }}>Driver Details</h5>
                            <div className="details-grid">
                              <div>
                                <span style={{ color: "var(--text-muted)" }}>Driver Name:</span>
                                <p style={{ color: "var(--dark)" }}>{booking.name} {booking.last_name}</p>
                              </div>
                              <div>
                                <span style={{ color: "var(--text-muted)" }}>Contact:</span>
                                <p style={{ color: "var(--dark)" }}>{booking.phone} / {booking.email}</p>
                              </div>
                              <div>
                                <span style={{ color: "var(--text-muted)" }}>Age:</span>
                                <p style={{ color: "var(--dark)" }}>{booking.age} yrs</p>
                              </div>
                              <div>
                                <span style={{ color: "var(--text-muted)" }}>Address:</span>
                                <p style={{ color: "var(--dark)" }}>{booking.address}, {booking.city} - {booking.zipcode}</p>
                              </div>
                            </div>
                          </div>

                          {/* Cancellation Button Row */}
                          {isActiveTrip && (
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px", borderTop: "1px solid var(--border)", paddingTop: "15px" }}>
                              <button
                                onClick={() => setCancellingId(booking.id)}
                                style={{
                                  background: "transparent",
                                  color: "#ef4444",
                                  border: "1px solid #fecaca",
                                  padding: "8px 20px",
                                  borderRadius: "6px",
                                  fontSize: "0.85rem",
                                  fontWeight: "bold",
                                  cursor: "pointer",
                                  transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = "#fee2e2";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = "transparent";
                                }}
                              >
                                <i className="fa-solid fa-trash-can"></i> Cancel Reservation
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cancellation Confirmation Dialog */}
        {cancellingId && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            zIndex: 1000
          }}
          onClick={() => setCancellingId(null)}
          >
            <div 
              style={{
                background: "var(--white)",
                borderRadius: "15px",
                border: "1px solid var(--border)",
                maxWidth: "450px",
                width: "100%",
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                padding: "25px",
                textAlign: "center"
              }}
              onClick={e => e.stopPropagation()}
            >
              <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: "3rem", color: "#ef4444", marginBottom: "15px" }}></i>
              <h3 style={{ fontSize: "1.3rem", fontWeight: "bold", color: "var(--dark)", margin: "0 0 10px 0" }}>Cancel Reservation?</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: "1.5", margin: "0 0 20px 0" }}>
                Are you sure you want to cancel reservation <strong>#{cancellingId}</strong>? This action will immediately release the vehicle. A confirmation notice will be sent to your email.
              </p>

              {cancellingError && (
                <p style={{ color: "#ef4444", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "15px" }}>
                  <i className="fa-solid fa-circle-exclamation"></i> {cancellingError}
                </p>
              )}

              <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
                <button
                  onClick={() => handleCancelBooking(cancellingId)}
                  disabled={isSubmittingCancellation}
                  style={{
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    padding: "10px 24px",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  {isSubmittingCancellation ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Cancelling...
                    </>
                  ) : (
                    "Yes, Cancel Booking"
                  )}
                </button>
                <button
                  onClick={() => setCancellingId(null)}
                  disabled={isSubmittingCancellation}
                  style={{
                    background: "var(--off-white)",
                    color: "var(--dark)",
                    border: "1px solid var(--border)",
                    padding: "10px 24px",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                >
                  No, Keep Booking
                </button>
              </div>
            </div>
          </div>
        )}
        
        <Footer />
      </section>
    </>
  );
}

export default Profile;
