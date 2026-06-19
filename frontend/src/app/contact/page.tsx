import Link from "next/link";
import { Clock, ExternalLink, Mail, MapPin, MessageCircle, Navigation, Phone, Send, Sprout } from "lucide-react";

const mapUrl = "https://www.google.com/maps?q=23.180056,75.779583&output=embed";
const directionsUrl = "https://www.google.com/maps/place/23%C2%B010'48.2%22N+75%C2%B046'46.5%22E";

export default function ContactPage() {
  return (
    <main>
      <section className="contact-page-hero">
        <div>
          <p className="eyebrow">Contact Us</p>
          <h1>Get in touch with Awantika Seeds</h1>
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Contact Us</span>
          </div>
        </div>
      </section>

      <section className="section contact-info-strip">
        <a className="contact-info-card" href="tel:+918085263020">
          <span><Phone size={24} /></span>
          <div>
            <h3>Phone Number</h3>
            <p>+91 80852 63020</p>
          </div>
        </a>
        <a className="contact-info-card" href="mailto:sales@greennursery.local">
          <span><Mail size={24} /></span>
          <div>
            <h3>Email Address</h3>
            <p>sales@greennursery.local</p>
          </div>
        </a>
        <a className="contact-info-card" href={directionsUrl} target="_blank" rel="noopener noreferrer">
          <span><MapPin size={24} /></span>
          <div>
            <h3>Store Location</h3>
            <p>Dhudh Talai, Ujjain</p>
          </div>
        </a>
      </section>

      <section className="section contact-main-grid">
        <div className="contact-form-panel">
          <p className="eyebrow">Send Message</p>
          <h2>Ask about plants, seeds, orders, or dispatch</h2>
          <p className="meta">
            Share your requirement and our team will help with availability, quantity, price, and pickup or delivery details.
          </p>

          <form className="contact-form">
            <div className="form-grid two">
              <label className="field">
                <span>Your Name</span>
                <input placeholder="Enter name" />
              </label>
              <label className="field">
                <span>Phone Number</span>
                <input placeholder="+91 ..." />
              </label>
              <label className="field">
                <span>Email Address</span>
                <input placeholder="name@example.com" type="email" />
              </label>
              <label className="field">
                <span>Requirement</span>
                <select defaultValue="">
                  <option value="" disabled>Select topic</option>
                  <option>Plant availability</option>
                  <option>Seed enquiry</option>
                  <option>Bulk order</option>
                  <option>Dispatch support</option>
                </select>
              </label>
            </div>
            <label className="field">
              <span>Message</span>
              <textarea placeholder="Tell us what you want to grow or order" rows={5} />
            </label>
            <button className="button" type="button">
              <Send size={17} />
              Send Enquiry
            </button>
          </form>
        </div>

        <aside className="contact-side-panel">
          <div className="contact-side-card">
            <Sprout size={28} />
            <h3>Visit the Nursery</h3>
            <p>Dhudh Talai, Kamal Talkies 7, Ujjain, Madhya Pradesh 456001</p>
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
              Get Directions
              <Navigation size={15} />
            </a>
          </div>
          <div className="contact-side-list">
            <div>
              <Clock size={18} />
              <span>Mon-Sat, 9:00 AM to 7:00 PM</span>
            </div>
            <a href="https://wa.me/918085263020" target="_blank" rel="noopener noreferrer">
              <MessageCircle size={18} />
              <span>WhatsApp product enquiry</span>
            </a>
          </div>
        </aside>
      </section>

      <section className="contact-map-section">
        <iframe
          title="Awantika Seeds location map"
          src={mapUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="map-floating-card">
          <strong>Awantika Seeds</strong>
          <span>23.1801 N, 75.7796 E</span>
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
            Open Google Maps
            <ExternalLink size={14} />
          </a>
        </div>
      </section>
    </main>
  );
}
