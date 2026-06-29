import React, { useState } from "react";
import Footer from "../components/Footer";
import HeroPages from "../components/HeroPages";
import { Link } from "react-router-dom";
import { CAR_DATA } from "../components/CarData";

// Process and enrich car data dynamically
const cars = CAR_DATA.map((subArray) => {
  const car = subArray[0];
  const nameLower = car.name.toLowerCase();
  
  // Dynamic categorization
  let category = "Sedan";
  if (nameLower.includes("xuv") || nameLower.includes("fortuner")) {
    category = "SUV";
  } else if (nameLower.includes("swift") || nameLower.includes("i10")) {
    category = "Hatchback";
  }

  return {
    name: car.name,
    image: car.img,
    price: parseInt(car.price.toString().replace(/,/g, "")) || 0,
    brand: car.mark,
    seats: car.doors, // mapped from doors
    transmission: car.transmission,
    fuel: car.fuel,
    year: car.year,
    air: car.air,
    category
  };
});

const CATEGORIES = ["All", "SUV", "Sedan", "Hatchback"];

function Models() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Filter cars based on selected tab
  const filteredCars = selectedCategory === "All"
    ? cars
    : cars.filter(c => c.category === selectedCategory);

  // Handle vehicle comparison checkbox toggling
  const handleCompareToggle = (car) => {
    if (compareList.some(c => c.name === car.name)) {
      setCompareList(compareList.filter(c => c.name !== car.name));
    } else {
      if (compareList.length >= 2) {
        alert("You can compare a maximum of 2 cars at a time.");
        return;
      }
      setCompareList([...compareList, car]);
    }
  };

  return (
    <>
      <section className="models-page-section" style={{ background: "var(--white)", transition: "background var(--transition-base)" }}>
        <HeroPages name="Vehicle Models" />
        
        <div className="container" style={{ padding: "60px 20px" }}>
          
          {/* Category Tabs */}
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap", marginBottom: "40px" }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "10px 24px",
                  borderRadius: "50px",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  background: selectedCategory === cat ? "var(--primary)" : "var(--off-white)",
                  color: selectedCategory === cat ? "#000" : "var(--dark)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: selectedCategory === cat ? "var(--shadow-gold)" : "none"
                }}
              >
                {cat} Cars
              </button>
            ))}
          </div>

          {/* Cars List Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "30px",
            marginBottom: "50px"
          }}>
            {filteredCars.map((car, idx) => {
              const isCompared = compareList.some(c => c.name === car.name);
              return (
                <div 
                  key={idx}
                  style={{
                    background: "var(--bg-white)",
                    borderRadius: "15px",
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-md)",
                    transition: "all 0.3s ease",
                    display: "flex",
                    flexDirection: "column"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  }}
                >
                  {/* Car Image Area */}
                  <div style={{
                    background: "var(--off-white)",
                    padding: "30px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "220px",
                    position: "relative"
                  }}>
                    <img 
                      src={car.image} 
                      alt={car.name} 
                      style={{ maxHeight: "140px", objectFit: "contain", filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.15))" }}
                    />
                    {/* Compare Checkbox Chip */}
                    <label style={{
                      position: "absolute",
                      top: "15px",
                      right: "15px",
                      background: isCompared ? "var(--primary)" : "rgba(255,255,255,0.85)",
                      color: isCompared ? "#000" : "#666",
                      padding: "5px 12px",
                      borderRadius: "50px",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                      border: "1px solid var(--border)",
                      transition: "all 0.2s"
                    }}>
                      <input 
                        type="checkbox" 
                        checked={isCompared}
                        onChange={() => handleCompareToggle(car)}
                        style={{ cursor: "pointer", accentColor: "var(--primary-dark)" }}
                      />
                      Compare
                    </label>
                  </div>

                  {/* Car Description Details */}
                  <div style={{ padding: "24px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
                      <div>
                        <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--dark)", margin: 0 }}>{car.name}</h3>
                        <span style={{ display: "flex", gap: "2px", color: "var(--primary)", fontSize: "0.75rem", marginTop: "4px" }}>
                          {[...Array(5)].map((_, i) => <i key={i} className="fa-solid fa-star"></i>)}
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <h4 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#ff4d30", margin: 0 }}>₹{car.price.toLocaleString()}</h4>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>per day</span>
                      </div>
                    </div>

                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                      marginBottom: "20px"
                    }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><i className="fa-solid fa-car-side" style={{ color: "var(--primary)" }}></i> {car.brand}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}><i className="fa-solid fa-circle" style={{ color: "var(--primary)", fontSize: "6px" }}></i> {car.seats} Seats</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><i className="fa-solid fa-cogs" style={{ color: "var(--primary)" }}></i> {car.transmission}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}><i className="fa-solid fa-gas-pump" style={{ color: "var(--primary)" }}></i> {car.fuel}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><i className="fa-solid fa-calendar-days" style={{ color: "var(--primary)" }}></i> Year: {car.year}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}><i className="fa-solid fa-snowflake" style={{ color: "var(--primary)" }}></i> AC: {car.air}</span>
                    </div>

                    <div style={{ marginTop: "auto" }}>
                      <Link 
                        to="/"
                        onClick={() => window.scrollTo({ top: 400, behavior: "smooth" })}
                        style={{
                          display: "block",
                          textAlign: "center",
                          background: "var(--cta-bg)",
                          color: "var(--cta-text)",
                          borderRadius: "8px",
                          fontSize: "0.9rem",
                          fontWeight: "bold",
                          padding: "12px",
                          transition: "all 0.25s",
                          boxShadow: "var(--shadow-sm)"
                        }}
                      >
                        Book Ride
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Floating Compare Action Bar */}
        {compareList.length > 0 && (
          <div style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(15,15,19,0.92)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "15px",
            padding: "12px 24px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            gap: "20px",
            zIndex: 999
          }}>
            <span style={{ color: "white", fontSize: "0.85rem", fontWeight: "600" }}>
              📊 Compare Vehicles ({compareList.length}/2)
            </span>
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                onClick={() => {
                  if (compareList.length < 2) {
                    alert("Please select 2 cars to compare.");
                    return;
                  }
                  setShowCompareModal(true);
                }}
                disabled={compareList.length < 2}
                style={{
                  background: compareList.length === 2 ? "var(--primary)" : "#666",
                  color: "#000",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  fontSize: "0.85rem",
                  cursor: compareList.length === 2 ? "pointer" : "not-allowed",
                  transition: "all 0.3s"
                }}
              >
                Compare Specs
              </button>
              <button 
                onClick={() => setCompareList([])}
                style={{
                  background: "transparent",
                  color: "rgba(255,255,255,0.6)",
                  border: "none",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  textDecoration: "underline"
                }}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Compare Specs Dialog Modal */}
        {showCompareModal && compareList.length === 2 && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(12px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            zIndex: 1000
          }}
          onClick={() => setShowCompareModal(false)}
          >
            <div 
              style={{
                background: "var(--white)",
                borderRadius: "20px",
                border: "1px solid var(--border)",
                maxWidth: "750px",
                width: "100%",
                boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
                overflow: "hidden"
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Title Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", background: "var(--dark)", color: "#fff" }}>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "bold" }}>📊 Vehicle Comparison Specs</h3>
                <i 
                  className="fa-solid fa-xmark" 
                  style={{ cursor: "pointer", fontSize: "1.3rem", opacity: 0.7 }}
                  onClick={() => setShowCompareModal(false)}
                ></i>
              </div>

              {/* Table Data */}
              <div style={{ padding: "25px", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--dark)", fontSize: "0.95rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2.5px solid var(--border)" }}>
                      <th style={{ padding: "12px", textAlign: "left", width: "30%" }}>Feature</th>
                      <th style={{ padding: "12px", textAlign: "center", width: "35%", fontWeight: "bold", color: "#ff4d30" }}>{compareList[0].name}</th>
                      <th style={{ padding: "12px", textAlign: "center", width: "35%", fontWeight: "bold", color: "#ff4d30" }}>{compareList[1].name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px", fontWeight: "bold" }}>Preview</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <img src={compareList[0].image} alt="" style={{ maxHeight: "80px", objectFit: "contain", margin: "auto" }} />
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <img src={compareList[1].image} alt="" style={{ maxHeight: "80px", objectFit: "contain", margin: "auto" }} />
                      </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px", fontWeight: "bold" }}>Daily Rate</td>
                      <td style={{ padding: "12px", textAlign: "center", fontWeight: "bold" }}>₹{compareList[0].price.toLocaleString()}</td>
                      <td style={{ padding: "12px", textAlign: "center", fontWeight: "bold" }}>₹{compareList[1].price.toLocaleString()}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px", fontWeight: "bold" }}>Brand</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{compareList[0].brand}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{compareList[1].brand}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px", fontWeight: "bold" }}>Category</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{compareList[0].category}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{compareList[1].category}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px", fontWeight: "bold" }}>Seats</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{compareList[0].seats}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{compareList[1].seats}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px", fontWeight: "bold" }}>Transmission</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{compareList[0].transmission}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{compareList[1].transmission}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px", fontWeight: "bold" }}>Fuel</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{compareList[0].fuel}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{compareList[1].fuel}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px", fontWeight: "bold" }}>Air Conditioning</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{compareList[0].air}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{compareList[1].air}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px", fontWeight: "bold" }}>Year</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{compareList[0].year}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{compareList[1].year}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Close Button Footer */}
              <div style={{ display: "flex", justifyContent: "flex-end", padding: "15px 25px", borderTop: "1px solid var(--border)" }}>
                <button 
                  onClick={() => setShowCompareModal(false)}
                  style={{
                    background: "var(--primary)",
                    color: "#000",
                    padding: "10px 24px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    cursor: "pointer"
                  }}
                >
                  Close Comparison
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Call Banner */}
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

export default Models;
