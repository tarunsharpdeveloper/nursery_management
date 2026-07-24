"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function FloatingCart() {
  const { cartCount } = useCart();
  const pathname = usePathname();

  // Don't show the floating cart when cart is empty
  if (cartCount === 0) {
    return null;
  }

  // Only show floating cart on pages that have products / Add to Cart buttons
  const isProductPage =
    pathname === "/" ||
    pathname === "/products" ||
    (pathname ? pathname.startsWith("/products/") : false);

  if (!isProductPage) {
    return null;
  }

  return (
    <Link href="/cart" className="floating-cart" title="View cart" aria-label="Open cart">
      <ShoppingCart size={20} />
      <span className="floating-cart-badge">{cartCount}</span>
    </Link>
  );
}
