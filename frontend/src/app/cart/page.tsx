"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { getMediaUrl } from "@/lib/api";

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
                {/* Desktop Table View */}
                <div className="cart-table-wrapper">
                  <table className="cart_table">
                    <thead>
                      <tr>
                        <th className="cart-col-productname">Product Detail</th>
                        <th className="cart-col-price">Price</th>
                        <th className="cart-col-quantity" style={{ textAlign: 'center' }}>Quantity</th>
                        <th className="cart-col-total">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item) => {
                        const cartKey = item.cartKey || String(item.id);

                        return (
                          <tr className="cart_item" key={cartKey}>
                            <td data-title="Name">
                              <div className="d-flex flex-column flex-md-row align-items-center gap-3 gap-md-4">
                                <Link className="cart-productimage" href={`/products/${item.id}`}>
                                  <img
                                    width={91}
                                    height={91}
                                    src={getMediaUrl(item.photo_url) || DEFAULT_IMG}
                                    alt={item.name}
                                    style={{ objectFit: "cover", borderRadius: "10px" }}
                                  />
                                </Link>
                                <div className="cart_item__des text-center text-md-start">
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
                            <td data-title="Quantity" style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                              <div className="quantity" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                <div className="quantity__field quantity-container" style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  background: '#f8fdf5', 
                                  borderRadius: '30px', 
                                  padding: '4px',
                                  border: '1px solid #c3e6cb',
                                  margin: '0 auto',
                                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                }}>
                                  <button
                                    type="button"
                                    className="qty-btn"
                                    onClick={() => updateQuantity(cartKey, item.quantity - 1)}
                                    style={{ 
                                      width: '32px',
                                      height: '32px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: 'none', 
                                      background: '#ffffff', 
                                      cursor: 'pointer', 
                                      borderRadius: '50%', 
                                      fontSize: '14px',
                                      color: '#2d5016',
                                      boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    <i className="fal fa-minus"></i>
                                  </button>
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
                                    style={{ 
                                      width: '46px', 
                                      border: 'none', 
                                      background: 'transparent',
                                      textAlign: 'center',
                                      fontWeight: '700',
                                      fontSize: '16px',
                                      color: '#2d5016',
                                      padding: '0'
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className="qty-btn"
                                    onClick={() => updateQuantity(cartKey, item.quantity + 1)}
                                    style={{ 
                                      width: '32px',
                                      height: '32px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: 'none', 
                                      background: '#ffffff', 
                                      cursor: 'pointer', 
                                      borderRadius: '50%', 
                                      fontSize: '14px',
                                      color: '#2d5016',
                                      boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    <i className="fal fa-plus"></i>
                                  </button>
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
                </div>

                {/* Mobile/Tablet Card View */}
                <div className="cart-mobile-cards">
                  {cartItems.map((item) => {
                    const cartKey = item.cartKey || String(item.id);

                    return (
                      <div className="cart-card" key={cartKey}>
                        {/* Top Section: Image and Header */}
                        <div className="cart-card-top">
                          <div className="cart-card-image-container">
                            <Link className="cart-card-image-link" href={`/products/${item.id}`}>
                              <img
                                width={120}
                                height={160}
                                src={getMediaUrl(item.photo_url) || DEFAULT_IMG}
                                alt={item.name}
                                style={{ objectFit: "contain", borderRadius: "12px", width: "100%", height: "160px", padding: "8px" }}
                              />
                            </Link>
                          </div>

                          {/* Header with Title and Delete */}
                          <div className="cart-card-header">
                            <Link href={`/products/${item.id}`} style={{ textDecoration: "none", flex: 1 }}>
                              <h3 className="cart-card-title">{item.name}</h3>
                            </Link>
                            <button
                              className="cart-card-remove"
                              type="button"
                              onClick={() => removeFromCart(cartKey)}
                              aria-label={`Remove ${item.name}`}
                              title="Remove from cart"
                            >
                              <i className="fal fa-trash-alt"></i>
                            </button>
                          </div>
                        </div>

                        {/* Category */}
                        <p className="cart-card-category">{item.category}</p>

                        {/* Price Row */}
                        <div className="cart-card-price-row">
                          <span className="cart-card-label">Price</span>
                          <span className="cart-card-price">
                            Rs. {item.selling_price.toFixed(2)}
                          </span>
                        </div>

                        {/* Quantity Row - Horizontal */}
                        <div className="cart-card-qty-row">
                          <span className="cart-card-label">Qty</span>
                          <div className="quantity__field quantity-container-mobile" style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #f8fdf5 0%, #f0fae8 100%)', 
                            borderRadius: '24px', 
                            padding: '3px 6px',
                            border: '1.5px solid #dfe9d1',
                            boxShadow: '0 3px 8px rgba(45,80,22,0.08), inset 0 1px 3px rgba(255,255,255,0.6)'
                          }}>
                            <button
                              type="button"
                              className="qty-btn-mobile"
                              onClick={() => updateQuantity(cartKey, item.quantity - 1)}
                              style={{ 
                                width: '26px',
                                height: '26px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'none', 
                                background: '#ffffff', 
                                cursor: 'pointer', 
                                borderRadius: '50%', 
                                fontSize: '11px',
                                color: '#2d5016',
                                boxShadow: '0 2px 5px rgba(45,80,22,0.12), inset 0 1px 2px rgba(255,255,255,0.8)',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <i className="fal fa-minus"></i>
                            </button>
                            <input
                              type="number"
                              id={`quantity-mobile-${cartKey}`}
                              className="qty-input-mobile"
                              step="1"
                              min="1"
                              max={item.available_quantity || 99}
                              name="quantity"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(cartKey, Number(e.target.value))}
                              title="Qty"
                              style={{ 
                                width: '36px', 
                                border: 'none', 
                                background: 'transparent',
                                textAlign: 'center',
                                fontWeight: '700',
                                fontSize: '13px',
                                color: '#2d5016',
                                padding: '0'
                              }}
                            />
                            <button
                              type="button"
                              className="qty-btn-mobile"
                              onClick={() => updateQuantity(cartKey, item.quantity + 1)}
                              style={{ 
                                width: '26px',
                                height: '26px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'none', 
                                background: '#ffffff', 
                                cursor: 'pointer', 
                                borderRadius: '50%', 
                                fontSize: '11px',
                                color: '#2d5016',
                                boxShadow: '0 2px 5px rgba(45,80,22,0.12), inset 0 1px 2px rgba(255,255,255,0.8)',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <i className="fal fa-plus"></i>
                            </button>
                          </div>
                        </div>

                        {/* Subtotal */}
                        <div className="cart-card-subtotal">
                          <span className="cart-card-label">Subtotal</span>
                          <span className="cart-card-total">
                            Rs. {(item.selling_price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </form>

              <div className="cart-footer d-flex flex-wrap gap-4 align-items-center justify-content-center justify-content-md-between">
                <Link href="/checkout" className="vs-btn style2">PROCEED TO CHECKOUT</Link>
                <Link href="/products" className="vs-btn style2">Continue Shopping</Link>
              </div>

              <div className="cart-summary-section">
                {/* Coupon Column */}
                <div className="cart-summary-coupon">
                  <div className="vs-cart-coupon">
                    <h2 className="h4 summary-title">APPLY COUPON</h2>
                    <input type="text" className="form-control" placeholder="Coupon Code..." />
                    <button type="button" className="vs-btn w-100">Apply Coupon</button>
                  </div>
                </div>

                {/* Cart Totals Column */}
                <div className="cart-summary-totals">
                  <div style={{
                    background: "linear-gradient(145deg, #f6fdf0 0%, #eaf5d9 100%)",
                    borderRadius: "24px",
                    padding: "32px",
                    border: "2px solid #cfe9a4",
                    boxShadow: "0 8px 32px rgba(140,198,63,0.10)",
                    textAlign:'center'
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
                      <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "1px" }}>
                        Order Total
                      </span>
                      <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "white" }}>
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
      
      <style jsx>{`
        /* Keep original design structure, but override font sizes and padding to prevent bloated UI */
        .cart_table th {
          font-size: 15px !important;
        }
        .cart_table td {
          font-size: 14px !important;
        }
        .cart_table .cart-productname {
          font-size: 15px !important;
        }
        .cart_table .cart_item__des span {
          font-size: 12px !important;
        }
        .cart_table .amount {
          font-size: 15px !important;
        }
        
        .qty-input::-webkit-outer-spin-button,
        .qty-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .qty-input[type=number] {
          -moz-appearance: textfield;
        }
        .qty-btn:hover {
          background: #2d5016 !important;
          color: white !important;
          transform: scale(1.05);
        }
        .qty-btn:active {
          transform: scale(0.95);
        }

        /* Mobile/Tablet Card Styles - Beautiful Design */
        .cart-mobile-cards {
          display: none;
        }

        .cart-card {
          background: linear-gradient(135deg, #ffffff 0%, #fafbf8 100%);
          border: 1.5px solid #e8ede3;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 4px 15px rgba(45, 80, 22, 0.08), 0 1px 3px rgba(0,0,0,0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: grid;
          gap: 14px;
        }

        .cart-card:hover {
          box-shadow: 0 8px 25px rgba(45, 80, 22, 0.15), 0 2px 6px rgba(0,0,0,0.08);
          transform: translateY(-2px);
          border-color: #dfe9d1;
        }

        .cart-card-top {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: stretch;
        }

        .cart-card-image-container {
          display: block;
          border-radius: 12px;
          overflow: hidden;
          background: linear-gradient(135deg, #f5f7f3 0%, #f0fae8 100%);
          border: 1px solid #e8ede3;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 160px;
        }

        .cart-card-image-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }

        .cart-card-image-link img {
          max-width: 100%;
          max-height: 160px;
          width: auto;
          height: auto;
        }

        .cart-card-content {
          display: grid;
          gap: 12px;
        }

        .cart-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .cart-card-title {
          font-size: 16px;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0;
          line-height: 1.3;
          flex: 1;
        }

        .cart-card-category {
          font-size: 13px;
          color: #888;
          margin: 0;
          font-weight: 600;
          text-transform: capitalize;
        }

        .cart-card-info-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 0;
          border-top: 1px solid #f0f0f0;
          border-bottom: 1px solid #f0f0f0;
        }

        .cart-card-price-box,
        .cart-card-qty-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .cart-card-price-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 12px;
          padding: 12px 0;
          border-top: 1px solid #f0f0f0;
          border-bottom: 1px solid #f0f0f0;
        }

        .cart-card-qty-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 12px;
          padding: 12px 0;
        }

        .cart-card-label {
          font-weight: 700;
          color: #888;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .cart-card-price {
          font-weight: 800;
          color: #1a1a1a;
          font-size: 15px;
        }

        .cart-card-subtotal {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: linear-gradient(135deg, #f8fdf5 0%, #f0fae8 100%);
          border-radius: 12px;
          border: 1px solid #e8ede3;
        }

        .cart-card-total {
          font-weight: 850;
          color: #2d5016;
          font-size: 16px;
        }

        /* Tablet and Mobile - Smaller Font Sizes */
        @media (max-width: 991px) {
          .cart-card-label {
            font-size: 11px;
          }

          .cart-card-price {
            font-size: 14px;
          }

          .cart-card-total {
            font-size: 15px;
          }
        }

        @media (max-width: 767px) {
          .cart-card-label {
            font-size: 10px;
            letter-spacing: 0.3px;
          }

          .cart-card-price {
            font-size: 13px;
          }

          .cart-card-total {
            font-size: 14px;
          }

          .cart-card-subtotal {
            padding: 10px;
            gap: 8px;
          }
        }

        .quantity-container-mobile {
          gap: 3px;
        }

        .qty-input-mobile::-webkit-outer-spin-button,
        .qty-input-mobile::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .qty-input-mobile[type=number] {
          -moz-appearance: textfield;
        }

        .qty-btn-mobile:hover {
          background: linear-gradient(135deg, #2d5016 0%, #1b4228 100%) !important;
          color: white !important;
          transform: scale(1.12);
          box-shadow: 0 4px 10px rgba(45,80,22,0.25) !important;
        }

        .qty-btn-mobile:active {
          transform: scale(0.88);
        }

        /* Mobile specific - smaller buttons */
        @media (max-width: 991px) {
          .qty-btn-mobile {
            width: 22px !important;
            height: 22px !important;
            font-size: 9px !important;
          }

          .qty-input-mobile {
            width: 32px !important;
            font-size: 12px !important;
          }

          .quantity-container-mobile {
            padding: 2px 4px !important;
          }
        }

        @media (max-width: 767px) {
          .qty-btn-mobile {
            width: 20px !important;
            height: 20px !important;
            font-size: 8px !important;
          }

          .qty-input-mobile {
            width: 28px !important;
            font-size: 11px !important;
          }

          .quantity-container-mobile {
            padding: 2px 3px !important;
            border-radius: 20px !important;
          }
        }

        .cart-card-remove {
          background: none;
          border: none;
          color: #b42318;
          cursor: pointer;
          font-size: 16px;
          padding: 4px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          border-radius: 6px;
          opacity: 0.7;
        }

        .cart-card-remove:hover {
          transform: scale(1.2);
          opacity: 1;
          background: rgba(180, 35, 24, 0.08);
        }

        .cart-table-wrapper {
          display: block;
          overflow-x: auto;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }

        .cart_table {
          background: white;
        }

        /* Cart Summary Section - Responsive Layout */
        .cart-summary-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          margin-top: 40px;
        }

        .cart-summary-coupon {
          display: block;
        }

        .cart-summary-totals {
          display: block;
        }

        .vs-cart-coupon {
          background: linear-gradient(135deg, #ffffff 0%, #fafbf8 100%);
          border: 1.5px solid #e8ede3;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 15px rgba(45, 80, 22, 0.08);
        }

        .vs-cart-coupon .summary-title {
          font-size: 16px;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .vs-cart-coupon .form-control {
          border: 1.5px solid #e8ede3;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 14px;
          margin-bottom: 12px;
          transition: all 0.2s ease;
        }

        .vs-cart-coupon .form-control:focus {
          border-color: #2d5016;
          box-shadow: 0 0 0 3px rgba(45, 80, 22, 0.1);
          outline: none;
        }

        /* Cart Totals Section - Responsive Font Sizes */
        @media (max-width: 991px) {
          .vs-cart-coupon .summary-title {
            font-size: 14px;
            margin-bottom: 14px;
          }

          .vs-cart-coupon .form-control {
            font-size: 13px;
            padding: 10px 12px;
            margin-bottom: 10px;
          }
        }

        @media (max-width: 767px) {
          .vs-cart-coupon {
            padding: 18px;
          }

          .vs-cart-coupon .summary-title {
            font-size: 13px;
            margin-bottom: 12px;
            letter-spacing: 1px;
          }

          .vs-cart-coupon .form-control {
            font-size: 12px;
            padding: 9px 11px;
            margin-bottom: 8px;
          }

          .vs-cart-coupon .vs-btn {
            font-size: 12px;
            padding: 12px 16px;
          }
        }

        /* Desktop - Show table, hide cards */
        @media (min-width: 992px) {
          .cart-table-wrapper {
            display: block;
          }
          .cart-mobile-cards {
            display: none;
          }
          .cart-summary-section {
            grid-template-columns: 1fr 1.4fr;
            gap: 28px;
            margin-top: 40px;
          }
        }

        /* Tablet and Mobile - Show cards, hide table */
        @media (max-width: 991px) {
          .cart-table-wrapper {
            display: none;
          }
          .cart-mobile-cards {
            display: block;
          }
          .cart-summary-section {
            grid-template-columns: 1fr;
            gap: 24px;
            margin-top: 28px;
          }
        }

        @media (max-width: 767px) {
          .cart_table td[data-title="Name"] {
            padding-left: 15px !important;
            text-align: center !important;
          }
          .cart_table td[data-title="Name"]::before {
            display: none !important;
          }
          .cart_table td[data-title="Name"] > div {
            justify-content: center !important;
          }

          .cart-card {
            padding: 14px;
            margin-bottom: 14px;
          }

          .cart-card-title {
            font-size: 15px;
          }

          .cart-card-label {
            font-size: 11px;
          }

          .cart-card-price {
            font-size: 14px;
          }

          .cart-card-total {
            font-size: 15px;
          }

          .cart-summary-section {
            grid-template-columns: 1fr;
            gap: 20px;
            margin-top: 24px;
          }

          .vs-cart-coupon {
            padding: 20px;
          }
        }

        /* Large Desktop */
        @media (min-width: 1400px) {
          .cart-table-wrapper {
            display: block;
          }
          .cart-summary-section {
            grid-template-columns: 1fr 1.4fr;
            gap: 32px;
          }
        }

        /* Responsive Cart Totals Box Font Sizes */
        @media (max-width: 991px) {
          /* Cart totals summary title */
          [style*="font-size: 18px"][style*="font-weight: 800"] {
            font-size: 16px !important;
            margin-bottom: 18px !important;
          }

          /* Sub total and delivery labels */
          [style*="font-size: 15px"][style*="font-weight: 600"] {
            font-size: 13px !important;
          }

          /* Sub total and delivery values */
          [style*="font-size: 16px"][style*="font-weight: 700"] {
            font-size: 14px !important;
          }

          /* Order total text */
          [style*="font-size: 0.9rem"][style*="font-weight: 800"][style*="color: white"] {
            font-size: 0.85rem !important;
          }

          /* Order total value */
          [style*="font-size: 0.95rem"][style*="font-weight: 800"][style*="color: white"] {
            font-size: 0.9rem !important;
          }

          /* Checkout button */
          [href="/checkout"][style*="font-size: 14px"] {
            font-size: 13px !important;
            padding: 14px 20px !important;
          }

          /* Secure checkout text */
          [style*="font-size: 12px"][style*="color: rgb(136, 136, 136)"] {
            font-size: 11px !important;
            margin-top: 10px !important;
          }
        }

        @media (max-width: 767px) {
          /* Cart totals summary title */
          [style*="font-size: 18px"][style*="font-weight: 800"] {
            font-size: 14px !important;
            margin-bottom: 16px !important;
            padding-bottom: 10px !important;
          }

          /* Sub total and delivery section padding */
          [style*="padding: 14px 16px"] {
            padding: 12px 12px !important;
            margin-bottom: 8px !important;
          }

          /* Sub total and delivery labels */
          [style*="font-size: 15px"][style*="font-weight: 600"] {
            font-size: 12px !important;
          }

          /* Sub total and delivery values */
          [style*="font-size: 16px"][style*="font-weight: 700"] {
            font-size: 13px !important;
          }

          /* Order total banner padding */
          [style*="padding: 18px 20px"][style*="background: linear-gradient"] {
            padding: 14px 16px !important;
            margin-bottom: 18px !important;
          }

          /* Order total text */
          [style*="font-size: 0.9rem"][style*="font-weight: 800"][style*="color: white"] {
            font-size: 0.8rem !important;
            letter-spacing: 0.8px !important;
          }

          /* Order total value */
          [style*="font-size: 0.95rem"][style*="font-weight: 800"][style*="color: white"] {
            font-size: 0.85rem !important;
          }

          /* Checkout button */
          [href="/checkout"][style*="font-size: 14px"] {
            font-size: 12px !important;
            padding: 12px 16px !important;
            gap: 6px !important;
          }

          /* Lock icon on button */
          [href="/checkout"] i {
            font-size: 12px !important;
          }

          /* Secure checkout text */
          [style*="font-size: 12px"][style*="color: rgb(136, 136, 136)"] {
            font-size: 10px !important;
            margin-top: 8px !important;
          }

          /* FREE badge on delivery */
          [style*="background: rgb(140, 198, 63)"][style*="border-radius: 20px"] {
            font-size: 12px !important;
            padding: 3px 10px !important;
          }
        }
      `}</style>
    </main>
  );
}
