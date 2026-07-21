"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { getMediaUrl } from "@/lib/api";
import "@/styles/mobile-cart.css";

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

                {/* Mobile/Tablet Card View - Beautiful Design */}
                <div className="cart-mobile-cards">
  {cartItems.map((item) => {
    const cartKey = item.cartKey || String(item.id);
    const itemTotal = item.selling_price * item.quantity;

    return (
      <div className="mobile-cart-card" key={cartKey}>
        {/* Remove Button */}
        <button
          className="mobile-cart-remove-btn"
          onClick={() => removeFromCart(cartKey)}
          title="Remove"
        >
          <i className="fal fa-trash-alt"></i>
        </button>

        {/* Hot Deal Badge */}
        <div className="hot-deal">
          🔥 Hot Deal
        </div>

        {/* Product Section */}
        <div className="mobile-cart-grid">

          {/* Image */}
          <div className="mobile-cart-product-image">
            <Link href={`/products/${item.id}`}>
              <img
                src={getMediaUrl(item.photo_url) || DEFAULT_IMG}
                alt={item.name}
              />
            </Link>
          </div>

          {/* Details */}
          <div className="mobile-cart-details">

            <Link href={`/products/${item.id}`}>
              <h4 className="mobile-cart-title">
                {item.name}
              </h4>
            </Link>

            <p className="mobile-cart-category">
              {item.category}
            </p>

            {/* Rating */}
            <div className="mobile-cart-rating">
              <span className="mobile-cart-stars">
                ★★★★★
              </span>

              <span className="mobile-cart-reviews">
                (120)
              </span>
            </div>

            {/* Price */}
            <div className="mobile-cart-price">

              <span className="current-price">
                Rs. {item.selling_price.toFixed(2)}
              </span>

              {/* Optional */}

              <span className="old-price">
                Rs. {(item.selling_price * 1.25).toFixed(2)}
              </span>

              <span className="discount">
                20% OFF
              </span>

            </div>

          </div>

        </div>

        {/* Divider */}

        <div className="mobile-divider"></div>

        {/* Footer */}

        <div className="mobile-cart-footer">

          {/* Quantity */}

          <div className="mobile-qty">

            <span className="qty-label">
              Qty
            </span>

            <div className="qty-box">

              <button
                type="button"
                onClick={() =>
                  updateQuantity(
                    cartKey,
                    Math.max(1, item.quantity - 1)
                  )
                }
              >
                −
              </button>

              <span>
                {item.quantity}
              </span>

              <button
                type="button"
                onClick={() =>
                  updateQuantity(
                    cartKey,
                    item.quantity + 1
                  )
                }
              >
                +
              </button>

            </div>

          </div>

          {/* Total */}

          <div className="mobile-subtotal" >

            <small>
              Subtotal
            </small>

            <strong>
              Rs. {itemTotal.toFixed(2)}
            </strong>

          </div>

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

              <div className="cart-summary-totals">

    <div className="cart-summary-card">


        {/* Title */}
        <h2 className="cart-summary-title">
            Cart Totals
        </h2>



        {/* Sub Total */}
        <div className="summary-row">

            <span>
                Sub Total
            </span>


            <strong>
                Rs.&nbsp;{subtotal.toFixed(2)}
            </strong>

        </div>




        {/* Delivery */}
        <div className="summary-row">

            <span className="delivery-text">

                <i className="fas fa-truck"></i>

                Delivery

            </span>


            {shipping === 0 ? (

                <span className="free-badge">
                    FREE
                </span>

            ) : (

                <strong>
                    Rs.&nbsp;{shipping.toFixed(2)}
                </strong>

            )}

        </div>





        {/* Coupon Section */}
        <div className="coupon-box">


            <div className="coupon-header">

                <span>

                    <i className="fas fa-ticket-alt"></i>

                    Apply Coupon

                </span>

            </div>



            <div className="coupon-input-wrapper">


                <input

                    type="text"

                    placeholder="Enter coupon code"

                />



                <button

                    type="button"

                >

                    Apply

                </button>



            </div>


        </div>





        {/* Order Total */}
        <div className="order-total">


            <span>
                Order Total
            </span>



            <strong>
                Rs.&nbsp;{total.toFixed(2)}
            </strong>


        </div>





        {/* Checkout Button */}
        <Link

            href="/checkout"

            className="checkout-btn"

        >

            <i className="fas fa-lock"></i>


            Proceed to Secure Checkout


        </Link>





        {/* Security Text */}
        <p className="secure-text">


            <i className="fas fa-shield-alt"></i>


            Secure &amp; Encrypted Checkout


        </p>



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

        /* ===== IMPROVED MOBILE CART CARDS ===== */
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

        /* Enhanced hover effect for quantity buttons */
        .qty-btn-mobile:hover {
          background: linear-gradient(135deg, #2d6a3f 0%, #1b4228 100%) !important;
          color: white !important;
          transform: scale(1.12);
          box-shadow: 0 4px 10px rgba(45, 106, 63, 0.3) !important;
        }

        .qty-btn-mobile:active {
          transform: scale(0.88);
        }

        /* Mobile specific - smaller buttons */
        @media (max-width: 991px) {
          .qty-btn-mobile {
            width: 24px !important;
            height: 24px !important;
            font-size: 10px !important;
          }

          .qty-input-mobile {
            width: 34px !important;
            font-size: 12px !important;
          }

          .quantity-container-mobile {
            padding: 2px 4px !important;
          }
        }

        @media (max-width: 767px) {
          .qty-btn-mobile {
            width: 22px !important;
            height: 22px !important;
            font-size: 9px !important;
          }

          .qty-input-mobile {
            width: 30px !important;
            font-size: 11px !important;
          }

          .quantity-container-mobile {
            padding: 2px 3px !important;
            border-radius: 20px !important;
          }
        }

        @media (max-width: 480px) {
          .qty-btn-mobile {
            width: 20px !important;
            height: 20px !important;
            font-size: 8px !important;
          }

          .qty-input-mobile {
            width: 28px !important;
            font-size: 10px !important;
          }

          .quantity-container-mobile {
            padding: 2px 2px !important;
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

        /* ===== BEAUTIFUL MOBILE CARD LAYOUT ===== */
        .cart-card {
          background: linear-gradient(135deg, #ffffff 0%, #fafbf8 100%);
          border: 1.5px solid #e5ead9;
          border-radius: 16px;
          padding: 14px;
          margin-bottom: 14px;
          box-shadow: 0 3px 12px rgba(45, 106, 63, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: grid;
          gap: 12px;
        }

        .cart-card:hover {
          box-shadow: 0 8px 24px rgba(45, 106, 63, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
          border-color: #d8e4c8;
        }

        /* Card Top Section - Image & Header */
        .cart-card-top {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: stretch;
          position: relative;
        }

        /* Image Container */
        .cart-card-image-container {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          overflow: hidden;
          background: linear-gradient(135deg, #f5f8f2 0%, #eff6e6 100%);
          border: 1px solid #e5ead9;
          min-height: 160px;
          position: relative;
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
          object-fit: contain;
        }

        /* Header with Title and Delete Button */
        .cart-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          margin-top: 2px;
        }

        .cart-card-title {
          font-size: 16px;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0;
          line-height: 1.3;
          flex: 1;
          word-break: break-word;
        }

        /* Category Badge */
        .cart-card-category {
          font-size: 13px;
          color: #888;
          margin: 0;
          font-weight: 600;
          text-transform: capitalize;
          letter-spacing: 0.3px;
        }

        /* Price Row */
        .cart-card-price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-top: 1px solid #f0f0f0;
          border-bottom: 1px solid #f0f0f0;
        }

        .cart-card-label {
          font-weight: 700;
          color: #999;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .cart-card-price {
          font-weight: 800;
          color: #2d6a3f;
          font-size: 15px;
        }

        /* Quantity Row */
        .cart-card-qty-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
        }

        /* Subtotal Section */
        .cart-card-subtotal {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: linear-gradient(135deg, #f8fdf5 0%, #f0fae8 100%);
          border-radius: 12px;
          border: 1px solid #e8ede3;
          margin-top: 4px;
        }

        .cart-card-total {
          font-weight: 850;
          color: #2d6a3f;
          font-size: 16px;
        }

        .cart-table-wrapper {
          display: block;
          overflow-x: auto;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }

        .cart_table {
          background: white;
        }

        /* ===== RESPONSIVE BREAKPOINTS ===== */

        /* Tablet (768px - 991px) - Card View */
        @media (min-width: 768px) and (max-width: 991px) {
          .cart-table-wrapper {
            display: none;
          }

          .cart-mobile-cards {
            display: block;
          }

          .cart-card {
            grid-template-columns: 1fr;
            padding: 16px;
            gap: 14px;
          }

          .cart-card-title {
            font-size: 15px;
          }

          .cart-card-price {
            font-size: 14px;
          }

          .cart-card-total {
            font-size: 15px;
          }

          .cart-card-image-container {
            min-height: 150px;
          }
        }

        /* Mobile (max 767px) - Optimized Card View */
        @media (max-width: 767px) {
          .cart-table-wrapper {
            display: none;
          }

          .cart-mobile-cards {
            display: block;
          }

          .cart-card {
            padding: 14px;
            margin-bottom: 12px;
            gap: 10px;
            border-radius: 14px;
          }

          .cart-card:hover {
            transform: translateY(-1px);
          }

          .cart-card-image-container {
            min-height: 150px;
            border-radius: 10px;
          }

          .cart-card-header {
            gap: 8px;
            margin-top: 2px;
          }

          .cart-card-title {
            font-size: 14px;
            font-weight: 800;
          }

          .cart-card-category {
            font-size: 12px;
            margin: 2px 0 0 0;
          }

          .cart-card-price-row,
          .cart-card-qty-row {
            padding: 10px 0;
          }

          .cart-card-label {
            font-size: 11px;
            letter-spacing: 0.4px;
          }

          .cart-card-price {
            font-size: 13px;
          }

          .cart-card-total {
            font-size: 14px;
          }

          .cart-card-subtotal {
            padding: 10px;
            margin-top: 2px;
          }

          /* Smaller remove button on mobile */
          .cart-card-remove {
            font-size: 14px;
            padding: 2px 6px;
          }
        }

        /* Small Mobile (max 480px) */
        @media (max-width: 480px) {
          .cart-card {
            padding: 12px;
            margin-bottom: 10px;
            gap: 9px;
          }

          .cart-card-image-container {
            min-height: 140px;
          }

          .cart-card-top {
            gap: 8px;
          }

          .cart-card-title {
            font-size: 13px;
          }

          .cart-card-category {
            font-size: 11px;
          }

          .cart-card-label {
            font-size: 10px;
          }

          .cart-card-price {
            font-size: 12px;
          }

          .cart-card-total {
            font-size: 13px;
          }

          .cart-card-price-row,
          .cart-card-qty-row {
            padding: 9px 0;
          }

          .cart-card-subtotal {
            padding: 9px;
          }
        }

        /* Desktop (992px+) - Table View */
        @media (min-width: 992px) {
          .cart-table-wrapper {
            display: block;
          }

          .cart-mobile-cards {
            display: none;
          }
        }

        /* ===== CART SUMMARY SECTION ===== */
        .cart-summary-section {
          display: grid;
          grid-template-columns: 1fr 1.4fr;
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
          box-shadow: 0 4px 15px rgba(45, 106, 63, 0.08);
          transition: all 0.2s ease;
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
          border-color: #2d6a3f;
          box-shadow: 0 0 0 3px rgba(45, 106, 63, 0.1);
          outline: none;
        }

        /* Responsive Summary - Tablet */
        @media (min-width: 768px) and (max-width: 991px) {
          .cart-summary-section {
            grid-template-columns: 1fr;
            gap: 24px;
            margin-top: 28px;
          }

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

        /* Responsive Summary - Mobile */
        @media (max-width: 767px) {
          .cart-summary-section {
            grid-template-columns: 1fr;
            gap: 20px;
            margin-top: 24px;
          }

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

        @media (max-width: 480px) {
          .cart-summary-section {
            gap: 16px;
            margin-top: 20px;
          }

          .vs-cart-coupon {
            padding: 14px;
          }

          .vs-cart-coupon .summary-title {
            font-size: 12px;
            margin-bottom: 10px;
          }

          .vs-cart-coupon .form-control {
            font-size: 11px;
            padding: 8px 10px;
            margin-bottom: 6px;
          }

          .vs-cart-coupon .vs-btn {
            font-size: 11px;
            padding: 10px 14px;
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
