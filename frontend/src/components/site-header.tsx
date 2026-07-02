"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Facebook, Instagram, Leaf, LogIn, LogOut, Menu, Search, ShoppingCart, X } from "lucide-react";
import logo from "@/assets/images/logo.jpeg";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount } = useCart();
  const { user, logout } = useCustomerAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          <span>Fresh plants &amp; seeds delivered to your doorstep — Ujjain, MP | Call: +91 80852 63020</span>
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
          <button className="nav-search-btn" type="button" aria-label="Search" onClick={() => setIsSearchOpen(true)}>
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

          {/* Hamburger Menu Button (Mobile Only) */}
          <button 
            className="nav-hamburger" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Overlay backdrop */}
          <div 
            className="mobile-menu-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Mobile Menu Panel */}
          <div className="mobile-menu">
            <div className="mobile-menu-header">
              <h3>Menu</h3>
              <button onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
                <X size={24} />
              </button>
            </div>

            <div className="mobile-menu-content">
              <Link 
                href="/" 
                className="mobile-menu-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>

              <Link 
                href="/about" 
                className="mobile-menu-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About Us
              </Link>

              <Link 
                href="/products" 
                className="mobile-menu-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Products
              </Link>

              <Link 
                href="/contact" 
                className="mobile-menu-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>

              {user && (
                <Link 
                  href="/my-orders" 
                  className="mobile-menu-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Orders
                </Link>
              )}

              {!user && (
                <Link 
                  href="/login" 
                  className="mobile-menu-link mobile-menu-login"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LogIn size={18} />
                  Login
                </Link>
              )}

              {user && (
                <button 
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="mobile-menu-link mobile-menu-logout"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Search Popup Modal */}
      {isSearchOpen && (
        <div 
          style={{ 
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%", 
            background: "rgba(10, 25, 15, 0.85)", 
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            zIndex: 9999, 
            display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"
          }}
        >
          <button 
            style={{ 
              position: "absolute", top: "40px", right: "40px", 
              background: "rgba(255,255,255,0.1)", border: "none", color: "white", 
              width: "50px", height: "50px", borderRadius: "50%",
              display: "flex", justifyContent: "center", alignItems: "center",
              cursor: "pointer", transition: "all 0.3s ease"
            }} 
            onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            onClick={() => setIsSearchOpen(false)}
            aria-label="Close search"
          >
            <X size={28} />
          </button>

          <h2 style={{ color: "white", marginBottom: "35px", fontSize: "40px", fontWeight: 700, fontFamily: "var(--title-font)" }}>
            What are you looking for?
          </h2>

          <form 
            onSubmit={(e) => { 
              e.preventDefault(); 
              setIsSearchOpen(false); 
              if(searchQuery.trim()) {
                router.push(`/products?search=${encodeURIComponent(searchQuery)}`); 
              }
            }} 
            style={{ 
              width: "90%", maxWidth: "700px", position: "relative",
              background: "white", borderRadius: "50px", 
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              padding: "6px"
            }}
          >
            <input 
              type="text" 
              placeholder="Search for plants, seeds, fertilizers..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              style={{ 
                width: "100%", padding: "20px 80px 20px 30px", fontSize: "20px", 
                borderRadius: "50px", border: "none", outline: "none",
                color: "var(--title-color)", fontFamily: "inherit"
              }} 
              autoFocus 
            />
            <button 
              type="submit" 
              style={{ 
                position: "absolute", right: "8px", top: "8px", bottom: "8px",
                background: "var(--theme-color)", color: "white", border: "none", 
                width: "60px", borderRadius: "50px", 
                display: "flex", alignItems: "center", justifyContent: "center", 
                cursor: "pointer", transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "var(--title-color)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "var(--theme-color)")}
              aria-label="Submit search"
            >
              <Search size={24} />
            </button>
          </form>
          <p style={{ color: "rgba(255,255,255,0.6)", marginTop: "25px", fontSize: "16px", letterSpacing: "1px" }}>
            Press Enter to search
          </p>
        </div>
      )}
    </>
  );
}
