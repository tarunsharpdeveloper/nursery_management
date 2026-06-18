import { orders } from "@/lib/demo-data";

export default function MyOrdersPage() {
  return (
    <main className="section">
      <div className="section-header">
        <div>
          <p className="eyebrow">My Orders</p>
          <h1>Order Tracking</h1>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Order</th><th>Items</th><th>Amount</th><th>Status</th><th>Payment</th></tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.items}</td>
                <td>₹{order.amount}</td>
                <td><span className="pill">{order.status}</span></td>
                <td>{order.payment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
