"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Compass, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import logo from "@/assets/images/logo.png";

export function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    return null;
  }

  return (
    <footer className="footer">
      <div className="footer-brand-col">
        <Link href="/" style={{ display: "inline-block", marginBottom: "16px" }}>
          <Image
            src={logo}
            alt="Shri Saniya Hi-Tech Nursery (Awantika Seeds)"
            width={240}
            height={85}
            style={{ 
              height: "auto",
              maxHeight: "90px",
              width: "auto",
              maxWidth: "260px",
              objectFit: "contain",
              borderRadius: "8px"
            }}
          />
        </Link>
        <p className="meta" style={{ color: "rgba(255, 255, 255, 0.7)", maxWidth: 280 }}>
          Premium nursery plants and high-yield seeds. Cultivating green spaces and providing professional agricultural solutions.
        </p>
      </div>

      <div>
        <h3>Quick Links</h3>
        <ul className="footer-links">
          <li><Link href="/products">Shop Plants & Seeds</Link></li>
          <li><Link href="/about">About Us</Link></li>
          <li><Link href="/contact">Get in Touch</Link></li>
          <li><Link href="/my-orders">Track My Orders</Link></li>
        </ul>
      </div>

      <div>
        <h3>Policies</h3>
        <ul className="footer-links">
          <li><Link href="/privacy-policy">Privacy Policy</Link></li>
          <li><Link href="/terms-of-service">Terms of Service</Link></li>
          <li><Link href="/refund-policy">Refund Policy</Link></li>
          <li><Link href="/shipping-policy">Shipping Policy</Link></li>
        </ul>
      </div>

      <div>
        <h3>Contact Us</h3>
        <ul className="footer-contact">
          <li>
            <Phone size={16} className="text-accent" />
            <a href="tel:+918085263020">+91 8085263020</a>
          </li>
          <li>
            <Mail size={16} className="text-accent" />
            <a href="mailto:awantikaseeds118@gmail.com">awantikaseeds118@gmail.com</a>
          </li>
          <li>
            <MapPin size={16} className="text-accent" style={{ flexShrink: 0 }} />
            <span>
              Dhudh Talai, Kamal Talkies 7,<br />
              Ujjain, Madhya Pradesh 456001
            </span>
          </li>
        </ul>
      </div>

      <div>
        <h3>Our Location</h3>
        <div className="maps-card">
          {/* <div className="maps-card-header">
            <Compass className="pulse-icon" size={18} />
            <div>
              <strong>GPS Coordinates</strong>
              <div className="coordinates">23°10'48.2"N 75°46'46.5"E</div>
            </div>
          </div> */}
          <a
            href="https://www.google.com/maps/place/23%C2%B010'48.2%22N+75%C2%B046'46.5%22E"
            target="_blank"
            rel="noopener noreferrer"
            className="maps-button"
          >
            Open Google Maps
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Developer Credit */}
      <div style={{
        gridColumn: '1 / -1',
        textAlign: 'center',
        marginTop: '40px',
        paddingTop: '30px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <p style={{ 
          color: 'rgba(255, 255, 255, 0.7)', 
          fontSize: '14px',
          margin: 0 
        }}>
          Designed & Developed By:{' '}
          <a 
            href="https://ewayitsolutions.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: 'var(--accent)',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--accent)'}
          >
            Eway IT Solutions Pvt. Ltd.
          </a>
        </p>
      </div>
    </footer>
  );
}
