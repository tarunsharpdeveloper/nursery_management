import { ProductCard } from "@/components/product-card";
import { categories, products } from "@/lib/demo-data";

export default function ProductsPage() {
  return (
    <main className="section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Product Listing</p>
          <h1>Plants and Seeds</h1>
          <p className="meta">Filter-ready product catalogue for online orders and offline billing.</p>
        </div>
      </div>
      <div className="pill-row" style={{ marginBottom: 22 }}>
        {categories.map((category) => (
          <span className="pill" key={category}>
            {category}
          </span>
        ))}
      </div>
      <div className="grid products">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
