"use client";

export default function TermsOfServicePage() {
  return (
    <div className="main-content">
      {/* Page Header */}
      <div className="breadcumb-wrapper" style={{ 
        backgroundImage: "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7PXoqEuW8qJiYZ2iCQimwssoIL4FjSu9lNjx4B73Z2Q&s=10')",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}>
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Terms of Service</h1>
            <ul className="breadcumb-menu">
              <li><a href="/">Home</a></li>
              <li>Terms of Service</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Terms Content */}
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
                    Welcome to Awantika Seeds. By accessing and using our website, you agree to comply with and be bound by 
                    these Terms of Service. Please read them carefully before using our services.
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
                    1. Acceptance of Terms
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    By accessing or using the Awantika Seeds website and services, you agree to be bound by these Terms of Service 
                    and all applicable laws and regulations. If you do not agree with any part of these terms, you must not use our website.
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
                    2. Use of Our Services
                  </h2>
                  
                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    Eligibility
                  </h3>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    You must be at least 18 years old to use our services and make purchases. By using our website, 
                    you represent and warrant that you meet this requirement.
                  </p>

                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    Account Registration
                  </h3>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px" }}>
                    <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                    <li>You must provide accurate and complete information during registration</li>
                    <li>You are responsible for all activities that occur under your account</li>
                    <li>Notify us immediately of any unauthorized use of your account</li>
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
                    3. Products and Orders
                  </h2>
                  
                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    Product Information
                  </h3>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    We strive to display accurate product information, including descriptions, images, and prices. However:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li>Product colors may vary slightly from images due to screen settings</li>
                    <li>Plant sizes and appearances may vary as they are living organisms</li>
                    <li>We reserve the right to correct pricing errors</li>
                    <li>Product availability is subject to change without notice</li>
                  </ul>

                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    Order Acceptance
                  </h3>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for reasons including:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li>Product unavailability or out of stock</li>
                    <li>Errors in pricing or product information</li>
                    <li>Suspected fraudulent activity</li>
                    <li>Violation of these Terms of Service</li>
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
                    4. Pricing and Payment
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    All prices are listed in Indian Rupees (INR) and are subject to change without notice. Payment terms:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li>Full payment is required at the time of order placement</li>
                    <li>We accept major credit/debit cards, UPI, and other payment methods as displayed</li>
                    <li>All transactions are processed securely through our payment gateway</li>
                    <li>Prices include applicable taxes unless otherwise stated</li>
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
                    5. Shipping and Delivery
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    Please refer to our <a href="/shipping-policy" style={{ color: "var(--brand)", textDecoration: "underline" }}>Shipping Policy</a> for detailed information about delivery times, shipping costs, and procedures.
                  </p>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", marginTop: "15px" }}>
                    Key points:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li>Delivery times are estimates and not guaranteed</li>
                    <li>You are responsible for providing accurate shipping information</li>
                    <li>Risk of loss passes to you upon delivery</li>
                    <li>Special care is taken when shipping live plants</li>
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
                    6. Returns and Refunds
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    Please refer to our <a href="/refund-policy" style={{ color: "var(--brand)", textDecoration: "underline" }}>Refund Policy</a> for complete information about returns, refunds, and exchanges.
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
                    7. Intellectual Property
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    All content on this website, including text, images, logos, graphics, and software, is the property of 
                    Awantika Seeds or its content suppliers and is protected by intellectual property laws.
                  </p>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", marginTop: "15px" }}>
                    You may not:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li>Reproduce, distribute, or display any content without written permission</li>
                    <li>Use our trademarks, logos, or brand names without authorization</li>
                    <li>Modify or create derivative works from our content</li>
                    <li>Use automated systems to access or scrape our website</li>
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
                    8. Prohibited Activities
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    You agree not to:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe on the rights of others</li>
                    <li>Submit false or misleading information</li>
                    <li>Interfere with the operation of our website</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Upload viruses, malware, or harmful code</li>
                    <li>Harass, abuse, or harm other users</li>
                    <li>Use the website for commercial purposes without permission</li>
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
                    9. Disclaimer of Warranties
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    Our website and services are provided "as is" without warranties of any kind. We do not guarantee that:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li>The website will be uninterrupted, secure, or error-free</li>
                    <li>Results from using the website will be accurate or reliable</li>
                    <li>Products will meet your specific requirements</li>
                    <li>All plant defects or issues can be detected before shipping</li>
                  </ul>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", marginTop: "15px" }}>
                    <strong>Note:</strong> As plants are living organisms, their growth and survival depend on proper care after delivery. 
                    We provide care instructions but cannot guarantee plant survival.
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
                    10. Limitation of Liability
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    To the maximum extent permitted by law, Awantika Seeds shall not be liable for:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li>Indirect, incidental, special, or consequential damages</li>
                    <li>Loss of profits, revenue, data, or business opportunities</li>
                    <li>Damages arising from use or inability to use our services</li>
                    <li>Plant death due to improper care after delivery</li>
                  </ul>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", marginTop: "15px" }}>
                    Our total liability shall not exceed the amount you paid for the specific product or service.
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
                    11. Indemnification
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    You agree to indemnify and hold harmless Awantika Seeds, its officers, employees, and agents from any claims, 
                    damages, losses, or expenses arising from your use of our services or violation of these Terms.
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
                    12. Modifications to Terms
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately 
                    upon posting on this page. Your continued use of the website after changes constitutes acceptance of the new terms.
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
                    13. Governing Law
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    These Terms of Service are governed by the laws of India. Any disputes shall be subject to the exclusive 
                    jurisdiction of the courts in Ujjain, Madhya Pradesh.
                  </p>
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
                    14. Contact Information
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    For questions about these Terms of Service, please contact us:
                  </p>
                  <div style={{ marginTop: "20px", fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    <p><strong>Awantika Seeds</strong></p>
                    <p>📍 Ujjain, Madhya Pradesh, India</p>
                    <p>📧 Email: NurseryUjjain@gmail.com</p>
                    <p>📞 Phone: 8085263020</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
