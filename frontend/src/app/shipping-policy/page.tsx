"use client";

export default function ShippingPolicyPage() {
  return (
    <div className="main-content">
      {/* Page Header */}
      <div className="breadcumb-wrapper" style={{ 
        backgroundImage: "url('https://t3.ftcdn.net/jpg/04/36/00/20/360_F_436002013_xpV04ylL6uUOcNeGsPzBIQEIRkIFQlQD.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}>
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Shipping Policy</h1>
            <ul className="breadcumb-menu">
              <li><a href="/">Home</a></li>
              <li>Shipping Policy</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Shipping Policy Content */}
      <section className="space">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="policy-content" style={{ 
                background: "#fff",
                padding: "50px",
                borderRadius: "10px",
                boxShadow: "0 5px 20px rgba(0,0,0,0.08)"
              }}>
                
                <div className="policy-section" style={{ marginBottom: "40px" }}>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", marginBottom: "30px" }}>
                    <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    At Awantika Seeds, we take special care in packaging and shipping live plants, seeds, and gardening supplies. 
                    This Shipping Policy provides detailed information about our shipping methods, costs, delivery times, and procedures.
                  </p>
                </div>

                <div className="policy-section" style={{ marginBottom: "40px" }}>
                  <h2 style={{ 
                    color: "var(--brand)", 
                    fontSize: "28px", 
                    marginBottom: "20px",
                    borderBottom: "2px solid var(--brand)",
                    paddingBottom: "10px"
                  }}>
                    1. Shipping Coverage
                  </h2>
                  
                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    Domestic Shipping (India):
                  </h3>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    We currently ship to all states and union territories within India. Some remote areas may have extended delivery times.
                  </p>

                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    International Shipping:
                  </h3>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    We do not currently offer international shipping due to agricultural and customs regulations for live plants and seeds.
                  </p>
                </div>

                <div className="policy-section" style={{ marginBottom: "40px" }}>
                  <h2 style={{ 
                    color: "var(--brand)", 
                    fontSize: "28px", 
                    marginBottom: "20px",
                    borderBottom: "2px solid var(--brand)",
                    paddingBottom: "10px"
                  }}>
                    2. Processing Time
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    Order processing time varies by product type:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li><strong>Seeds & Accessories:</strong> 1-2 business days</li>
                    <li><strong>Potted Plants:</strong> 2-4 business days (we prepare plants for safe shipping)</li>
                    <li><strong>Large Plants/Trees:</strong> 3-5 business days (require special packaging)</li>
                    <li><strong>Custom Orders:</strong> 5-7 business days or as communicated</li>
                  </ul>
                  <div style={{ 
                    background: "#e3f2fd", 
                    padding: "20px", 
                    borderRadius: "8px", 
                    marginTop: "20px",
                    borderLeft: "4px solid #2196f3"
                  }}>
                    <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#0d47a1", margin: 0 }}>
                      <strong>ℹ️ Note:</strong> Orders placed on weekends or holidays will be processed on the next business day. 
                      You will receive a shipping confirmation email with tracking information once your order ships.
                    </p>
                  </div>
                </div>

                <div className="policy-section" style={{ marginBottom: "40px" }}>
                  <h2 style={{ 
                    color: "var(--brand)", 
                    fontSize: "28px", 
                    marginBottom: "20px",
                    borderBottom: "2px solid var(--brand)",
                    paddingBottom: "10px"
                  }}>
                    3. Delivery Time
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", marginBottom: "15px" }}>
                    Once shipped, estimated delivery times are:
                  </p>
                  
                  <div style={{ marginTop: "20px" }}>
                    <table style={{ 
                      width: "100%", 
                      borderCollapse: "collapse",
                      fontSize: "16px"
                    }}>
                      <thead>
                        <tr style={{ background: "var(--brand)", color: "#fff" }}>
                          <th style={{ padding: "15px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Location</th>
                          <th style={{ padding: "15px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Standard Shipping</th>
                          <th style={{ padding: "15px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Express Shipping</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ background: "#f9f9f9" }}>
                          <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>Madhya Pradesh (Local)</td>
                          <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>2-4 business days</td>
                          <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>1-2 business days</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>Metro Cities</td>
                          <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>3-5 business days</td>
                          <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>2-3 business days</td>
                        </tr>
                        <tr style={{ background: "#f9f9f9" }}>
                          <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>Other Cities</td>
                          <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>5-7 business days</td>
                          <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>3-4 business days</td>
                        </tr>
                        <tr>
                          <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>Remote Areas</td>
                          <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>7-10 business days</td>
                          <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>5-7 business days</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#999", marginTop: "15px", fontStyle: "italic" }}>
                    * Delivery times are estimates and may vary due to weather conditions, courier delays, or unforeseen circumstances.
                  </p>
                </div>

                <div className="policy-section" style={{ marginBottom: "40px" }}>
                  <h2 style={{ 
                    color: "var(--brand)", 
                    fontSize: "28px", 
                    marginBottom: "20px",
                    borderBottom: "2px solid var(--brand)",
                    paddingBottom: "10px"
                  }}>
                    4. Shipping Costs
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", marginBottom: "15px" }}>
                    Shipping charges are calculated based on:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px" }}>
                    <li>Total order weight</li>
                    <li>Package dimensions (especially for large plants)</li>
                    <li>Delivery location (zone-based pricing)</li>
                    <li>Shipping method selected (Standard or Express)</li>
                  </ul>
                  
                  <div style={{ 
                    background: "#e8f5e9", 
                    padding: "25px", 
                    borderRadius: "8px", 
                    marginTop: "25px",
                    border: "1px solid #c8e6c9"
                  }}>
                    <h3 style={{ color: "#2d5016", fontSize: "20px", marginBottom: "15px" }}>🎉 Free Shipping Offers:</h3>
                    <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginBottom: 0 }}>
                      <li><strong>Orders above ₹999:</strong> Free standard shipping to all locations</li>
                      <li><strong>Orders above ₹2,499:</strong> Free express shipping to metro cities</li>
                      <li><strong>First Order:</strong> Get free shipping with code <strong>FIRST50</strong> (min. order ₹500)</li>
                    </ul>
                  </div>
                  
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", marginTop: "20px" }}>
                    Exact shipping costs will be calculated and displayed at checkout before you complete your purchase.
                  </p>
                </div>

                <div className="policy-section" style={{ marginBottom: "40px" }}>
                  <h2 style={{ 
                    color: "var(--brand)", 
                    fontSize: "28px", 
                    marginBottom: "20px",
                    borderBottom: "2px solid var(--brand)",
                    paddingBottom: "10px"
                  }}>
                    5. Packaging Standards
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", marginBottom: "15px" }}>
                    We take special care to ensure your plants arrive healthy and intact:
                  </p>

                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    🌿 Live Plants:
                  </h3>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px" }}>
                    <li>Plants are secured in sturdy pots with protective wrapping</li>
                    <li>Foliage is carefully protected with breathable material</li>
                    <li>Boxes include ventilation holes for air circulation</li>
                    <li>Moisture-retaining materials keep soil from drying out</li>
                    <li>Fragile stickers and "This Side Up" labels on all packages</li>
                    <li>Care instructions included with every plant</li>
                  </ul>

                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    🌾 Seeds:
                  </h3>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px" }}>
                    <li>Sealed in moisture-proof packets</li>
                    <li>Protected from crushing with padded envelopes or boxes</li>
                    <li>Labeled with variety, quantity, and sowing instructions</li>
                  </ul>

                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    🛠️ Supplies & Accessories:
                  </h3>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px" }}>
                    <li>Wrapped securely to prevent damage</li>
                    <li>Fragile items padded with bubble wrap or foam</li>
                  </ul>
                </div>

                <div className="policy-section" style={{ marginBottom: "40px" }}>
                  <h2 style={{ 
                    color: "var(--brand)", 
                    fontSize: "28px", 
                    marginBottom: "20px",
                    borderBottom: "2px solid var(--brand)",
                    paddingBottom: "10px"
                  }}>
                    6. Order Tracking
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    Once your order ships, you will receive:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li><strong>Shipping Confirmation Email:</strong> With tracking number and courier details</li>
                    <li><strong>SMS Updates:</strong> Real-time delivery status notifications</li>
                    <li><strong>Track Online:</strong> Use the tracking number on the courier's website</li>
                    <li><strong>Account Dashboard:</strong> View order status in your Awantika Seeds account</li>
                  </ul>
                </div>

                <div className="policy-section" style={{ marginBottom: "40px" }}>
                  <h2 style={{ 
                    color: "var(--brand)", 
                    fontSize: "28px", 
                    marginBottom: "20px",
                    borderBottom: "2px solid var(--brand)",
                    paddingBottom: "10px"
                  }}>
                    7. Delivery Procedures
                  </h2>
                  
                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    Standard Delivery:
                  </h3>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px" }}>
                    <li>Delivery is made to the address provided during checkout</li>
                    <li>Signature may be required for delivery confirmation</li>
                    <li>If you're not home, courier will attempt redelivery or leave a notice</li>
                    <li>Contact the courier directly to reschedule delivery</li>
                  </ul>

                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    What to Do Upon Delivery:
                  </h3>
                  <ol style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px" }}>
                    <li><strong>Inspect the Package:</strong> Check for any visible damage before accepting</li>
                    <li><strong>Document Issues:</strong> Take photos if the package appears damaged</li>
                    <li><strong>Unbox Immediately:</strong> Especially important for live plants</li>
                    <li><strong>Report Problems:</strong> Contact us within 48 hours if there are any issues</li>
                  </ol>

                  <div style={{ 
                    background: "#fff3cd", 
                    padding: "20px", 
                    borderRadius: "8px", 
                    marginTop: "20px",
                    borderLeft: "4px solid #ffc107"
                  }}>
                    <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#856404", margin: 0 }}>
                      <strong>⚠️ Important for Plant Orders:</strong> Plants are living organisms and need immediate attention upon arrival. 
                      Unbox them as soon as possible and follow the included care instructions. Delays in unboxing may affect plant health.
                    </p>
                  </div>
                </div>

                <div className="policy-section" style={{ marginBottom: "40px" }}>
                  <h2 style={{ 
                    color: "var(--brand)", 
                    fontSize: "28px", 
                    marginBottom: "20px",
                    borderBottom: "2px solid var(--brand)",
                    paddingBottom: "10px"
                  }}>
                    8. Shipping Restrictions
                  </h2>
                  
                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    Weather Conditions:
                  </h3>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    We may delay shipments during extreme weather conditions (very hot summers, heavy monsoons, severe winters) 
                    to protect plant health. You will be notified if your order is affected.
                  </p>

                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    Restricted Items:
                  </h3>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    Certain plant species cannot be shipped to specific states due to agricultural regulations. 
                    We will inform you at checkout if any items cannot be shipped to your location.
                  </p>

                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    PO Boxes and APO/FPO Addresses:
                  </h3>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    Live plants cannot be shipped to PO Boxes. Seeds and accessories can be shipped to PO Boxes with standard shipping only.
                  </p>
                </div>

                <div className="policy-section" style={{ marginBottom: "40px" }}>
                  <h2 style={{ 
                    color: "var(--brand)", 
                    fontSize: "28px", 
                    marginBottom: "20px",
                    borderBottom: "2px solid var(--brand)",
                    paddingBottom: "10px"
                  }}>
                    9. Failed Delivery Attempts
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    If delivery fails due to:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li><strong>Incorrect Address:</strong> Customer is responsible for return shipping costs and reshipment fees</li>
                    <li><strong>Unavailability:</strong> Courier will attempt 2-3 deliveries. Contact them to arrange pickup or redelivery</li>
                    <li><strong>Refused Delivery:</strong> Return shipping costs will be deducted from any refund</li>
                    <li><strong>Unclaimed Packages:</strong> After failed attempts, packages returned to us may incur restocking fees</li>
                  </ul>
                </div>

                <div className="policy-section" style={{ marginBottom: "40px" }}>
                  <h2 style={{ 
                    color: "var(--brand)", 
                    fontSize: "28px", 
                    marginBottom: "20px",
                    borderBottom: "2px solid var(--brand)",
                    paddingBottom: "10px"
                  }}>
                    10. Lost or Damaged Packages
                  </h2>
                  
                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    Lost Packages:
                  </h3>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    If your package is marked as delivered but you haven't received it:
                  </p>
                  <ol style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li>Check with neighbors and building security</li>
                    <li>Verify the delivery address in your order confirmation</li>
                    <li>Wait 24 hours (sometimes tracking updates are delayed)</li>
                    <li>Contact us at NurseryUjjain@gmail.com with your order number</li>
                  </ol>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", marginTop: "15px" }}>
                    We will investigate with the courier and provide a replacement or refund if the package is confirmed lost.
                  </p>

                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    Damaged Packages:
                  </h3>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    If your package arrives damaged:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li>Take photos of the damaged packaging and contents</li>
                    <li>Contact us within 48 hours at manaspathak2107@gmail.com</li>
                    <li>Include your order number and damage photos</li>
                    <li>We will arrange for a replacement or refund</li>
                  </ul>
                </div>

                <div className="policy-section" style={{ marginBottom: "40px" }}>
                  <h2 style={{ 
                    color: "var(--brand)", 
                    fontSize: "28px", 
                    marginBottom: "20px",
                    borderBottom: "2px solid var(--brand)",
                    paddingBottom: "10px"
                  }}>
                    11. Shipping Partners
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    We partner with trusted courier services for reliable delivery:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li>India Post</li>
                    <li>Delhivery</li>
                    <li>Blue Dart</li>
                    <li>DTDC</li>
                    <li>Professional Couriers</li>
                  </ul>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", marginTop: "15px" }}>
                    The courier partner is selected based on your location and product type to ensure safe and timely delivery.
                  </p>
                </div>

                <div className="policy-section" style={{ marginBottom: "40px" }}>
                  <h2 style={{ 
                    color: "var(--brand)", 
                    fontSize: "28px", 
                    marginBottom: "20px",
                    borderBottom: "2px solid var(--brand)",
                    paddingBottom: "10px"
                  }}>
                    12. Holidays and Peak Seasons
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    During holidays, festivals, and planting seasons:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li>Processing times may be extended by 1-2 business days</li>
                    <li>Delivery times may be longer due to increased courier volume</li>
                    <li>We recommend ordering early during peak seasons</li>
                    <li>Specific holiday schedules will be announced on our website</li>
                  </ul>
                </div>

                <div className="policy-section" style={{ 
                  background: "linear-gradient(135deg, #f0f8f0 0%, #e8f5e9 100%)",
                  padding: "30px",
                  borderRadius: "10px",
                  borderLeft: "4px solid var(--brand)"
                }}>
                  <h2 style={{ 
                    color: "var(--brand)", 
                    fontSize: "28px", 
                    marginBottom: "20px"
                  }}>
                    13. Contact Us
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    For shipping inquiries or to track your order, contact us:
                  </p>
                  <div style={{ marginTop: "20px", fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    <p><strong>Awantika Seeds</strong></p>
                    <p>📍 Ujjain, Madhya Pradesh, India</p>
                    <p>📧 Email: NurseryUjjain@gmail.com</p>
                    <p>📞 Phone: 8085263020</p>
                    <p style={{ marginTop: "20px" }}>
                      <strong>Customer Service Hours:</strong><br />
                      Monday - Saturday: 9:00 AM - 6:00 PM IST<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>

                <div style={{ 
                  background: "#e8f5e9", 
                  padding: "25px", 
                  borderRadius: "8px", 
                  marginTop: "30px",
                  border: "1px solid #c8e6c9"
                }}>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#2d5016", margin: 0 }}>
                    <strong>🌱 Our Shipping Promise:</strong> We are committed to delivering healthy plants and quality products 
                    to your doorstep. Every package is prepared with care, and we're here to help if any issues arise during shipping.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
