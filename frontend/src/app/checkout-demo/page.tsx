"use client";

import Link from "next/link";

export default function CheckoutDemoPage() {
  return (
    <main>
      <section className="z-index-common breadcumb-wrapper" style={{ 
        backgroundImage: "url('https://img.freepik.com/free-photo/pot-with-young-monstera-with-deep-cuts-droplets-water-after-spraying-tropical-liana-dark-background-growing-tropical-plants-home-office_166373-9133.jpg?semt=ais_hybrid&w=740&q=80')", 
        backgroundSize: "cover", 
        backgroundPosition: "center" 
      }}>
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Order Confirmed - Demo</h1>
          </div>
        </div>
      </section>

      <section className="space space-extra-bottom" style={{ background: "linear-gradient(180deg, #f8fef5 0%, #ffffff 100%)" }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-xl-7 col-12">
              {/* Success Card Container */}
              <div style={{
                background: "#ffffff",
                borderRadius: "20px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                textAlign: "center",
                border: "1px solid #e8f5e3",
                margin: "0 12px"
              }}>
                
                {/* Payment Success Banner */}
                <div style={{
                  background: "linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)",
                  border: "2px solid #28a745",
                  borderRadius: "12px",
                  padding: "clamp(16px, 4vw, 20px) clamp(16px, 4vw, 25px)",
                  marginBottom: "clamp(24px, 5vw, 35px)",
                  textAlign: "left",
                  boxShadow: "0 4px 12px rgba(40, 167, 69, 0.15)"
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(12px, 3vw, 15px)', flexWrap: 'wrap' }}>
                    <div style={{
                      width: "clamp(45px, 10vw, 50px)",
                      height: "clamp(45px, 10vw, 50px)",
                      borderRadius: "50%",
                      background: "#28a745",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 4px 12px rgba(40, 167, 69, 0.3)"
                    }}>
                      <i 
                        className="fal fa-check" 
                        style={{ fontSize: 'clamp(18px, 4vw, 24px)', color: '#ffffff' }}
                      ></i>
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <h4 style={{ 
                        color: '#155724', 
                        margin: '0 0 5px 0',
                        fontSize: 'clamp(16px, 4vw, 18px)',
                        fontWeight: '700'
                      }}>
                        Payment Received Successfully!
                      </h4>
                      <p style={{ color: '#155724', margin: 0, fontSize: 'clamp(12px, 2.5vw, 14px)', opacity: 0.9 }}>
                        Your payment has been processed and confirmed by our payment gateway.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Success Icon */}
                <div style={{
                  width: "clamp(70px, 15vw, 100px)",
                  height: "clamp(70px, 15vw, 100px)",
                  margin: "0 auto clamp(20px, 4vw, 25px)",
                  background: "linear-gradient(135deg, #2d5016 0%, #4a7c2e 100%)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 10px 30px rgba(45, 80, 22, 0.25)",
                  animation: "pulse 2s ease-in-out infinite"
                }}>
                  <i
                    className="fal fa-badge-check"
                    style={{ fontSize: "clamp(35px, 8vw, 50px)", color: "#ffffff" }}
                  ></i>
                </div>

                {/* Main Heading */}
                <h2 style={{ 
                  marginBottom: "15px",
                  fontSize: "clamp(24px, 6vw, 32px)",
                  fontWeight: "800",
                  color: "#2d5016",
                  letterSpacing: "-0.5px"
                }}>
                  Thank You for Your Order!
                </h2>

                {/* Subheading */}
                <p style={{ 
                  color: "#6b8e23", 
                  fontSize: "clamp(16px, 4vw, 18px)", 
                  marginBottom: "15px",
                  fontWeight: "500"
                }}>
                  Your order has been placed successfully
                </p>

                {/* Order ID Card */}
                <div style={{
                  background: "linear-gradient(135deg, #f8fef5 0%, #e8f5e3 100%)",
                  border: "2px solid #c3e6cb",
                  borderRadius: "12px",
                  padding: "clamp(16px, 4vw, 20px)",
                  margin: "clamp(16px, 4vw, 25px) auto",
                  display: "inline-block",
                  minWidth: "clamp(250px, 90%, 300px)"
                }}>
                  <p style={{ 
                    fontSize: "clamp(12px, 3vw, 14px)", 
                    color: "#6b8e23", 
                    margin: "0 0 8px 0",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    fontWeight: "600"
                  }}>
                    Order ID
                  </p>
                  <p style={{ 
                    fontSize: "clamp(18px, 5vw, 24px)", 
                    fontWeight: "800", 
                    margin: 0,
                    color: "#2d5016",
                    fontFamily: "monospace",
                    letterSpacing: "1px",
                    wordBreak: "break-all"
                  }}>
                    ORD-1790146604014
                  </p>
                </div>

                {/* Transaction IDs Section */}
                <div style={{
                  background: "linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%)",
                  border: "2px solid #b8daff",
                  borderRadius: "12px",
                  padding: "clamp(16px, 4vw, 20px)",
                  margin: "clamp(16px, 4vw, 20px) auto",
                  textAlign: "left",
                  maxWidth: "100%",
                  width: "clamp(250px, 95%, 500px)"
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "15px",
                    justifyContent:'center'
                  }}>
                    <i className="fal fa-receipt" style={{ color: "#0056b3", fontSize: "18px" }}></i>
                    <h4 style={{ 
                      color: "#0056b3", 
                      margin: 0,
                      fontSize: "clamp(14px, 3.5vw, 16px)",
                      fontWeight: "700"
                    }}>
                      Payment Transaction Details
                    </h4>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    flexDirection:'column'      
                    }}>
                      <span style={{ 
                        fontSize: "clamp(11px, 2.5vw, 13px)", 
                        color: "#555", 
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>
                        Merchant Transaction ID:
                      </span>
                      <span style={{ 
                        fontSize: "clamp(12px, 3vw, 14px)", 
                        fontWeight: "700", 
                        color: "#0056b3",
                        fontFamily: "monospace",
                        background: "#ffffff",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        border: "1px solid #b8daff",
                        marginTop: "4px",
                        wordBreak: "break-all"
                      }}>
                        NURSERY_7_mudr2g5m
                      </span>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" ,
                    flexDirection:'column' }}>
                      <span style={{ 
                        fontSize: "clamp(11px, 2.5vw, 13px)", 
                        color: "#555", 
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>
                        Atom Transaction ID:
                      </span>
                      <span style={{ 
                        fontSize: "clamp(12px, 3vw, 14px)", 
                        fontWeight: "700", 
                        color: "#0056b3",
                        fontFamily: "monospace",
                        background: "#ffffff",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        border: "1px solid #b8daff",
                        marginTop: "4px",
                        wordBreak: "break-all"
                      }}>
                        11000384171808
                      </span>
                    </div>
                  </div>

                  <div style={{
                    marginTop: "12px",
                    padding: "10px 12px",
                    background: "#ffffff",
                    borderRadius: "6px",
                    border: "1px solid #b8daff",
                    fontSize: "clamp(10px, 2.5vw, 11px)",
                    color: "#666",
                    textAlign: "center"
                  }}>
                    <i className="fal fa-info-circle" style={{ marginRight: "6px", color: "#0056b3" }}></i>
                    Keep these transaction IDs for your records and future reference
                  </div>
                </div>

                {/* Description */}
                <p style={{ 
                  color: "#666", 
                  fontSize: "clamp(13px, 3vw, 15px)",
                  lineHeight: "1.8",
                  margin: "30px auto",
                  maxWidth: "500px"
                }}>
                  We have received your order and are preparing your plants/seeds for shipment. 
                  A confirmation email has been sent, and our team will get in touch with you shortly.
                </p>

                {/* Divider */}
                <div style={{
                  height: "1px",
                  background: 
                  "linear-gradient(90deg, transparent 0%, #c3e6cb 50%, transparent 100%)",
                  margin: "35px 0"
                }}></div>

                {/* Action Buttons */}
                <div style={{
                  display: "flex",
                  gap: "clamp(8px, 3vw, 15px)",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginTop: "30px"
                }}>
                  <Link 
                    href="/products" 
                    className="vs-btn"
                    style={{
                      background: "linear-gradient(135deg, #2d5016 0%, #4a7c2e 100%)",
                      border: "none",
                      padding: "clamp(12px, 3vw, 14px) clamp(20px, 4vw, 30px)",
                      fontSize: "clamp(13px, 3vw, 15px)",
                      fontWeight: "600",
                      boxShadow: "0 4px 15px rgba(45, 80, 22, 0.3)",
                      transition: "all 0.3s ease",
                      whiteSpace: "nowrap",
                      color: "#ffffff",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <i className="fal fa-box-check" style={{ marginRight: "8px" }}></i>
                    Track Order
                  </Link>
                  <Link 
                    href="/products" 
                    className="vs-btn style2"
                    style={{
                      padding: "clamp(12px, 3vw, 14px) clamp(20px, 4vw, 30px)",
                      fontSize: "clamp(13px, 3vw, 15px)",
                      fontWeight: "600",
                      whiteSpace: "nowrap",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <i className="fal fa-shopping-bag" style={{ marginRight: "8px" }}></i>
                    Continue Shopping
                  </Link>
                </div>

                {/* Support Info */}
                <div style={{
                  marginTop: "40px",
                  padding: "clamp(16px, 4vw, 20px)",
                  background: "#f8f9fa",
                  borderRadius: "10px",
                  textAlign: "left"
                }}>
                  <p style={{
                    fontSize: "clamp(12px, 2.5vw, 13px)",
                    color: "#666",
                    margin: "0 0 10px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <i className="fal fa-info-circle" style={{ color: "#6b8e23" }}></i>
                    <strong>Need Help?</strong>
                  </p>
                  <p style={{
                    fontSize: "clamp(12px, 2.5vw, 13px)",
                    color: "#666",
                    margin: 0,
                    lineHeight: "1.6"
                  }}>
                    If you have any questions about your order, please contact our support team at{" "}
                    <a href="tel:+918085263020" style={{ color: "#2d5016", fontWeight: "600", textDecoration: "none" }}>
                      +91 8085263020
                    </a>
                    {" "}or email us.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Add CSS animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 10px 30px rgba(45, 80, 22, 0.25);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 15px 40px rgba(45, 80, 22, 0.35);
          }
        }
      `}</style>
    </main>
  );
}
