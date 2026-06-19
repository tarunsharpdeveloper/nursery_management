import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { products } from "@/lib/demo-data";



export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = products.find((item) => item.id === Number(id));

  if (!product) {
    notFound();
  }

  return (
    <main className="section">
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", alignItems: "start" }}>
        <Image className="product-image card" src={product.image} alt={product.name} width={1000} height={750} />
        <section>
          <p className="eyebrow">Product Details</p>
          <h1>{product.name}</h1>
          <p className="meta">{product.category} · {product.type}</p>
          <p>{product.description}</p>
          <p className="price">₹{product.price}</p>
          <p className="meta">Available quantity: {product.stock}</p>
          <div className="row-actions">
            <Link className="button" href="/cart">
              <ShoppingCart size={18} />
              Add to Cart
            </Link>
            <Link className="button secondary" href="/checkout">
              Checkout
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
