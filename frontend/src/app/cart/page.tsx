import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { products } from "@/lib/demo-data";

const cartItems = products.slice(0, 2);

export default function CartPage() {
  const total = cartItems.reduce((sum, item) => sum + item.price * 2, 0);

  return (
    <main className="section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Cart</p>
          <h1>Your Cart</h1>
        </div>
        <Link className="button" href="/checkout">
          Checkout
        </Link>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Total</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {cartItems.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>₹{item.price}</td>
                <td>
                  <button className="button secondary" aria-label="Decrease quantity"><Minus size={16} /></button>
                  <span style={{ padding: "0 12px" }}>2</span>
                  <button className="button secondary" aria-label="Increase quantity"><Plus size={16} /></button>
                </td>
                <td>₹{item.price * 2}</td>
                <td><button className="button secondary" aria-label="Remove item"><Trash2 size={16} /></button></td>
              </tr>
            ))}
            <tr>
              <td colSpan={3}><strong>Grand Total</strong></td>
              <td><strong>₹{total}</strong></td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
