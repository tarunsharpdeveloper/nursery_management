"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function FloatingCart() {
  const { cartCount } = useCart();

  return (
    <Link href="/cart" className="floating-cart" title="View cart" aria-label="Open cart">
      <ShoppingCart size={20} />
      <span className="floating-cart-badge">{cartCount}</span>
    </Link>
  );
}
