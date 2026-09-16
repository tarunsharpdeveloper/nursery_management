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

  const [paymentMethod, setPaymentMethod] = useState("ndps"); // Default to NDPS
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
  const [paymentTransactionIds, setPaymentTransactionIds] = useState<{
    merchantTxnId: string;
    atomTxnId: string;
    orderNumber?: string;
    amount?: number;
  } | null>(null);

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
      const merchantTxnId = searchParams.get('merchantTxnId');
      const atomTxnId = searchParams.get('atomTxnId');
      const amount = searchParams.get('amount');

      if (success === 'true' && orderNumber) {
        setPaymentSuccess(true);
        setOrderId(orderNumber);
        setIsSubmitted(true);
        
        // Check for transaction IDs from URL parameters first, then localStorage
        if (merchantTxnId || atomTxnId) {
          setPaymentTransactionIds({
            merchantTxnId: merchantTxnId || 'N/A',
            atomTxnId: atomTxnId || 'N/A',
            orderNumber: orderNumber,
            amount: amount ? parseFloat(amount) : undefined
          });
        } else {
          // Fallback to localStorage
          const storedTxnIds = localStorage.getItem('payment_transaction_ids');
          if (storedTxnIds) {
            try {
              const txnData = JSON.parse(storedTxnIds);
              setPaymentTransactionIds(txnData);
              localStorage.removeItem('payment_transaction_ids'); // Clean up
            } catch (e) {
              console.error('Error parsing transaction IDs:', e);
            }
          }
        }
        
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

  // Load AtomPaynetz script dynamically using environment variable
  useEffect(() => {
    const loadAtomScript = () => {
      // Remove existing script if any
      const existingScript = document.querySelector('script[src*="atomcheckout.js"]');
      if (existingScript) {
        existingScript.remove();
      }

      // Get CDN URL from environment variable - fallback to production URL
      const cdnUrl = process.env.NEXT_PUBLIC_NDPS_CDN_URL || 'https://psa.atomtech.in/staticdata/ots/js/atomcheckout.js';

      // Create new script with timestamp to prevent caching
      const script = document.createElement('script');
      script.src = `${cdnUrl}?v=${Date.now()}`;
      script.async = true;
      
      script.onload = () => {
        console.log('✅ AtomPaynetz script loaded successfully from:', cdnUrl);
        setScriptLoaded(true);
      };
      
      script.onerror = () => {
        console.error('❌ Failed to load AtomPaynetz script from:', cdnUrl);
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

  // Rest of the component remains the same...
  // (Success page, form rendering, etc.)
  
  if (!isLoaded) return <div style={{ minHeight: "60vh" }}></div>;

  if (isSubmitted) {
    return (
      <main>
        <section className="z-index-common breadcumb-wrapper" style={{ 
          backgroundImage: "url('https://img.freepik.com/free-photo/pot-with-young-monstera-with-deep-cuts-droplets-water-after-spraying-tropical-liana-dark-background-growing-tropical-plants-home-office_166373-9133.jpg?semt=ais_hybrid&w=740&q=80')", 
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

                  {/* Transaction IDs Section - Only show if available and payment was successful */}
                  {paymentSuccess && paymentTransactionIds && (
                    <div style={{
                      background: "linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%)",
                      border: "2px solid #b8daff",
                      borderRadius: "12px",
                      padding: "20px",
                      margin: "20px 0",
                      textAlign: "left",
                      maxWidth: "500px",
                      marginLeft: "auto",
                      marginRight: "auto"
                    }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "15px"
                      }}>
                        <i className="fal fa-receipt" style={{ color: "#0056b3", fontSize: "18px" }}></i>
                        <h4 style={{ 
                          color: "#0056b3", 
                          margin: 0,
                          fontSize: "16px",
                          fontWeight: "700"
                        }}>
                          Payment Transaction Details
                        </h4>
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ 
                            fontSize: "13px", 
                            color: "#555", 
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px"
                          }}>
                            Merchant Transaction ID:
                          </span>
                          <span style={{ 
                            fontSize: "14px", 
                            fontWeight: "700", 
                            color: "#0056b3",
                            fontFamily: "monospace",
                            background: "#ffffff",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid #b8daff"
                          }}>
                            {paymentTransactionIds.merchantTxnId}
                          </span>
                        </div>
                        
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ 
                            fontSize: "13px", 
                            color: "#555", 
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px"
                          }}>
                            Atom Transaction ID:
                          </span>
                          <span style={{ 
                            fontSize: "14px", 
                            fontWeight: "700", 
                            color: "#0056b3",
                            fontFamily: "monospace",
                            background: "#ffffff",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid #b8daff"
                          }}>
                            {paymentTransactionIds.atomTxnId}
                          </span>
                        </div>
                      </div>

                      <div style={{
                        marginTop: "12px",
                        padding: "10px 12px",
                        background: "#ffffff",
                        borderRadius: "6px",
                        border: "1px solid #b8daff",
                        fontSize: "11px",
                        color: "#666",
                        textAlign: "center"
                      }}>
                        <i className="fal fa-info-circle" style={{ marginRight: "6px", color: "#0056b3" }}></i>
                        Keep these transaction IDs for your records and future reference
                      </div>
                    </div>
                  )}

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
                      className="vs-btn style3"
                      style={{
                        background: "transparent",
                        border: "2px solid #4a7c2e",
                        color: "#4a7c2e",
                        padding: "12px 30px",
                        fontSize: "15px",
                        fontWeight: "600",
                        transition: "all 0.3s ease"
                      }}
                    >
                      <i className="fal fa-seedling" style={{ marginRight: "8px" }}></i>
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // Rest of the form JSX would go here...
  // (The form rendering part remains exactly the same)
  
  return (
    <main>
      {/* Form rendering code would continue here exactly as it was */}
      <div>Checkout Form (Form rendering code remains unchanged)</div>
    </main>
  );
}