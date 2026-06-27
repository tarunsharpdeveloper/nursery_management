"use client";

export default function RefundPolicyPage() {
  return (
    <div className="main-content">
      {/* Page Header */}
      <div className="breadcumb-wrapper" style={{ 
        backgroundImage: "url('https://www.shutterstock.com/image-photo/hand-holding-young-plant-on-260nw-1554603536.jpg')",backgroundSize: "cover", backgroundPosition: "center"
      }}>
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Refund Policy</h1>
            <ul className="breadcumb-menu">
              <li><a href="/">Home</a></li>
              <li>Refund Policy</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Refund Policy Content */}
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
                    At Awantika Seeds, we are committed to your satisfaction. This Refund Policy outlines our guidelines for returns, 
                    refunds, and exchanges. Please read carefully before making a purchase.
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
                    1. Our Commitment
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    We take great care in packaging and shipping our plants and seeds to ensure they arrive in excellent condition. 
                    However, we understand that issues may occasionally arise. We stand behind the quality of our products and will 
                    work with you to resolve any concerns.
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
                    2. Eligibility for Refunds
                  </h2>
                  
                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    Eligible for Refund/Return:
                  </h3>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px" }}>
                    <li><strong>Dead or Severely Damaged Plants:</strong> Plants that arrive dead or with severe damage (more than 50% leaf loss or stem breakage)</li>
                    <li><strong>Wrong Product Delivered:</strong> You received a different plant or product than what you ordered</li>
                    <li><strong>Defective Seeds:</strong> Seeds that fail to germinate despite proper care (germination rate below 50%)</li>
                    <li><strong>Missing Items:</strong> Items missing from your order</li>
                    <li><strong>Damaged Packaging:</strong> Products damaged due to poor packaging or shipping mishandling</li>
                  </ul>

                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    NOT Eligible for Refund:
                  </h3>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px" }}>
                    <li><strong>Improper Care:</strong> Plant death or decline due to improper watering, lighting, temperature, or other care issues after delivery</li>
                    <li><strong>Minor Leaf Damage:</strong> Minor yellowing, wilting, or leaf drop (10-20%) is normal during shipping stress</li>
                    <li><strong>Natural Variations:</strong> Size or color variations from images (plants vary naturally)</li>
                    <li><strong>Delayed Reporting:</strong> Issues reported more than 48 hours after delivery for plants, or 30 days for seeds</li>
                    <li><strong>Change of Mind:</strong> You simply changed your mind about the purchase</li>
                    <li><strong>Seasonal Dormancy:</strong> Plants entering natural dormancy periods</li>
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
                    3. Timeframe for Refund Requests
                  </h2>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px" }}>
                    <li><strong>Live Plants:</strong> Report any issues within <strong>48 hours</strong> of delivery</li>
                    <li><strong>Seeds:</strong> Report germination issues within <strong>30 days</strong> of purchase (allow adequate germination time per seed type)</li>
                    <li><strong>Gardening Supplies & Accessories:</strong> Return requests within <strong>7 days</strong> of delivery (unused and in original packaging)</li>
                    <li><strong>Wrong/Missing Items:</strong> Report within <strong>24 hours</strong> of delivery</li>
                  </ul>
                  <div style={{ 
                    background: "#fff3cd", 
                    padding: "20px", 
                    borderRadius: "8px", 
                    marginTop: "20px",
                    borderLeft: "4px solid #ffc107"
                  }}>
                    <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#856404", margin: 0 }}>
                      <strong>⚠️ Important:</strong> Late requests beyond these timeframes will not be eligible for refunds.
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
                    4. How to Request a Refund or Return
                  </h2>
                  
                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    Step 1: Contact Us
                  </h3>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    Email us at <strong>NurseryUjjain@gmail.com</strong> or call us at [Your Phone Number] with:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li>Your order number</li>
                    <li>Clear photos of the issue (damaged plants, wrong items, packaging)</li>
                    <li>Description of the problem</li>
                    <li>Date and time of delivery</li>
                  </ul>

                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    Step 2: Review Process
                  </h3>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    Our customer service team will review your request within <strong>1-2 business days</strong> and determine eligibility based on this policy.
                  </p>

                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    Step 3: Resolution
                  </h3>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    If approved, you will receive one of the following:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li><strong>Full Refund:</strong> Money refunded to original payment method</li>
                    <li><strong>Replacement:</strong> New product shipped at no additional cost</li>
                    <li><strong>Store Credit:</strong> Credit for future purchases (may be offered in some cases)</li>
                    <li><strong>Partial Refund:</strong> For minor damages (at our discretion)</li>
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
                    5. Refund Processing Times
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    Once your refund is approved:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li><strong>UPI/Wallet Payments:</strong> 1-3 business days</li>
                    <li><strong>Credit/Debit Cards:</strong> 5-7 business days</li>
                    <li><strong>Net Banking:</strong> 5-7 business days</li>
                    <li><strong>Cash on Delivery:</strong> Bank transfer within 7-10 business days (we'll need your bank details)</li>
                  </ul>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", marginTop: "15px" }}>
                    <em>Note: Refund processing times may vary depending on your bank or payment provider.</em>
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
                    6. Return Shipping
                  </h2>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px" }}>
                    <li><strong>Our Fault:</strong> If we sent the wrong item or product arrived damaged due to our error, we cover return shipping costs</li>
                    <li><strong>Customer's Request:</strong> If you're returning due to change of mind (for non-plant items), you cover return shipping</li>
                    <li><strong>Plants:</strong> Generally, we do not require return of damaged plants. Photos are sufficient for claim processing</li>
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
                    7. Exchanges
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    We offer exchanges for:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li>Wrong products delivered</li>
                    <li>Damaged or defective items</li>
                    <li>Different size or variety (subject to availability)</li>
                  </ul>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", marginTop: "15px" }}>
                    To request an exchange, follow the same process as refund requests. Exchanges are subject to product availability.
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
                    8. Cancellations
                  </h2>
                  
                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    Before Shipping:
                  </h3>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    You may cancel your order before it ships. Contact us immediately at NurseryUjjain@gmail.com or call us. 
                    Full refund will be issued within 5-7 business days.
                  </p>

                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    After Shipping:
                  </h3>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    Once the order has shipped, cancellations are not possible. You must wait to receive the order and follow 
                    the return process if needed.
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
                    9. Special Considerations for Plants
                  </h2>
                  <div style={{ 
                    background: "#e8f5e9", 
                    padding: "25px", 
                    borderRadius: "8px", 
                    marginTop: "20px",
                    border: "1px solid #c8e6c9"
                  }}>
                    <h4 style={{ color: "#2d5016", marginBottom: "15px" }}>🌱 Plant Care After Delivery:</h4>
                    <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", marginBottom: "15px" }}>
                      Plants may experience shipping stress. This is normal. Please:
                    </p>
                    <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px" }}>
                      <li>Unbox immediately upon arrival</li>
                      <li>Water lightly and place in indirect light for 2-3 days</li>
                      <li>Allow plants to acclimate before moving to their permanent location</li>
                      <li>Follow included care instructions carefully</li>
                    </ul>
                    <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", marginTop: "15px" }}>
                      <strong>We are NOT responsible for plant death due to improper care after delivery.</strong>
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
                    10. Non-Refundable Items
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    The following items are <strong>non-refundable</strong>:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li>Gift cards or store credits</li>
                    <li>Downloaded digital guides or e-books</li>
                    <li>Custom or personalized items</li>
                    <li>Clearance or sale items (unless defective)</li>
                    <li>Opened bags of fertilizers or chemicals (for safety reasons)</li>
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
                    11. Contact Us
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    For refund requests or questions about this policy, please contact us:
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
                  background: "#fff8e1", 
                  padding: "25px", 
                  borderRadius: "8px", 
                  marginTop: "30px",
                  border: "1px solid #ffecb3"
                }}>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#f57f17", margin: 0 }}>
                    <strong>💚 Our Promise:</strong> We value your satisfaction and will work with you to find a fair resolution 
                    to any legitimate concerns. Your happiness is our priority!
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
