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
        <div className="brand" style={{ color: "white", marginBottom: 14 }}>
          <Image
            className="brand-logo footer-logo"
            src={logo}
            alt="Awantika Seeds logo"
            width={180}
            height={180}
          />
          Awantika Seeds
        </div>
        <p className="meta" style={{ color: "rgba(255, 255, 255, 0.7)", maxWidth: 280 }}>
          Premium nursery plants and high-yield seeds. Cultivating green spaces and providing professional agricultural solutions.
        </p>
      </div>

      <div>
        <h3>Quick Links</h3>
        <ul className="footer-links">
          <li><Link href="/products">Shop Plants & Seeds</Link></li>
          <li><Link href="/about">About Our Nursery</Link></li>
          <li><Link href="/contact">Get in Touch</Link></li>
          <li><Link href="/my-orders">Track My Orders</Link></li>
        </ul>
      </div>

      <div>
        <h3>Contact Us</h3>
        <ul className="footer-contact">
          <li>
            <Phone size={16} className="text-accent" />
            <a href="tel:+918085263020">+91 80852 63020</a>
          </li>
          <li>
            <Mail size={16} className="text-accent" />
            <a href="mailto:sales@greennursery.local">sales@greennursery.local</a>
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
          <div className="maps-card-header">
            <Compass className="pulse-icon" size={18} />
            <div>
              <strong>GPS Coordinates</strong>
              <div className="coordinates">23°10'48.2"N 75°46'46.5"E</div>
            </div>
          </div>
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
    </footer>
  );
}
