import React from "react";

const SkeletonLoader = () => {
  return (
    <div className="skeleton-container" style={{ width: "100%" }}>
      <style>{`
        @keyframes skeleton-pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        .skeleton-pulse {
          animation: skeleton-pulse 1.5s infinite ease-in-out;
          background-color: #eceff1;
          border-radius: 4px;
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="skeleton-pulse"
            style={{
              background: "white",
              borderRadius: "15px",
              border: "1px solid #eee",
              padding: "25px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.01)",
            }}
          >
            {/* Header placeholder */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="skeleton-pulse" style={{ width: "30px", height: "30px", borderRadius: "50%" }}></div>
                <div className="skeleton-pulse" style={{ width: "150px", height: "20px" }}></div>
              </div>
              <div className="skeleton-pulse" style={{ width: "80px", height: "25px", borderRadius: "20px" }}></div>
            </div>

            {/* Route placeholder */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", paddingBottom: "20px", borderBottom: "1px dashed #eee", marginBottom: "20px" }}>
              <div style={{ display: "flex", gap: "15px" }}>
                <div className="skeleton-pulse" style={{ width: "12px", height: "12px", borderRadius: "50%", marginTop: "6px" }}></div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "80%" }}>
                  <div className="skeleton-pulse" style={{ width: "60px", height: "12px" }}></div>
                  <div className="skeleton-pulse" style={{ width: "100%", height: "18px" }}></div>
                  <div className="skeleton-pulse" style={{ width: "120px", height: "14px" }}></div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "15px" }}>
                <div className="skeleton-pulse" style={{ width: "12px", height: "12px", borderRadius: "50%", marginTop: "6px" }}></div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "80%" }}>
                  <div className="skeleton-pulse" style={{ width: "60px", height: "12px" }}></div>
                  <div className="skeleton-pulse" style={{ width: "100%", height: "18px" }}></div>
                  <div className="skeleton-pulse" style={{ width: "120px", height: "14px" }}></div>
                </div>
              </div>
            </div>

            {/* Details placeholder */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="skeleton-pulse" style={{ width: "100px", height: "14px" }}></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "15px" }}>
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div className="skeleton-pulse" style={{ width: "80px", height: "10px" }}></div>
                    <div className="skeleton-pulse" style={{ width: "100%", height: "14px" }}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonLoader;
