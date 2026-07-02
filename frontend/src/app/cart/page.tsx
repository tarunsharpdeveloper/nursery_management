"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

const DEFAULT_IMG =
  "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80";

export default function CartPage() {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    subtotal,
    shipping,
    total,
  } = useCart();

  return (
    <main>
      {/* breadcumb */}
      <section className="z-index-common breadcumb-wrapper" style={{ backgroundImage: "url('https://www.shutterstock.com/image-photo/on-rainy-day-garden-nursery-260nw-2415197075.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="container">
          <div className="row justify-content-between align-items-center">
            <div className="col-auto">
              <div className="breadcumb-content">
                <h1 className="breadcumb-title">Cart</h1>
                <div className="breadcumb-menu-wrap">
                  <ul className="breadcumb-menu">
                    <li><Link href="/">Home</Link></li>
                    <li>Cart</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cart Area */}
      <div className="vs-product-wrapper space-top space-extra-bottom">
        <div className="container">
          {cartItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <i
                className="fal fa-shopping-basket"
                style={{ fontSize: "60px", color: "var(--brand)", marginBottom: "20px", display: "block" }}
              ></i>
              <h2>Your cart is empty</h2>
              <p style={{ color: "var(--muted)", marginBottom: "30px" }}>
                Browse our wide collection of healthy plants and seeds to fill your cart.
              </p>
              <Link href="/products" className="vs-btn">
                Browse Products
              </Link>
            </div>
          ) : (
            <>
              <form action="#" className="woocommerce-cart-form" onSubmit={(e) => e.preventDefault()}>
                <table className="cart_table">
                  <thead>
                    <tr>
                      <th className="cart-col-productname">Product Detail</th>
                      <th className="cart-col-price">Price</th>
                      <th className="cart-col-quantity">Quantity</th>
                      <th className="cart-col-total">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item) => {
                      const cartKey = item.cartKey || String(item.id);

                      return (
                        <tr className="cart_item" key={cartKey}>
                          <td data-title="Name">
                            <div className="d-flex align-items-center gap-4">
                              <Link className="cart-productimage" href={`/products/${item.id}`}>
                                <img
                                  width={91}
                                  height={91}
                                  src={item.photo_url || DEFAULT_IMG}
                                  alt={item.name}
                                  style={{ objectFit: "cover", borderRadius: "10px" }}
                                />
                              </Link>
                              <div className="cart_item__des">
                                <Link className="cart-productname" href={`/products/${item.id}`}>
                                  {item.name}
                                </Link>
                                <span>{item.category}</span>
                              </div>
                            </div>
                          </td>
                          <td data-title="Price">
                            <span className="amount">
                              <bdi>
                                <span>Rs. </span>
                                {item.selling_price.toFixed(2)}
                              </bdi>
                            </span>
                          </td>
                          <td data-title="Quantity">
                            <div className="quantity">
                              <div className="quantity__field quantity-container">
                                <input
                                  type="number"
                                  id={`quantity-${cartKey}`}
                                  className="qty-input"
                                  step="1"
                                  min="1"
                                  max={item.available_quantity || 99}
                                  name="quantity"
                                  value={item.quantity}
                                  onChange={(e) => updateQuantity(cartKey, Number(e.target.value))}
                                  title="Qty"
                                />
                                <div className="quantity__buttons">
                                  <button
                                    type="button"
                                    className="quantity-plus qty-btn"
                                    onClick={() => updateQuantity(cartKey, item.quantity + 1)}
                                  >
                                    <i className="fas fa-caret-up"></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="quantity-minus qty-btn"
                                    onClick={() => updateQuantity(cartKey, item.quantity - 1)}
                                  >
                                    <i className="fas fa-caret-down"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td data-title="Total">
                            <span className="amount">
                              <bdi>
                                <span>Rs. </span>
                                {(item.selling_price * item.quantity).toFixed(2)}
                              </bdi>
                            </span>
                            <button
                              className="remove ms-3"
                              type="button"
                              onClick={() => removeFromCart(cartKey)}
                              aria-label={`Remove ${item.name}`}
                              style={{ border: "none", background: "transparent" }}
                            >
                              <i className="fal fa-trash-alt text-danger"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </form>

              <div className="cart-footer d-flex flex-wrap gap-4 align-items-center justify-content-center justify-content-md-between">
                <Link href="/checkout" className="vs-btn style2">PROCEED TO CHECKOUT</Link>
                <Link href="/products" className="vs-btn style2">Continue Shopping</Link>
              </div>

              <div className="row" style={{ marginTop: "40px" }}>
                {/* Coupon Column */}
                <div className="col-lg-5">
                  <div className="vs-cart-coupon">
                    <h2 className="h4 summary-title">APPLY COUPON</h2>
                    <input type="text" className="form-control" placeholder="Coupon Code..." />
                    <button type="button" className="vs-btn w-100">Apply Coupon</button>
                  </div>
                </div>

                {/* Cart Totals Column */}
                <div className="col-lg-7" style={{ marginTop: "0" }}>
                  <div style={{
                    background: "linear-gradient(145deg, #f6fdf0 0%, #eaf5d9 100%)",
                    borderRadius: "24px",
                    padding: "32px",
                    border: "2px solid #cfe9a4",
                    boxShadow: "0 8px 32px rgba(140,198,63,0.10)"
                  }}>
                    {/* Title */}
                    <h2 style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "#1a1a1a",
                      marginBottom: "24px",
                      textTransform: "uppercase",
                      letterSpacing: "1.5px",
                      paddingBottom: "12px",
                      borderBottom: "2px solid #cfe9a4"
                    }}>
                      Cart Totals
                    </h2>

                    {/* Sub Total */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 16px",
                      background: "rgba(255,255,255,0.7)",
                      borderRadius: "12px",
                      marginBottom: "10px"
                    }}>
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "#555" }}>Sub Total</span>
                      <span style={{ fontSize: "16px", fontWeight: 700, color: "#1a1a1a" }}>
                        Rs.&nbsp;{subtotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Delivery */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 16px",
                      background: "rgba(255,255,255,0.7)",
                      borderRadius: "12px",
                      marginBottom: "20px"
                    }}>
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "#555" }}>
                        <i className="fas fa-truck" style={{ marginRight: "8px", color: "#8cc63f" }}></i>
                        Delivery
                      </span>
                      <span>
                        {shipping === 0 ? (
                          <span style={{
                            background: "#8cc63f",
                            color: "white",
                            borderRadius: "20px",
                            padding: "4px 14px",
                            fontSize: "13px",
                            fontWeight: 700
                          }}>FREE</span>
                        ) : (
                          <span style={{ fontSize: "16px", fontWeight: 700, color: "#1a1a1a" }}>
                            Rs.&nbsp;{shipping.toFixed(2)}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Order Total Banner */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "18px 20px",
                      background: "linear-gradient(135deg, #8cc63f 0%, #5d9c1a 100%)",
                      borderRadius: "16px",
                      boxShadow: "0 6px 20px rgba(140,198,63,0.35)",
                      marginBottom: "24px"
                    }}>
                      <span style={{ fontSize: "15px", fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "1px" }}>
                        Order Total
                      </span>
                      <span style={{ fontSize: "22px", fontWeight: 800, color: "white" }}>
                        Rs.&nbsp;{total.toFixed(2)}
                      </span>
                    </div>

                    {/* Checkout Button */}
                    <Link
                      href="/checkout"
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "10px",
                        background: "linear-gradient(135deg, #2d6a3f 0%, #1b4228 100%)",
                        color: "white",
                        padding: "16px 24px",
                        borderRadius: "50px",
                        fontWeight: 700,
                        fontSize: "14px",
                        textTransform: "uppercase",
                        letterSpacing: "1.5px",
                        textDecoration: "none",
                        boxShadow: "0 4px 16px rgba(45,106,63,0.35)",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease"
                      }}
                    >
                      <i className="fas fa-lock"></i>
                      Proceed to Secure Checkout
                    </Link>

                    <p style={{ textAlign: "center", fontSize: "12px", color: "#888", marginTop: "14px", marginBottom: 0 }}>
                      <i className="fas fa-shield-alt" style={{ marginRight: "5px", color: "#8cc63f" }}></i>
                      Secure &amp; Encrypted Checkout
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Cart Area End */}
    </main>
  );
}
