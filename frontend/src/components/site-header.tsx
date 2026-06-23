"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Facebook, Instagram, Leaf, Search, ShoppingCart, User } from "lucide-react";
import logo from "@/assets/images/logo.png";
import { useCart } from "@/context/CartContext";

export function SiteHeader() {
  const pathname = usePathname();
  const { cartCount } = useCart();

  // Hide the customer header on admin pages, EXCEPT the login page
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    return null;
  }

  return (
    <>
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

        {/* Center: Nav links */}
        <div className="nav-menu">
          <Link href="/" className="nav-link">
            Home
          </Link>

          <Link href="/products" className="nav-link">
            Products
          </Link>

          <Link href="/about" className="nav-link">
            About Us
          </Link>

          <Link href="/contact" className="nav-link">
            Contact
          </Link>

          <Link href="/my-orders" className="nav-link">
            My Orders
          </Link>

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
            <span className="cart-badge">{cartCount}</span>
          </Link>
        </div>
      </nav>
    </>
  );
}

