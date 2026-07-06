"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, PackageCheck, Search, Truck } from "lucide-react";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { apiRequest } from "@/lib/api";

type CustomerOrder = {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  customer_name: string;
  phone: string;
  email: string;
  items: {
    product_name: string;
    product_type: string;
    photo_url: string | null;
    available_quantity: number;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
};

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, isLoaded } = useCustomerAuth();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [status, setStatus] = useState("Enter your email, phone, or order number to track products.");
  const [busy, setBusy] = useState(false);

  async function loadOrders(nextEmail = email, nextPhone = phone, nextOrderNumber = orderNumber) {
    const params = new URLSearchParams();
    if (nextEmail.trim()) params.set("email", nextEmail.trim());
    if (nextPhone.trim()) params.set("phone", nextPhone.trim());
    if (nextOrderNumber.trim()) params.set("orderNumber", nextOrderNumber.trim());

    if (!params.toString()) {
      setStatus("Enter your email, phone, or order number to track products.");
      setOrders([]);
      return;
    }

    setBusy(true);
    try {
      const data = await apiRequest<CustomerOrder[]>(`/api/customer-orders?${params.toString()}`);
      setOrders(data);
      setStatus(data.length ? `Found ${data.length} order${data.length === 1 ? "" : "s"}` : "No matching orders found");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load orders");
      setOrders([]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        router.push("/login?redirect=/my-orders");
      } else {
        setEmail(user.email || "");
        loadOrders(user.email || "", "", "");
      }
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) return <div style={{ minHeight: "60vh" }}></div>;

  return (
    <main>
      <section className="z-index-common breadcumb-wrapper my-orders-hero" style={{ backgroundImage: "url('https://img.magnific.com/free-photo/monstera-leaves-with-deep-cuts-water-droplets-after-spraying-closeup-dark-background-growing-tropical-plants-home-office_166373-9135.jpg?semt=ais_hybrid&w=740&q=80')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="container">
          <div className="breadcumb-content">
            <h1 className="breadcumb-title">My Orders</h1>
            <div className="breadcumb-menu-wrap">
              <ul className="breadcumb-menu">
                <li><Link href="/">Home</Link></li>
                <li>Order Tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="my-orders-page space-top space-extra-bottom">
        <div className="container">
          <div className="my-orders-heading">
            <span className="sec-subtitle">Track your nursery purchase</span>
            <h2 className="sec-title">Order Tracking</h2>
            <p>{status}</p>
          </div>

          <form className="order-track-panel" onSubmit={(event) => { event.preventDefault(); loadOrders(); }}>
            <div className="order-track-icon">
              <PackageCheck size={28} />
            </div>
            <div className="order-track-fields">
              <label className="order-track-field">
                <span>Email</span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="customer@example.com" />
              </label>
              <label className="order-track-field">
                <span>Phone</span>
                <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="9876543210" />
              </label>
              <label className="order-track-field">
                <span>Order Number</span>
                <input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="ORD-..." />
              </label>
            </div>
            <button className="vs-btn style2 order-track-submit" type="submit" disabled={busy}>
              <Search size={20} />
              {busy ? "Tracking..." : "Track Order"}
            </button>
          </form>

          {orders.length ? (
            <div className="order-card-list">
              {orders.map((order) => (
                <article className="order-card" key={order.id}>
                  {/* Payment Status Banner */}
                  {order.payment_status === "paid" && (
                    <div style={{
                      backgroundColor: "#d4edda",
                      borderLeft: "4px solid #28a745",
                      padding: "12px 20px",
                      marginBottom: "20px",
                      borderRadius: "4px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "20px" }}>✓</span>
                        <div>
                          <strong style={{ color: "#155724", fontSize: "14px" }}>Payment Successful</strong>
                          <p style={{ color: "#155724", fontSize: "12px", margin: "2px 0 0 0" }}>
                            Your payment has been received and confirmed
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {order.payment_status === "failed" && (
                    <div style={{
                      backgroundColor: "#f8d7da",
                      borderLeft: "4px solid #dc3545",
                      padding: "12px 20px",
                      marginBottom: "20px",
                      borderRadius: "4px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "20px" }}>✕</span>
                        <div>
                          <strong style={{ color: "#721c24", fontSize: "14px" }}>Payment Failed</strong>
                          <p style={{ color: "#721c24", fontSize: "12px", margin: "2px 0 0 0" }}>
                            Payment was not successful. Please try again or contact support.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {order.payment_status === "pending" && (
                    <div style={{
                      backgroundColor: "#fff3cd",
                      borderLeft: "4px solid #ffc107",
                      padding: "12px 20px",
                      marginBottom: "20px",
                      borderRadius: "4px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "20px" }}>⏱</span>
                        <div>
                          <strong style={{ color: "#856404", fontSize: "14px" }}>Payment Pending</strong>
                          <p style={{ color: "#856404", fontSize: "12px", margin: "2px 0 0 0" }}>
                            Waiting for payment confirmation
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="order-card-header">
                    <div>
                      <span className="order-number">{order.order_number}</span>
                      <h3>{order.customer_name}</h3>
                      <div className="order-date">
                        <CalendarDays size={16} />
                        {new Date(order.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })}
                      </div>
                    </div>
                    <div className="order-card-status">
                      <span className="order-status-pill">{order.status}</span>
                      <span 
                        className="payment-status"
                        style={{
                          padding: "6px 14px",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: "600",
                          textTransform: "capitalize",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          backgroundColor: 
                            order.payment_status === "paid" ? "#d4edda" :
                            order.payment_status === "failed" ? "#f8d7da" :
                            order.payment_status === "pending" ? "#fff3cd" :
                            "#e2e3e5",
                          color: 
                            order.payment_status === "paid" ? "#155724" :
                            order.payment_status === "failed" ? "#721c24" :
                            order.payment_status === "pending" ? "#856404" :
                            "#383d41",
                          border: `1px solid ${
                            order.payment_status === "paid" ? "#c3e6cb" :
                            order.payment_status === "failed" ? "#f5c6cb" :
                            order.payment_status === "pending" ? "#ffeaa7" :
                            "#d6d8db"
                          }`
                        }}
                      >
                        {order.payment_status === "paid" && <span>✓</span>}
                        {order.payment_status === "failed" && <span>✕</span>}
                        {order.payment_status === "pending" && <span>⏱</span>}
                        {order.payment_status}
                      </span>
                    </div>
                  </div>

                  <div className="order-progress">
                    {["received", "approved", "dispatch", "delivered"].map((step) => (
                      <div className={`order-progress-step ${step === order.status ? "active" : ""}`} key={step}>
                        <span></span>
                        {step}
                      </div>
                    ))}
                  </div>

                  <div className="order-products">
                    {order.items.map((item, index) => (
                      <div className="order-product" key={`${order.id}-${item.product_name}-${index}`}>
                        <div className="order-product-image">
                          {item.photo_url ? (
                            <img 
                              src={item.photo_url} 
                              alt={item.product_name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                padding: "8px"
                              }}
                              onError={(e) => {
                                // Fallback image if the URL fails to load
                                e.currentTarget.src = "https://dms.mydukaan.io/original/jpeg/media/54ecc558-e85c-462a-b5e5-692caad96f53.jpg";
                              }}
                            />
                          ) : (
                            <div style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "#f5f5f5"
                            }}>
                              <Truck size={24} color="#999" />
                            </div>
                          )}
                        </div>
                        <div className="order-product-main">
                          <h4>{item.product_name}</h4>
                          <p>{item.product_type} | Qty {item.quantity} | Current stock {item.available_quantity}</p>
                        </div>
                        <div className="order-product-price">
                          <span>Rs. {item.line_total.toLocaleString("en-IN")}</span>
                          <small>Rs. {item.unit_price.toLocaleString("en-IN")} each</small>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="order-card-footer">
                    <span>Total Amount</span>
                    <strong>Rs. {order.total_amount.toLocaleString("en-IN")}</strong>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="order-empty-state">
              <PackageCheck size={44} />
              <h3>No tracking data loaded</h3>
              <p>Use your order number, email, or phone number to find your nursery product updates.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
