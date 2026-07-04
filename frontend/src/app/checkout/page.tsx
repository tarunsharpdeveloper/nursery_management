"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { apiRequest } from "@/lib/api";

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
        // Clean URL
        window.history.replaceState({}, document.title, '/checkout');
      } else if (failed === 'failed') {
        setPaymentError('Payment failed. Please try another payment method or try again.');
        // Clean URL
        window.history.replaceState({}, document.title, '/checkout');
      }
    }
  }, []);

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

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

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
        clearCart(); // Clear cart as order is created
        await handlePayment(response.orderId, total, formData.email, formData.phone);
      } else {
        // For other payment methods (COD, bank transfer, etc.)
        setOrderId(response.orderNumber);
        setIsSubmitted(true);
        clearCart();
        setBusy(false);
      }

    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not place order");
      setBusy(false);
    }
  };

  if (!isLoaded) return <div style={{ minHeight: "60vh" }}></div>;

  if (isSubmitted) {
    return (
      <main>
        <section className="z-index-common breadcumb-wrapper" style={{ backgroundImage: "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuwB_fJjOi4hX4YlC-mm76lRdTPTXJEMgZJM0HdFEaNcfOcC_V1EG6OQk&s=10')", backgroundSize: "cover", backgroundPosition: "center" }}>
          <div className="container">
            <div className="breadcumb-content">
              <h1 className="breadcumb-title">Order Confirmed</h1>
            </div>
          </div>
        </section>

        <section className="space space-extra-bottom">
          <div className="container" style={{ textAlign: "center", padding: "80px 20px" }}>
            {/* Payment Success Banner */}
            {paymentSuccess && (
              <div style={{
                backgroundColor: '#d4edda',
                border: '2px solid #28a745',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '40px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <i 
                    className="fal fa-check-circle" 
                    style={{ fontSize: '32px', color: '#28a745', flexShrink: 0 }}
                  ></i>
                  <div>
                    <h4 style={{ color: '#155724', margin: '0 0 5px 0' }}>✅ Payment Received Successfully!</h4>
                    <p style={{ color: '#155724', margin: 0, fontSize: '14px' }}>
                      Your payment has been processed and your order is confirmed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Error Banner */}
            {paymentError && (
              <div style={{
                backgroundColor: '#f8d7da',
                border: '2px solid #f5c6cb',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '40px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <i 
                    className="fal fa-exclamation-circle" 
                    style={{ fontSize: '32px', color: '#dc3545', flexShrink: 0 }}
                  ></i>
                  <div>
                    <h4 style={{ color: '#721c24', margin: '0 0 5px 0' }}>❌ Payment Failed</h4>
                    <p style={{ color: '#721c24', margin: 0, fontSize: '14px' }}>
                      {paymentError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <i
              className="fal fa-badge-check"
              style={{ fontSize: "70px", color: "var(--brand)", marginBottom: "25px", display: "block" }}
            ></i>
            <h2 style={{ marginBottom: "15px" }}>Thank you for your order!</h2>
            <p style={{ color: "var(--muted)", fontSize: "18px", marginBottom: "10px" }}>
              Your order has been placed successfully.
            </p>
            <p style={{ fontSize: "16px", fontWeight: "600", marginBottom: "30px" }}>
              Order ID: <span style={{ color: "var(--brand)" }}>{orderId}</span>
            </p>
            <p style={{ color: "var(--muted)", maxWidth: "600px", margin: "0 auto 40px auto", lineHeight: "1.7" }}>
              We have received your details and are preparing your plants/seeds for shipment. A confirmation email has been sent, and our team will get in touch with you shortly.
            </p>
            <Link href="/products" className="vs-btn style2">
              Continue Shopping
            </Link>
            <Link href="/my-orders" className="vs-btn" style={{ marginLeft: 12 }}>
              Track Order
            </Link>
          </div>
        </section>
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
                      <div className="col-12 form-group">
                        <input
                          type="checkbox"
                          id="accountNewCreate"
                          checked={createAccount || Boolean(user)}
                          disabled={Boolean(user) || emailExists}
                          onChange={(event) => setCreateAccount(event.target.checked)}
                        />
                        <label htmlFor="accountNewCreate">
                          Send login credentials to my email
                        </label>
                        {emailExists && !user && (
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
                        {!emailExists && createAccount && !user && (
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
                        {!emailExists && !createAccount && !user && (
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
                    <div className="cart_totals">
                      <table>
                        <tbody>
                          <tr>
                            <td>Sub Total</td>
                            <td data-title="Cart Subtotal">
                              <span className="amount"><bdi><span>Rs. </span>{subtotal.toFixed(2)}</bdi></span>
                            </td>
                          </tr>
                          <tr className="shipping">
                            <th>Delivery</th>
                            <td data-title="Shipping and Handling">
                              <ul className="woocommerce-shipping-methods list-unstyled">
                                <li>
                                  <label htmlFor="free_shipping">Free Delivery</label>
                                </li>
                              </ul>
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr className="order-total">
                            <td>Order Total</td>
                            <td data-title="Total">
                              <strong><span className="amount"><bdi><span>Rs. </span>{total.toFixed(2)}</bdi></span></strong>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
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
                          <label htmlFor="payment_method_ndps">
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

    </main>
  );
}
