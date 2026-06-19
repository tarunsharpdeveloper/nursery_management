import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Jost, Epilogue } from "next/font/google";
import { ChevronDown, Facebook, Instagram, Leaf, Search, ShoppingCart, User } from "lucide-react";
import logo from "@/assets/images/logo.png";
import { Footer } from "@/components/footer";
import "./globals.css";

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

const epilogue = Epilogue({
  subsets: ["latin"],
  variable: "--font-epilogue",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Awantika Seeds",
  description: "Premium plants and seeds — Ujjain, Madhya Pradesh"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${jost.variable} ${epilogue.variable}`}>
      <body>
        <div className="site-shell">

          {/* Thin green accent bar at very top */}
          <div className="promo-bar">
            <div className="promo-content">
              <Leaf size={14} />
              <span>Fresh plants &amp; seeds delivered to your doorstep — Ujjain, MP</span>
            </div>
            <div className="social-links">
              <a href="#" aria-label="Facebook"><Facebook size={14} /></a>
              <a href="#" aria-label="Instagram"><Instagram size={14} /></a>
            </div>
          </div>

          {/* Main navigation — Cannabo-style */}
          <nav className="nav">
            {/* Left: Logo */}
            <Link className="brand" href="/">
              <Image
                src={logo}
                alt="Awantika Seeds"
                width={80}
                height={80}
                className="brand-logo-img"
                priority
              />
              <span className="brand-name">Awantika Seeds</span>
            </Link>

            {/* Center: Nav links with dropdowns */}
            <div className="nav-menu">
              <Link href="/" className="nav-link">
                Home <ChevronDown size={13} className="nav-chevron" />
              </Link>

              <div className="nav-dropdown">
                <span className="nav-link">
                  Products <ChevronDown size={13} className="nav-chevron" />
                </span>
                <div className="dropdown-panel">
                  <Link href="/products" className="dropdown-item">All Products</Link>
                  <Link href="/products?type=plant" className="dropdown-item">Plants</Link>
                  <Link href="/products?type=seed" className="dropdown-item">Seeds</Link>
                  <div className="dropdown-divider" />
                  <Link href="/my-orders" className="dropdown-item">My Orders</Link>
                </div>
              </div>

              <div className="nav-dropdown">
                <Link href="/about" className="nav-link">
                  About Us <ChevronDown size={13} className="nav-chevron" />
                </Link>
                <div className="dropdown-panel">
                  <Link href="/about" className="dropdown-item">Our Story</Link>
                  <Link href="/contact" className="dropdown-item">Contact Us</Link>
                </div>
              </div>

              <Link href="/contact" className="nav-link">Contact</Link>
            </div>

            {/* Right: Search + Account + Cart */}
            <div className="nav-actions">
              <button className="nav-search-btn" type="button" aria-label="Search">
                <Search size={16} />
                <span>Search</span>
              </button>
              <Link href="/admin" className="nav-icon-btn" title="Account / Admin Portal">
                <User size={18} />
              </Link>
              <Link href="/cart" className="nav-icon-btn nav-cart-btn" title="Shopping Cart">
                <ShoppingCart size={18} />
                <span className="cart-badge">0</span>
              </Link>
            </div>
          </nav>

          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
