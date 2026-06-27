"use client";

export default function PrivacyPolicyPage() {
  return (
    <div className="main-content">
      {/* Page Header */}
      <div className="breadcumb-wrapper" style={{ 
        backgroundImage: "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUtFWk4bTzOkiwxaGKUO5vV0PzvFKt9wH2UVF_U2D9P1a7HF81VDpwKZId&s=10')",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}>
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">Privacy Policy</h1>
            <ul className="breadcumb-menu">
              <li><a href="/">Home</a></li>
              <li>Privacy Policy</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Privacy Policy Content */}
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
                    At Awantika Seeds, we are committed to protecting your privacy. This Privacy Policy explains how we collect, 
                    use, disclose, and safeguard your information when you visit our website or make a purchase from us.
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
                    1. Information We Collect
                  </h2>
                  
                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    Personal Information
                  </h3>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    We collect personal information that you voluntarily provide to us when you:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li>Create an account on our website</li>
                    <li>Place an order for plants, seeds, or related products</li>
                    <li>Subscribe to our newsletter or marketing communications</li>
                    <li>Contact us for customer support or inquiries</li>
                    <li>Participate in surveys, contests, or promotions</li>
                  </ul>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", marginTop: "15px" }}>
                    This information may include: name, email address, phone number, shipping address, billing address, 
                    and payment information.
                  </p>

                  <h3 style={{ color: "#2d5016", fontSize: "22px", marginTop: "25px", marginBottom: "15px" }}>
                    Automatically Collected Information
                  </h3>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    When you visit our website, we automatically collect certain information about your device, including:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li>IP address and browser type</li>
                    <li>Operating system and device information</li>
                    <li>Pages viewed and time spent on pages</li>
                    <li>Referring website addresses</li>
                    <li>Cookies and similar tracking technologies</li>
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
                    2. How We Use Your Information
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    We use the information we collect for the following purposes:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li><strong>Order Processing:</strong> To process and fulfill your orders, including shipping and delivery</li>
                    <li><strong>Customer Service:</strong> To respond to your inquiries and provide customer support</li>
                    <li><strong>Account Management:</strong> To manage your account and provide personalized experiences</li>
                    <li><strong>Marketing:</strong> To send promotional emails about new products, special offers, and gardening tips (you can opt-out anytime)</li>
                    <li><strong>Website Improvement:</strong> To analyze usage patterns and improve our website functionality</li>
                    <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
                    <li><strong>Fraud Prevention:</strong> To detect and prevent fraudulent transactions and protect our business</li>
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
                    3. Information Sharing and Disclosure
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    We do not sell, trade, or rent your personal information to third parties. We may share your information with:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li><strong>Service Providers:</strong> Third-party vendors who help us operate our business (e.g., payment processors, shipping companies, email services)</li>
                    <li><strong>Legal Authorities:</strong> When required by law or to protect our rights and safety</li>
                    <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                  </ul>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", marginTop: "15px" }}>
                    All third-party service providers are required to protect your information and use it only for the purposes we specify.
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
                    4. Data Security
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    We implement appropriate technical and organizational security measures to protect your personal information, including:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li>Secure Socket Layer (SSL) encryption for data transmission</li>
                    <li>Secure servers and databases with restricted access</li>
                    <li>Regular security audits and updates</li>
                    <li>Employee training on data protection practices</li>
                  </ul>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", marginTop: "15px" }}>
                    However, no method of transmission over the internet is 100% secure. While we strive to protect your information, 
                    we cannot guarantee absolute security.
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
                    5. Your Rights and Choices
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    You have the following rights regarding your personal information:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                    <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                    <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
                    <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails by clicking the unsubscribe link</li>
                    <li><strong>Cookies:</strong> Manage cookie preferences through your browser settings</li>
                  </ul>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", marginTop: "15px" }}>
                    To exercise these rights, please contact us at: <strong>NurseryUjjain@gmail.com</strong>
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
                    6. Cookies and Tracking Technologies
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    We use cookies and similar tracking technologies to enhance your browsing experience. Cookies help us:
                  </p>
                  <ul style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", paddingLeft: "30px", marginTop: "15px" }}>
                    <li>Remember your login information and preferences</li>
                    <li>Analyze website traffic and user behavior</li>
                    <li>Provide personalized content and recommendations</li>
                    <li>Measure the effectiveness of our marketing campaigns</li>
                  </ul>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666", marginTop: "15px" }}>
                    You can control cookies through your browser settings. However, disabling cookies may affect website functionality.
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
                    7. Children's Privacy
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    Our website is not intended for children under the age of 13. We do not knowingly collect personal information 
                    from children. If we discover that we have collected information from a child under 13, we will delete it immediately.
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
                    8. Changes to This Privacy Policy
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
                    We will notify you of any significant changes by posting the new policy on this page and updating the "Last Updated" date.
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
                    9. Contact Us
                  </h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.8", color: "#666" }}>
                    If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, 
                    please contact us:
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
