import Link from "next/link";
import { PackageCheck, Sprout, Truck } from "lucide-react";
import { categories, products } from "@/lib/demo-data";
import { ProductCard } from "@/components/product-card";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">Premium Plants & Seeds — Ujjain, MP</p>
          <h1>Awantika Seeds</h1>
          <p>
            Your trusted nursery for premium plants, seeds, and saplings. Shop online or visit us at
            Dhudh Talai, Ujjain — quality that grows with you.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/products">
              Shop Products
            </Link>
            <Link className="button secondary" href="/admin">
              Open Admin Portal
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Featured Products</p>
            <h2>Plants and seeds ready for sale</h2>
          </div>
          <Link className="button secondary" href="/products">
            View All
          </Link>
        </div>
        <div className="grid products">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Categories</p>
            <h2>Organized for nursery sales</h2>
          </div>
        </div>
        <div className="pill-row">
          {categories.map((category) => (
            <span className="pill" key={category}>
              {category}
            </span>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="grid modules">
          <div className="card">
            <div className="card-body">
              <Sprout color="#2f6b3f" />
              <h3>Production Tracking</h3>
              <p className="meta">Plant and seed production entries increase stock automatically.</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <PackageCheck color="#2f6b3f" />
              <h3>Inventory Ledger</h3>
              <p className="meta">Single-store stock movements for production, sale, orders and adjustment.</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <Truck color="#2f6b3f" />
              <h3>Dispatch Flow</h3>
              <p className="meta">Orders move from received to approved, dispatch and delivered.</p>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
