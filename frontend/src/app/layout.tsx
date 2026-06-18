import type { Metadata } from "next";
import Link from "next/link";
import { Leaf, ShoppingCart } from "lucide-react";
import { Footer } from "@/components/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Awantika Seeds",
  description: "Nursery website, e-commerce, inventory, production, billing and staff portal"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <nav className="nav">
            <Link className="brand" href="/">
              <span className="brand-mark">
                <Leaf size={20} />
              </span>
              Awantika Seeds
            </Link>
            <div className="nav-links">
              <Link href="/products">Products</Link>
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/my-orders">My Orders</Link>
              <Link href="/cart" aria-label="Cart">
                <ShoppingCart size={18} />
                Cart
              </Link>
              <Link className="button" href="/admin">
                Admin Portal
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
