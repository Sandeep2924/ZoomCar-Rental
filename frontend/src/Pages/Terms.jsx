import React from "react";
import Footer from "../components/Footer";
import HeroPages from "../components/HeroPages";

function Terms() {
  return (
    <>
      <section className="terms-page" style={{ background: "#fcfcfc" }}>
        <HeroPages name="Terms & Conditions" />
        
        <div className="container" style={{ padding: "80px 20px" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto", backgroundColor: "white", padding: "40px", borderRadius: "15px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #f0f0f0", lineHeight: "1.6" }}>
            
            <h2 style={{ fontSize: "1.8rem", color: "#111", marginBottom: "20px", fontWeight: "700" }}>ZoomCarz Rental Agreement</h2>
            <p style={{ color: "#666", marginBottom: "30px" }}>Last updated: June 2026. Please read these terms carefully before booking a vehicle with ZoomCarz.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "25px", color: "#444" }}>
              
              <div>
                <h4 style={{ fontSize: "1.1rem", color: "#ff4d30", marginBottom: "10px", fontWeight: "700" }}>1. Rental Requirements & Driving License</h4>
                <p>To rent a vehicle, the driver must be at least 18 years of age and possess a valid, unexpired government-issued driving license. Digital copies or printouts of driving licenses must be presented during vehicle pick-up for verification.</p>
              </div>

              <div>
                <h4 style={{ fontSize: "1.1rem", color: "#ff4d30", marginBottom: "10px", fontWeight: "700" }}>2. Fuel & Speed Limits</h4>
                <p>Vehicles are provided with a full tank of fuel and should be returned with a full tank. Refueling charges will apply if returned with less fuel. To ensure safety, a maximum speed limit of 100 km/h is enforced. Violations will trigger alert penalties.</p>
              </div>

              <div>
                <h4 style={{ fontSize: "1.1rem", color: "#ff4d30", marginBottom: "10px", fontWeight: "700" }}>3. Booking & Cancellation Policy</h4>
                <p>Reservations can be modified or cancelled free of charge up to 24 hours prior to the scheduled pick-up time. Cancellations made less than 24 hours in advance will incur a service fee equal to one day's rental charge.</p>
              </div>

              <div>
                <h4 style={{ fontSize: "1.1rem", color: "#ff4d30", marginBottom: "10px", fontWeight: "700" }}>4. Security Deposit & Payments</h4>
                <p>A refundable security deposit of ₹5,000 is blocked on the primary driver's card at the time of booking. The deposit is fully refunded within 48-72 working hours after the vehicle is returned without any damages or pending traffic violations.</p>
              </div>

              <div>
                <h4 style={{ fontSize: "1.1rem", color: "#ff4d30", marginBottom: "10px", fontWeight: "700" }}>5. Liability & Insurance</h4>
                <p>All vehicles are fully insured. However, in the event of an accident, the renter's maximum liability is limited to the security deposit amount, provided they were not driving under the influence or in violation of national traffic laws.</p>
              </div>

            </div>
          </div>
        </div>
        
        <Footer />
      </section>
    </>
  );
}

export default Terms;
