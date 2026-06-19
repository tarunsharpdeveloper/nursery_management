import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from "lucide-react";
import { products } from "@/lib/demo-data";

const cartItems = products.slice(0, 3).map((product) => ({ ...product, quantity: product.id === 1 ? 2 : 1 }));

export default function CartPage() {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 1000 ? 0 : 120;
  const total = subtotal + shipping;

  return (
    <main>
      <section className="cart-hero">
        <div>
          <p className="eyebrow">Shopping Cart</p>
          <h1>Your Cart</h1>
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Cart</span>
          </div>
        </div>
      </section>

      <section className="section cart-layout">
        <div className="cart-panel">
          <div className="cart-table-head">
            <span>Product</span>
            <span>Price</span>
            <span>Quantity</span>
            <span>Total</span>
            <span>Remove</span>
          </div>

          <div className="cart-items">
            {cartItems.map((item) => (
              <article className="cart-row" key={item.id}>
                <div className="cart-product">
                  <Image src={item.image} alt={item.name} width={120} height={110} />
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.category}</span>
                  </div>
                </div>
                <div className="cart-price">Rs. {item.price}</div>
                <div className="quantity-control" aria-label={`Quantity for ${item.name}`}>
                  <button type="button" aria-label="Decrease quantity"><Minus size={15} /></button>
                  <span>{item.quantity}</span>
                  <button type="button" aria-label="Increase quantity"><Plus size={15} /></button>
                </div>
                <div className="cart-price strong">Rs. {item.price * item.quantity}</div>
                <button className="remove-button" type="button" aria-label={`Remove ${item.name}`}>
                  <Trash2 size={18} />
                </button>
              </article>
            ))}
          </div>

          <div className="cart-actions-bar">
            <label className="coupon-field">
              <input placeholder="Coupon code" />
              <button className="button secondary" type="button">Apply Coupon</button>
            </label>
            <button className="button secondary" type="button">Update Cart</button>
          </div>
        </div>

        <aside className="cart-summary">
          <div className="summary-title">
            <ShoppingBag size={22} />
            <h2>Cart Totals</h2>
          </div>
          <div className="summary-line">
            <span>Subtotal</span>
            <strong>Rs. {subtotal}</strong>
          </div>
          <div className="summary-line">
            <span>Shipping</span>
            <strong>{shipping === 0 ? "Free" : `Rs. ${shipping}`}</strong>
          </div>
          <div className="summary-line total">
            <span>Total</span>
            <strong>Rs. {total}</strong>
          </div>
          <Link className="button checkout-button" href="/checkout">
            Proceed To Checkout
          </Link>
          <Link className="continue-link" href="/products">
            Continue Shopping
          </Link>

          <div className="cart-benefits">
            <div>
              <Truck size={18} />
              <span>Local dispatch support</span>
            </div>
            <div>
              <ShieldCheck size={18} />
              <span>Fresh nursery stock</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
