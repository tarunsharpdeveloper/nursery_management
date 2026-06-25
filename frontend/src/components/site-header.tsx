"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Facebook, Instagram, Leaf, LogIn, LogOut, Search, ShoppingCart } from "lucide-react";
import logo from "@/assets/images/logo.jpeg";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

export function SiteHeader() {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const { user, logout } = useCustomerAuth();

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
            width={50}
            height={50}
            className="brand-logo-img"
            priority
          />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1,gap: "7px" }}>
          <span className="brand-name">Shri Sanviya Hi-Tech Nursery</span>
          <div style={{display:'flex'}}><span className="brand-name">(Awantika Seeds)</span></div>
          </div>
        </Link>

        {/* Center: Nav links */}
        <div className="nav-menu">
          <Link href="/" className="nav-link">
            Home
          </Link>

           <Link href="/about" className="nav-link">
            About Us
          </Link>

          <Link href="/products" className="nav-link">
            Products
          </Link>

          <Link href="/contact" className="nav-link">
            Contact
          </Link>

          {user && (
            <Link href="/my-orders" className="nav-link">
              My Orders
            </Link>
          )}

        </div>

        {/* Right: Search + Account + Cart */}
        <div className="nav-actions">
          <button className="nav-search-btn" type="button" aria-label="Search">
            <Search size={16} />
            <span>Search</span>
          </button>
          
          {user ? (
            <button onClick={logout} className="nav-icon-btn" title="Logout" aria-label="Logout">
              <LogOut size={18} />
            </button>
          ) : (
            <Link href="/login" className="nav-login-btn" title="Customer Login">
              <LogIn size={16} />
              <span>Login</span>
            </Link>
          )}

          <Link href="/cart" className="nav-icon-btn nav-cart-btn" title="Shopping Cart">
            <ShoppingCart size={18} />
            <span className="cart-badge">{cartCount}</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
