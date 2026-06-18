export default function CheckoutPage() {
  return (
    <main className="section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Checkout</p>
          <h1>Customer and Payment Details</h1>
        </div>
      </div>
      <form className="card">
        <div className="card-body">
          <div className="form-grid">
            <label className="field"><span>Name</span><input placeholder="Customer name" /></label>
            <label className="field"><span>Phone</span><input placeholder="Mobile number" /></label>
            <label className="field"><span>Email</span><input placeholder="Email address" /></label>
            <label className="field"><span>Payment</span><select><option>UPI</option><option>Credit Card</option><option>Debit Card</option><option>Net Banking</option></select></label>
            <label className="field" style={{ gridColumn: "1 / -1" }}><span>Delivery Address</span><textarea rows={4} placeholder="Full address" /></label>
          </div>
          <div className="row-actions" style={{ marginTop: 16 }}>
            <button className="button" type="button">Place Order</button>
          </div>
        </div>
      </form>
    </main>
  );
}
