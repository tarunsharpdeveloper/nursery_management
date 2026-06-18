import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="card">
      <Image className="product-image" src={product.image} alt={product.name} width={900} height={675} />
      <div className="card-body">
        <p className="meta">{product.category} · {product.type}</p>
        <h3>{product.name}</h3>
        <p className="meta">{product.description}</p>
        <p className="price">₹{product.price}</p>
        <div className="row-actions">
          <Link className="button" href={`/products/${product.id}`}>
            Details
          </Link>
          <Link className="button secondary" href="/cart" aria-label={`Add ${product.name} to cart`}>
            <ShoppingCart size={18} />
          </Link>
        </div>
      </div>
    </article>
  );
}
