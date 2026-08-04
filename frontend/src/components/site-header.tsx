"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Facebook, Heart, Instagram, Leaf, LogIn, LogOut, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import logo from "@/assets/images/avntika-logo-wbg.png";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useFavorites } from "@/context/FavoritesContext";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount } = useCart();
  const { user, logout } = useCustomerAuth();
  const { favoriteCount } = useFavorites();
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
        <div className="promo-inner">
          <div className="promo-content">
            <Leaf size={14} />
            <span>Fresh plants &amp; seeds delivered to your doorstep — Ujjain, MP | Call: +91 80852 63020</span>
          </div>
          <div className="social-links">
            <a
              href="https://www.facebook.com/share/v/1C4kL6PPwP/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <Facebook size={15} />
            </a>
            <a
              href="https://www.instagram.com/saniyahightechnursery?igsh=MWJoMTBzbmlzMGVjNA=="
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <Instagram size={15} />
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation — Cannabo-style */}
      <nav className="nav site-header-nav" style={{ flexWrap: "nowrap" }}>
        <div className="nav-inner">
          {/* Left: Logo */}
          <Link className="brand" href="/">
            <Image
              src={logo}
              alt="Shri Saniya Hi-Tech Nursery (Awantika Seeds)"
              width={700}
              height={160}
              className="brand-logo-img"
              priority
            />
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

            <Link href="/gallery" className="nav-link">
              Gallery
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
            <button className="nav-icon-btn" type="button" title="Search" aria-label="Search" onClick={() => setIsSearchOpen(true)}>
              <Search size={18} />
            </button>

            {user ? (
              <>
                <Link href="/profile" className="nav-icon-btn d-none d-md-inline-flex" title="My Profile" aria-label="My Profile">
                  <User size={18} />
                </Link>
                <button onClick={logout} className="nav-icon-btn d-none d-md-inline-flex" title="Logout" aria-label="Logout">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link href="/login" className="nav-login-btn" title="Customer Login">
                <LogIn size={16} />
                <span>Login</span>
              </Link>
            )}

            {user && (
              <Link href="/profile?tab=favorites" className="nav-icon-btn nav-cart-btn nav-fav-btn d-none d-md-inline-flex" title="My Favorites">
                <Heart size={18} />
                {favoriteCount > 0 && <span className="cart-badge">{favoriteCount}</span>}
              </Link>
            )}

            <Link href="/cart" className="nav-icon-btn nav-cart-btn" title="Shopping Cart">
              <ShoppingCart size={18} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
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
                href="/gallery" 
                className="mobile-menu-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Gallery
              </Link>

              <Link 
                href="/contact" 
                className="mobile-menu-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>

              {user && (
                <>
                  <Link 
                    href="/my-orders" 
                    className="mobile-menu-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Orders
                  </Link>

                  <Link 
                    href="/profile" 
                    className="mobile-menu-link"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User size={18} />
                    Profile
                  </Link>
                  <Link 
                    href="/profile?tab=favorites" 
                    className="mobile-menu-link"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Heart size={18} />
                    Favorites
                  </Link>
                </>
              )}

              {!user && (
                <Link 
                  href="/login" 
                  className="mobile-menu-link mobile-menu-login"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
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
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--danger)', color: 'white', border: 'none', width: '85%', padding: '12px', borderRadius: '8px', cursor: 'pointer', marginTop: '10px', fontSize: '16px', fontWeight: '600' }}
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

          <h2 className="section-heading">What are you looking for?</h2>

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
