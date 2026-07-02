"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { apiRequest } from "@/lib/api";
import NDPSPayment from "@/components/NDPSPayment";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, subtotal, shipping, total, clearCart } = useCart();
  const { user, isLoaded, login } = useCustomerAuth();

  const [paymentMethod, setPaymentMethod] = useState("cod"); // Default to COD for testing
  const [sameAddress, setSameAddress] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [orderTotal, setOrderTotal] = useState(0); // Store order total before cart is cleared
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    city: "",
    address: "",
    zip: "",
    phone: "",
  });

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, phone: value.replace(/\D/g, "").slice(0, 10) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    setBusy(true);
    setStatus("");

    try {
      if (!/^\d{10}$/.test(formData.phone)) {
        throw new Error("Phone number must be exactly 10 digits.");
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

      // Store order details and show payment options
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
        // Show NDPS payment component
        setShowPayment(true);
        clearCart(); // Clear cart as order is created
      } else {
        // For other payment methods (COD, bank transfer, etc.)
        setOrderId(response.orderNumber);
        setIsSubmitted(true);
        clearCart();
      }

    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not place order");
    } finally {
      setBusy(false);
    }
  };

  const handlePaymentSuccess = (paymentId: number) => {
    // Payment successful, show success page
    setOrderId(createdOrder?.number || "");
    setIsSubmitted(true);
  };

  const handlePaymentError = (error: string) => {
    setStatus(`Payment failed: ${error}`);
    setBusy(false);
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
          {cartItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <i
                className="fal fa-shopping-cart"
                style={{ fontSize: "60px", color: "var(--brand)", marginBottom: "20px", display: "block" }}
              ></i>
              <h2>No items in your cart</h2>
              <p style={{ color: "var(--muted)", marginBottom: "30px" }}>
                Add items to your cart before proceeding to checkout.
              </p>
              <Link href="/products" className="vs-btn">
                Browse Products
              </Link>
            </div>
          ) : (
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
                        />
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
                          checked={Boolean(user)}
                          disabled={Boolean(user)}
                          onChange={(event) => {
                            if (event.target.checked && !user) {
                              router.push("/login?redirect=/checkout&mode=signup");
                            }
                          }}
                        />
                        <label htmlFor="accountNewCreate">Create an account for later use</label>
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
                          <label htmlFor="payment_method_bacs">🏦 Direct Bank Transfer</label>
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
                        <button type="submit" className="vs-btn style2" disabled={busy}>
                          {busy ? "Placing Order..." : "Place Order"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* NDPS Payment Component */}
          {showPayment && createdOrder && (
            <div className="row justify-content-center" style={{ marginTop: '40px' }}>
              <div className="col-lg-6">
                <div style={{ 
                  backgroundColor: '#fff', 
                  padding: '40px', 
                  borderRadius: '10px', 
                  boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}>
                  <h3 style={{ marginBottom: '20px' }}>Complete Your Payment</h3>
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '20px', 
                    borderRadius: '8px', 
                    marginBottom: '30px' 
                  }}>
                    <p><strong>Order:</strong> {createdOrder.number}</p>
                    <p><strong>Amount:</strong> ₹{orderTotal.toFixed(2)}</p>
                    <p><strong>Customer:</strong> {createdOrder.customer.name}</p>
                  </div>

                  <NDPSPayment
                    orderId={createdOrder.id}
                    amount={orderTotal}
                    customerEmail={createdOrder.customer.email}
                    customerMobile={createdOrder.customer.phone}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />

                  <div style={{ marginTop: '20px' }}>
                    <button 
                      onClick={() => setShowPayment(false)}
                      className="vs-btn style2"
                      style={{ fontSize: '14px' }}
                    >
                      ← Back to Order Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Checkout Area End */}

    </main>
  );
}
