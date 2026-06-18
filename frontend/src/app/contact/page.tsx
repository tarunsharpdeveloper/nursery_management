import { Mail, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="section">
      <p className="eyebrow">Contact Us</p>
      <h1>Visit or order from Green Nursery</h1>
      <div className="grid modules">
        <div className="card"><div className="card-body"><Phone color="#2f6b3f" /><h3>Phone</h3><p className="meta">+91 98765 43210</p></div></div>
        <div className="card"><div className="card-body"><Mail color="#2f6b3f" /><h3>Email</h3><p className="meta">sales@greennursery.local</p></div></div>
        <div className="card"><div className="card-body"><MapPin color="#2f6b3f" /><h3>Address</h3><p className="meta">Nursery Road, India</p></div></div>
      </div>
    </main>
  );
}
