"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard, Landmark, Banknote, Wallet, ShieldCheck, Truck } from "lucide-react";
import { products } from "@/lib/demo-data";

const cartItems = products.slice(0, 2).map((product) => ({
  ...product,
  quantity: product.id === 1 ? 2 : 1
}));

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [sameAddress, setSameAddress] = useState(true);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 1000 ? 0 : 120;
  const total = subtotal + shipping;

  return (
    <main>
      {/* Hero */}
      <section className="checkout-hero">
        <div>
          <h1>Checkout</h1>
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Checkout</span>
          </div>
        </div>
      </section>

      <section className="section checkout-layout">
        {/* Billing Details */}
        <div className="checkout-billing">
          <h2>Billing Details</h2>
          <div className="checkout-form">
            <div className="form-grid two">
              <label className="field">
                <span>Complete Name</span>
                <input placeholder="Enter your full name" />
              </label>
              <label className="field">
                <span>Email Address</span>
                <input type="email" placeholder="you@example.com" />
              </label>
            </div>
            <div className="form-grid two">
              <label className="field">
                <span>Phone Number</span>
                <input type="tel" placeholder="+91 ..." />
              </label>
              <label className="field">
                <span>Town / City</span>
                <input placeholder="e.g. Ujjain" />
              </label>
            </div>
            <div className="form-grid two">
              <label className="field">
                <span>Postcode / Zip</span>
                <input placeholder="456001" />
              </label>
              <label className="field">
                <span>State</span>
                <input placeholder="Madhya Pradesh" />
              </label>
            </div>
            <label className="field" style={{ marginTop: 4 }}>
              <span>Street Address</span>
              <input placeholder="House number and street name" />
            </label>
            <label className="field">
              <span>Order Notes <small>(optional)</small></span>
              <textarea rows={4} placeholder="Special notes for delivery, e.g. gate code or landmark" />
            </label>
            <div className="checkout-checkboxes">
              <label className="checkout-checkbox">
                <input type="checkbox" checked={sameAddress} onChange={(e) => setSameAddress(e.target.checked)} />
                <span>Deliver to the same address</span>
              </label>
            </div>
          </div>
        </div>

        {/* Cart Totals & Payment */}
        <div className="checkout-sidebar">
          {/* Cart Totals Card */}
          <div className="checkout-totals-card">
            <h3>Cart Totals</h3>
            <div className="checkout-totals-box">
              <div className="checkout-totals-row">
                <span>Sub Total</span>
                <strong>Rs. {subtotal.toLocaleString("en-IN")}</strong>
              </div>
              <div className="checkout-totals-row">
                <span>Delivery</span>
                <strong>{shipping === 0 ? "Free Shipping" : `Rs. ${shipping}`}</strong>
              </div>
              <div className="checkout-totals-row total">
                <span>Order Total</span>
                <strong>Rs. {total.toLocaleString("en-IN")}</strong>
              </div>
            </div>
          </div>

          {/* Payment Method Card */}
          <div className="checkout-totals-card">
            <h3>Payment Method</h3>
            <div className="checkout-payment-options">
              <label className={`checkout-payment-option ${paymentMethod === "upi" ? "active" : ""}`}>
                <input type="radio" name="payment" value="upi" checked={paymentMethod === "upi"} onChange={() => setPaymentMethod("upi")} />
                <Wallet size={18} />
                <span>UPI</span>
              </label>
              <label className={`checkout-payment-option ${paymentMethod === "credit_card" ? "active" : ""}`}>
                <input type="radio" name="payment" value="credit_card" checked={paymentMethod === "credit_card"} onChange={() => setPaymentMethod("credit_card")} />
                <CreditCard size={18} />
                <span>Credit Card</span>
              </label>
              <label className={`checkout-payment-option ${paymentMethod === "net_banking" ? "active" : ""}`}>
                <input type="radio" name="payment" value="net_banking" checked={paymentMethod === "net_banking"} onChange={() => setPaymentMethod("net_banking")} />
                <Landmark size={18} />
                <span>Net Banking</span>
              </label>
              <label className={`checkout-payment-option ${paymentMethod === "cash" ? "active" : ""}`}>
                <input type="radio" name="payment" value="cash" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} />
                <Banknote size={18} />
                <span>Cash on Delivery</span>
              </label>
            </div>
            <button className="button checkout-place-order" type="button">
              Place Order
            </button>
          </div>

          {/* Trust badges */}
          <div className="checkout-trust">
            <div><ShieldCheck size={18} /> Secure checkout</div>
            <div><Truck size={18} /> Local dispatch support</div>
          </div>
        </div>
      </section>
    </main>
  );
}
