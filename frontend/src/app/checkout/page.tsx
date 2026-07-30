"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import TermsAndConditionsModal from "@/components/TermsAndConditionsModal";

// Extend Window interface for AtomPaynetz
declare global {
  interface Window {
    AtomPaynetz: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, subtotal, total, clearCart } = useCart();
  const { user, isLoaded, login } = useCustomerAuth();
  const { showToast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState("cod"); // Default to COD for testing
  const [sameAddress, setSameAddress] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [orderTotal, setOrderTotal] = useState(0); // Store order total before cart is cleared
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [accountCreationMessage, setAccountCreationMessage] = useState("");
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    city: "",
    address: "",
    zip: "",
    phone: "",
  });

  // Check for payment success/failure in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const orderNumber = searchParams.get('orderNumber');
      const success = searchParams.get('success');
      const failed = searchParams.get('payment');

      if (success === 'true' && orderNumber) {
        setPaymentSuccess(true);
        setOrderId(orderNumber);
        setIsSubmitted(true);
        
        // Clear cart and localStorage
        clearCart();
        
        // Clean URL
        window.history.replaceState({}, document.title, '/checkout');
      } else if (failed === 'failed') {
        setPaymentError('Payment failed. Please try another payment method or try again.');
        // Clean URL
        window.history.replaceState({}, document.title, '/checkout');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Load AtomPaynetz script dynamically
  useEffect(() => {
    const loadAtomScript = () => {
      // Remove existing script if any
      const existingScript = document.querySelector('script[src*="atomcheckout.js"]');
      if (existingScript) {
        existingScript.remove();
      }

      // Create new script with timestamp to prevent caching
      const script = document.createElement('script');
      script.src = `https://pgtest.atomtech.in/staticdata/ots/js/atomcheckout.js?v=${Date.now()}`;
      script.async = true;
      
      script.onload = () => {
        console.log('✅ AtomPaynetz script loaded successfully');
        setScriptLoaded(true);
      };
      
      script.onerror = () => {
        console.error('❌ Failed to load AtomPaynetz script');
        setStatus('Failed to load payment system');
      };

      document.head.appendChild(script);
    };

    loadAtomScript();

    return () => {
      // Cleanup
      const script = document.querySelector('script[src*="atomcheckout.js"]');
      if (script) {
        script.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || ""
      }));
    }
  }, [user]);

  // Check if email exists when email changes
  useEffect(() => {
    const checkEmail = async () => {
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setEmailExists(false);
        return;
      }

      if (user && user.email === formData.email) {
        setEmailExists(false);
        return;
      }

      setCheckingEmail(true);
      try {
        const response = await apiRequest<{ exists: boolean }>("/api/auth/check-email", {
          method: "POST",
          body: JSON.stringify({ email: formData.email })
        });
        setEmailExists(response.exists);
      } catch (error) {
        console.error("Email check error:", error);
        setEmailExists(false);
      } finally {
        setCheckingEmail(false);
      }
    };

    const debounceTimer = setTimeout(checkEmail, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData.email, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, phone: value.replace(/\D/g, "").slice(0, 10) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePayment = async (orderId: number, amount: number, customerEmail: string, customerMobile: string) => {
    if (!scriptLoaded) {
      setStatus('Payment system is still loading. Please try again.');
      return;
    }

    setBusy(true);
    
    try {
      // Get token from backend using the corrected AES-256-CBC method
      console.log('Initiating NDPS payment...');
      console.log('Order ID:', orderId);
      console.log('Amount:', amount);
      console.log('Customer:', customerEmail, customerMobile);

      const response = await apiRequest<{
        success: boolean;
        paymentId: number;
        atomTokenId: number;
        merchId: string;
        merchTxnId: string;
        customerEmail: string;
        customerMobile: string;
        returnUrl: string;
        env: 'uat' | 'prod';
      }>('/api/ndps/initiate', {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          amount,
          customerEmail,
          customerMobile
        })
      });

      console.log('=== Backend Response ===');
      console.log('Full response:', JSON.stringify(response, null, 2));
      console.log('Token type:', typeof response.atomTokenId);
      console.log('Token value:', response.atomTokenId);

      // Validate response
      if (!response.atomTokenId || !response.paymentId) {
        throw new Error('Invalid response from payment gateway. Please try again or use Cash on Delivery.');
      }

      // Open AtomPaynetz popup (exact format from working implementation)
      if (!window.AtomPaynetz) {
        throw new Error('AtomPaynetz library not loaded');
      }

      // Configuration object (EXACT format from working implementation)
      const atomConfig = {
        atomTokenId: response.atomTokenId.toString(), // Convert number to string
        merchId: response.merchId.toString(),
        custEmail: response.customerEmail,
        custMobile: response.customerMobile,
        returnUrl: response.returnUrl
      };

      console.log('=== Opening AtomPaynetz Popup ===');
      console.log('Config:', JSON.stringify(atomConfig, null, 2));
      console.log('Environment:', response.env);
      console.log('AtomPaynetz available:', typeof window.AtomPaynetz);

      // Create AtomPaynetz instance (as per working implementation)
      new window.AtomPaynetz(atomConfig, response.env);
      
      console.log('✅ AtomPaynetz instance created');
      console.log('Popup should open automatically...');
      // The popup will open automatically
      // After payment, user will be redirected to returnUrl
      
    } catch (error: any) {
      console.error('❌ Payment initiation failed:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      
      // Handle specific errors with user-friendly messages
      let errorMessage = 'Failed to initiate payment';
      
      if (error.message?.includes('empty') || error.message?.includes('content-length')) {
        errorMessage = 'Payment gateway is temporarily unavailable. Please try Cash on Delivery or contact support.';
      } else if (error.message?.includes('Invalid response')) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setStatus(errorMessage);
      setBusy(false);
    }
  };

  const executeOrderCreationAndPayment = async () => {
    setBusy(true);
    setStatus("");
    setAccountCreationMessage("");

    try {
      if (!/^\d{10}$/.test(formData.phone)) {
        throw new Error("Phone number must be exactly 10 digits.");
      }

      // Create account if not already logged in
      if (!user) {
        try {
          if (createAccount) {
            // Checkbox checked: Create account with random password and send email
            const accountResponse = await apiRequest<{ 
              message: string; 
              accountCreated?: boolean;
              accountExists?: boolean;
            }>("/api/auth/auto-create-account", {
              method: "POST",
              body: JSON.stringify({
                name: formData.name,
                email: formData.email,
                phone: formData.phone
              })
            });

            if (accountResponse.accountCreated) {
              setAccountCreationMessage("✅ Account created! Login credentials sent to your email.");
            }
          } else {
            // Checkbox not checked: Create account with phone as password (no email)
            const accountResponse = await apiRequest<{ 
              message: string; 
              accountCreated?: boolean;
              accountExists?: boolean;
            }>("/api/auth/auto-create-account-phone", {
              method: "POST",
              body: JSON.stringify({
                name: formData.name,
                email: formData.email,
                phone: formData.phone
              })
            });

            if (accountResponse.accountCreated) {
              console.log("Account created with phone as password");
            }
          }
        } catch (accountError: any) {
          console.log("Account creation skipped or failed:", accountError.message);
          // Continue with order even if account creation fails
        }
      }

      const response = await apiRequest<{ orderId: number; orderNumber: string }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          customer: {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            address: `${formData.address}, ${formData.city} - ${formData.zip}`
          },
          items: cartItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.selling_price
          }))
        })
      });

      localStorage.setItem("customer_order_lookup", JSON.stringify({
        email: formData.email,
        phone: formData.phone,
        orderNumber: response.orderNumber
      }));

      if (!user) {
        await login(formData.email, formData.phone).catch(() => undefined);
      }

      // Store order details
      setCreatedOrder({
        id: response.orderId,
        number: response.orderNumber,
        customer: {
          email: formData.email,
          phone: formData.phone,
          name: formData.name
        }
      });

      // Save order total BEFORE clearing cart
      setOrderTotal(total);

      // Handle different payment methods
      if (paymentMethod === "ndps") {
        // Call handlePayment directly to open payment popup
        // DON'T clear cart yet - wait for payment success
        await handlePayment(response.orderId, total, formData.email, formData.phone);
        // Cart will be cleared on successful payment return
      } else {
        // For other payment methods (COD, bank transfer, etc.)
        setOrderId(response.orderNumber);
        setIsSubmitted(true);
        clearCart();
        setBusy(false);
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Could not place order";
      setStatus(errorMsg);
      if (errorMsg.includes("enough stock")) {
        showToast(errorMsg, "error", 5000);
      }
      setBusy(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    setStatus("");

    if (!/^\d{10}$/.test(formData.phone)) {
      setStatus("Phone number must be exactly 10 digits.");
      return;
    }

    // For Live Payment Gateway (NDPS), require Terms & Conditions acceptance first
    if (paymentMethod === "ndps" && !isTermsAccepted) {
      setShowTermsModal(true);
      return;
    }

    await executeOrderCreationAndPayment();
  };

  const handleAcceptTermsAndProceed = async () => {
    setShowTermsModal(false);
    setIsTermsAccepted(true);
    await executeOrderCreationAndPayment();
  };

  if (!isLoaded) return <div style={{ minHeight: "60vh" }}></div>;

  if (isSubmitted) {
    return (
      <main>
        <section className="z-index-common breadcumb-wrapper" style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1920&q=80')", 
          backgroundSize: "cover", 
          backgroundPosition: "center" 
        }}>
          <div className="container">
            <div className="breadcumb-content">
              <h1 className="breadcumb-title">Order Confirmed</h1>
            </div>
          </div>
        </section>

        <section className="space space-extra-bottom" style={{ background: "linear-gradient(180deg, #f8fef5 0%, #ffffff 100%)" }}>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8 col-xl-7">
                {/* Success Card Container */}
                <div style={{
                  background: "#ffffff",
                  borderRadius: "20px",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                  padding: "50px 40px",
                  textAlign: "center",
                  border: "1px solid #e8f5e3"
                }}>
                  
                  {/* Payment Success Banner */}
                  {paymentSuccess && (
                    <div style={{
                      background: "linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)",
                      border: "2px solid #28a745",
                      borderRadius: "12px",
                      padding: "20px 25px",
                      marginBottom: "35px",
                      textAlign: "left",
                      boxShadow: "0 4px 12px rgba(40, 167, 69, 0.15)"
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                          width: "50px",
                          height: "50px",
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
                            style={{ fontSize: '24px', color: '#ffffff' }}
                          ></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ 
                            color: '#155724', 
                            margin: '0 0 5px 0',
                            fontSize: '18px',
                            fontWeight: '700'
                          }}>
                            Payment Received Successfully!
                          </h4>
                          <p style={{ color: '#155724', margin: 0, fontSize: '14px', opacity: 0.9 }}>
                            Your payment has been processed and confirmed by our payment gateway.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Error Banner */}
                  {paymentError && (
                    <div style={{
                      background: "linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)",
                      border: "2px solid #dc3545",
                      borderRadius: "12px",
                      padding: "20px 25px",
                      marginBottom: "35px",
                      textAlign: "left",
                      boxShadow: "0 4px 12px rgba(220, 53, 69, 0.15)"
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "50%",
                          background: "#dc3545",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: "0 4px 12px rgba(220, 53, 69, 0.3)"
                        }}>
                          <i 
                            className="fal fa-exclamation-triangle" 
                            style={{ fontSize: '24px', color: '#ffffff' }}
                          ></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ 
                            color: '#721c24', 
                            margin: '0 0 5px 0',
                            fontSize: '18px',
                            fontWeight: '700'
                          }}>
                            Payment Failed
                          </h4>
                          <p style={{ color: '#721c24', margin: 0, fontSize: '14px', opacity: 0.9 }}>
                            {paymentError}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Success Icon */}
                  <div style={{
                    width: "100px",
                    height: "100px",
                    margin: "0 auto 25px",
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
                      style={{ fontSize: "50px", color: "#ffffff" }}
                    ></i>
                  </div>

                  {/* Main Heading */}
                  <h2 style={{ 
                    marginBottom: "15px",
                    fontSize: "32px",
                    fontWeight: "800",
                    color: "#2d5016",
                    letterSpacing: "-0.5px"
                  }}>
                    Thank You for Your Order!
                  </h2>

                  {/* Subheading */}
                  <p style={{ 
                    color: "#6b8e23", 
                    fontSize: "18px", 
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
                    padding: "20px",
                    margin: "25px 0",
                    display: "inline-block",
                    minWidth: "300px"
                  }}>
                    <p style={{ 
                      fontSize: "14px", 
                      color: "#6b8e23", 
                      margin: "0 0 8px 0",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      fontWeight: "600"
                    }}>
                      Order ID
                    </p>
                    <p style={{ 
                      fontSize: "24px", 
                      fontWeight: "800", 
                      margin: 0,
                      color: "#2d5016",
                      fontFamily: "monospace",
                      letterSpacing: "1px"
                    }}>
                      {orderId}
                    </p>
                  </div>

                  {/* Description */}
                  <p style={{ 
                    color: "#666", 
                    fontSize: "15px",
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
                    background: "linear-gradient(90deg, transparent 0%, #c3e6cb 50%, transparent 100%)",
                    margin: "35px 0"
                  }}></div>

                  {/* Action Buttons */}
                  <div style={{
                    display: "flex",
                    gap: "15px",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    marginTop: "30px"
                  }}>
                    <Link 
                      href="/my-orders" 
                      className="vs-btn"
                      style={{
                        background: "linear-gradient(135deg, #2d5016 0%, #4a7c2e 100%)",
                        border: "none",
                        padding: "14px 30px",
                        fontSize: "15px",
                        fontWeight: "600",
                        boxShadow: "0 4px 15px rgba(45, 80, 22, 0.3)",
                        transition: "all 0.3s ease"
                      }}
                    >
                      <i className="fal fa-box-check" style={{ marginRight: "8px" }}></i>
                      Track Order
                    </Link>
                    <Link 
                      href="/products" 
                      className="vs-btn style2"
                      style={{
                        padding: "14px 30px",
                        fontSize: "15px",
                        fontWeight: "600"
                      }}
                    >
                      <i className="fal fa-shopping-bag" style={{ marginRight: "8px" }}></i>
                      Continue Shopping
                    </Link>
                  </div>

                  {/* Support Info */}
                  <div style={{
                    marginTop: "40px",
                    padding: "20px",
                    background: "#f8f9fa",
                    borderRadius: "10px",
                    textAlign: "left"
                  }}>
                    <p style={{
                      fontSize: "13px",
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
                      fontSize: "13px",
                      color: "#666",
                      margin: 0,
                      lineHeight: "1.6"
                    }}>
                      If you have any questions about your order, please contact our support team at{" "}
                      <a href="tel:+918085263020" style={{ color: "#2d5016", fontWeight: "600", textDecoration: "none" }}>
                        +91 80852 63020
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

  return (
    <main>
      {/* breadcumb */}
      <section className="z-index-common breadcumb-wrapper" style={{ backgroundImage: "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuwB_fJjOi4hX4YlC-mm76lRdTPTXJEMgZJM0HdFEaNcfOcC_V1EG6OQk&s=10')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="container">
          <div className="row justify-content-between align-items-center">
            <div className="col-auto">
              <div className="breadcumb-content">
                <h1 className="breadcumb-title">Checkout</h1>
                <div className="breadcumb-menu-wrap">
                  <ul className="breadcumb-menu">
                    <li><Link href="/">Home</Link></li>
                    <li>Checkout</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* breadcumb End */}

      {/* Checkout Area */}
      <div className="vs-product-wrapper space-top space-extra-bottom">
        <div className="container">
          {/* Payment Error Banner */}
          {paymentError && (
            <div style={{
              backgroundColor: '#f8d7da',
              border: '2px solid #dc3545',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '30px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                  <i 
                    className="fal fa-exclamation-circle" 
                    style={{ fontSize: '28px', color: '#dc3545', flexShrink: 0 }}
                  ></i>
                  <div>
                    <h4 style={{ color: '#721c24', margin: '0 0 5px 0' }}>❌ Payment Failed</h4>
                    <p style={{ color: '#721c24', margin: 0, fontSize: '14px' }}>
                      {paymentError}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPaymentError("")}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#721c24'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <form action="#" className="woocommerce-checkout mt-40" onSubmit={handlePlaceOrder}>
              <div className="row">
                <div className="col-lg-7">
                  <div className="woocommerce-checkout__form">
                    <h2 className="h4 summary-title">Billing Details</h2>
                    <div className="row gx-20">
                      <div className="col-12 form-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Complete Name"
                          required
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-12 form-group">
                        <input
                          type="email"
                          className="form-control"
                          placeholder="Email Address"
                          required
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          style={{
                            borderColor: emailExists ? '#dc3545' : formData.email && !checkingEmail ? '#28a745' : undefined
                          }}
                        />
                        {checkingEmail && formData.email && (
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#6c757d', 
                            marginTop: '5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            <i className="fas fa-spinner fa-spin"></i> Checking email...
                          </div>
                        )}
                        {!checkingEmail && emailExists && (
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#dc3545', 
                            marginTop: '5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            <i className="fas fa-exclamation-circle"></i> This email is already registered. <Link href="/login" style={{ color: '#dc3545', textDecoration: 'underline' }}>Login here</Link>
                          </div>
                        )}
                        {!checkingEmail && !emailExists && formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#28a745', 
                            marginTop: '5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            <i className="fas fa-check-circle"></i> Email available
                          </div>
                        )}
                      </div>
                      <div className="col-12 form-group">
                        <select className="form-select" defaultValue="IN">
                          <option value="IN">India (IN)</option>
                          <option value="US">United States (US)</option>
                          <option value="AU">Australia (AU)</option>
                          <option value="GB">United Kingdom (UK)</option>
                        </select>
                      </div>
                      <div className="col-md-6 form-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Town / City"
                          required
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-6 form-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Street Address"
                          required
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-6 form-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Postcode / Zip"
                          required
                          name="zip"
                          value={formData.zip}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-6 form-group">
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="Phone number"
                          required
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          inputMode="numeric"
                          pattern="[0-9]{10}"
                          maxLength={10}
                          title="Phone number must be exactly 10 digits."
                        />
                      </div>
                      
                      {/* Only show account creation checkbox if user is NOT logged in */}
                      {!user && (
                        <div className="col-12 form-group">
                          <input
                            type="checkbox"
                            id="accountNewCreate"
                            checked={createAccount}
                            disabled={emailExists}
                            onChange={(event) => setCreateAccount(event.target.checked)}
                          />
                          <label htmlFor="accountNewCreate">
                            Send login credentials to my email
                          </label>
                          {emailExists && (
                            <div style={{
                              marginTop: '8px',
                              padding: '10px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              backgroundColor: '#f8d7da',
                              color: '#721c24',
                              border: '1px solid #f5c6cb'
                            }}>
                              ⚠️ Email already registered. Account creation is disabled. Please <Link href="/login" style={{ color: '#721c24', textDecoration: 'underline', fontWeight: 'bold' }}>login</Link> or use a different email.
                            </div>
                          )}
                          {!emailExists && createAccount && (
                            <div style={{
                              marginTop: '8px',
                              padding: '10px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              backgroundColor: '#e7f3ff',
                              color: '#004085',
                              border: '1px solid #b8daff'
                            }}>
                              ℹ️ A random password will be generated and sent to your email after placing the order.
                            </div>
                          )}
                          {!emailExists && !createAccount && (
                            <div style={{
                              marginTop: '8px',
                              padding: '10px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              backgroundColor: '#fff3cd',
                              color: '#856404',
                              border: '1px solid #ffeaa7'
                            }}>
                              ℹ️ Your phone number will be used as the password.
                            </div>
                          )}
                          {accountCreationMessage && (
                            <div style={{
                              marginTop: '8px',
                              padding: '10px',
                              borderRadius: '4px',
                              fontSize: '13px',
                              backgroundColor: '#d4edda',
                              color: '#155724',
                              border: '1px solid #c3e6cb'
                            }}>
                              {accountCreationMessage}
                            </div>
                          )}
                        </div>
                      )}
                      <p id="ship-to-different-address">
                        <input
                          id="ship-to-different-address-checkbox"
                          type="checkbox"
                          name="ship_to_different_address"
                          checked={sameAddress}
                          onChange={(e) => setSameAddress(e.target.checked)}
                        />
                        <label htmlFor="ship-to-different-address-checkbox">
                          Deliver to same Address
                          <span className="checkmark"></span>
                        </label>
                      </p>

                      {!sameAddress && (
                        <div className="shipping_address">
                          <div className="row">
                            <div className="col-12 form-group">
                              <select className="form-select" defaultValue="IN">
                                <option value="IN">India (IN)</option>
                                <option value="US">United States (US)</option>
                                <option value="AU">Australia (AU)</option>
                                <option value="GB">United Kingdom (UK)</option>
                              </select>
                            </div>
                            <div className="col-md-6 form-group">
                              <input type="text" className="form-control" placeholder="First Name" />
                            </div>
                            <div className="col-md-6 form-group">
                              <input type="text" className="form-control" placeholder="Last Name" />
                            </div>
                            <div className="col-12 form-group">
                              <input type="text" className="form-control" placeholder="Your Company Name" />
                            </div>
                            <div className="col-12 form-group">
                              <input type="text" className="form-control" placeholder="Street Address" />
                              <input type="text" className="form-control" placeholder="Apartment, suite, unit etc. (optional)" />
                            </div>
                            <div className="col-12 form-group">
                              <input type="text" className="form-control" placeholder="Town / City" />
                            </div>
                            <div className="col-md-6 form-group">
                              <input type="text" className="form-control" placeholder="State" />
                            </div>
                            <div className="col-md-6 form-group">
                              <input type="text" className="form-control" placeholder="Postcode / Zip" />
                            </div>
                            <div className="col-12 form-group">
                              <input type="text" className="form-control" placeholder="Email Address" />
                              <input type="text" className="form-control" placeholder="Phone number" />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="col-12 form-group">
                        <textarea cols={20} rows={5} className="form-control" placeholder="Notes about your order, e.g. special notes for delivery."></textarea>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-5">
                  <div className="cart-totals--cart" style={{ backgroundImage: "url('/assets/img/pattern/my-account-pattern-1-1.png')" }}>
                    <h2 className="h4 summary-title text-white">Cart Totals</h2>
                    <div className="checkout-totals-list" style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "30px" }}>
                      {/* Sub Total */}
                      <div className="d-flex justify-content-between align-items-center" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.15)", paddingBottom: "14px" }}>
                        <span style={{ color: "white", fontSize: "15px", fontWeight: "600" }}>Sub Total</span>
                        <span style={{ color: "#8cc63f", fontSize: "16px", fontWeight: "700" }}>Rs. {subtotal.toFixed(2)}</span>
                      </div>

                      {/* Delivery */}
                      <div className="d-flex justify-content-between align-items-center" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.15)", paddingBottom: "14px" }}>
                        <span style={{ color: "white", fontSize: "15px", fontWeight: "600" }}>Delivery</span>
                        <span style={{ color: "white", fontSize: "15px", fontWeight: "600" }}>Free Delivery</span>
                      </div>

                      {/* Order Total */}
                      <div className="d-flex justify-content-between align-items-center" style={{ paddingTop: "4px" }}>
                        <span style={{ color: "white", fontSize: "12px", fontWeight: "800", textTransform: "uppercase" }}>Order Total</span>
                        <span style={{ color: "#8cc63f", fontSize: "15px", fontWeight: "800" }}>Rs. {total.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="woocommerce-checkout-payment">
                      <h2 className="summary-title text-capitalize text-white">Payment Method</h2>
                      <ul className="wc_payment_methods payment_methods methods">
                        <li className="wc_payment_method payment_method_ndps">
                          <input
                            id="payment_method_ndps"
                            type="radio"
                            className="input-radio"
                            name="payment_method"
                            value="ndps"
                            checked={paymentMethod === "ndps"}
                            onChange={() => setPaymentMethod("ndps")}
                          />
                          <label htmlFor="payment_method_ndps" style={{lineHeight:'20px'}}>
                            💳 Pay Online (Cards, UPI, Net Banking)
                          </label>
                          {paymentMethod === "ndps" && (
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#ccc', 
                              marginTop: '5px',
                              paddingLeft: '25px'
                            }}>
                              Secure payment via NTT DATA Payment Services
                            </div>
                          )}
                        </li>
                        <li className="wc_payment_method payment_method_cod">
                          <input
                            id="payment_method_cod"
                            type="radio"
                            className="input-radio"
                            name="payment_method"
                            value="cod"
                            checked={paymentMethod === "cod"}
                            onChange={() => setPaymentMethod("cod")}
                          />
                          <label htmlFor="payment_method_cod">💰 Cash on Delivery</label>
                          {paymentMethod === "cod" && (
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#ccc', 
                              marginTop: '5px',
                              paddingLeft: '25px'
                            }}>
                              Pay when you receive your order
                            </div>
                          )}
                        </li>
                        <li className="wc_payment_method payment_method_bacs">
                          <input
                            id="payment_method_bacs"
                            type="radio"
                            className="input-radio"
                            name="payment_method"
                            value="bacs"
                            checked={paymentMethod === "bacs"}
                            onChange={() => setPaymentMethod("bacs")}
                          />
                          {/* <label htmlFor="payment_method_bacs">🏦 Direct Bank Transfer</label> */}
                          {paymentMethod === "bacs" && (
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#ccc', 
                              marginTop: '5px',
                              paddingLeft: '25px'
                            }}>
                              Transfer payment directly to our bank account
                            </div>
                          )}
                        </li>
                      </ul>
                      <div className="form-row place-order">
                        {status && <p style={{ color: "#ffd6d6", marginBottom: 12 }}>{status}</p>}
                        <button type="submit" className="vs-btn style2" disabled={busy || (paymentMethod === "ndps" && !scriptLoaded)}>
                          {busy ? "Placing Order..." : paymentMethod === "ndps" && !scriptLoaded ? "Loading Payment..." : "Place Order"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
        </div>
      </div>
      {/* Checkout Area End */}

      {/* Terms & Conditions Modal for Live Payment Gateway */}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        amount={total}
        isLoading={busy}
        onAccept={handleAcceptTermsAndProceed}
        onCancel={() => {
          setShowTermsModal(false);
          setIsTermsAccepted(false);
        }}
      />
    </main>
  );
}
