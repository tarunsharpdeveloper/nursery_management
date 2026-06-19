"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Headphones, Leaf, PackageCheck, ShieldCheck, ShoppingBasket, Sprout, Star, Truck } from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { Product } from "@/lib/types";

interface BackendProduct {
  id: number;
  name: string;
  product_type: "plant" | "seed";
  description: string;
  selling_price: number;
  available_quantity: number;
  photo_url: string;
  is_active: boolean;
  category: string;
}

const fallbackProducts: Product[] = [
  {
    id: 1,
    name: "Alphonso Mango Plant",
    type: "plant",
    category: "Fruit Plants",
    description: "Healthy grafted mango plant ready for farm plantation.",
    price: 220,
    stock: 140,
    sold: 86,
    image: "https://images.unsplash.com/photo-1598512752271-33f913a5af13?auto=format&fit=crop&w=900&q=80",
    active: true
  },
  {
    id: 2,
    name: "Marigold Plant",
    type: "plant",
    category: "Flower Plants",
    description: "Bright flowering plant suitable for gardens and borders.",
    price: 35,
    stock: 520,
    sold: 410,
    image: "https://images.unsplash.com/photo-1471899236350-e3016bf1e69e?auto=format&fit=crop&w=900&q=80",
    active: true
  },
  {
    id: 3,
    name: "Tomato Seeds",
    type: "seed",
    category: "Vegetable Seeds",
    description: "High germination tomato seed packet for growers.",
    price: 80,
    stock: 300,
    sold: 190,
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=900&q=80",
    active: true
  }
];

const categoryArt: Record<string, string> = {
  "Fruit Plants": "https://images.unsplash.com/photo-1598512752271-33f913a5af13?auto=format&fit=crop&w=500&q=80",
  "Flower Plants": "https://images.unsplash.com/photo-1471899236350-e3016bf1e69e?auto=format&fit=crop&w=500&q=80",
  "Medicinal Plants": "https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=500&q=80",
  "Ornamental Plants": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=500&q=80",
  "Vegetable Seeds": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80",
  "Flower Seeds": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=500&q=80"
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await apiRequest<BackendProduct[]>("/api/products");
        const transformedProducts: Product[] = data.map((product) => ({
          id: product.id,
          name: product.name,
          type: product.product_type,
          category: product.category,
          description: product.description,
          price: Number(product.selling_price),
          stock: Number(product.available_quantity),
          sold: 0,
          image: product.photo_url || "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80",
          active: Boolean(product.is_active)
        }));

        if (transformedProducts.length) {
          setProducts(transformedProducts);
        }
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const categories = useMemo(() => {
    return [...new Set(products.map((product) => product.category))].sort();
  }, [products]);

  const filteredProducts = selectedCategory
    ? products.filter((product) => product.category === selectedCategory)
    : products;

  const heroProduct = products[0] || fallbackProducts[0];

  return (
    <main>
      <section className="store-hero">
        <div className="store-hero-copy">
          <p className="eyebrow">Premium nursery plants and seeds</p>
          <h1>Grow better gardens with Awantika Seeds</h1>
          <p>
            Shop healthy saplings, seasonal flowers, vegetable seeds, and nursery essentials from our Ujjain store.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/products">
              Start Shopping
            </Link>
            <Link className="button secondary" href="/contact">
              Visit Store
            </Link>
          </div>
          <div className="hero-trust-row">
            <span><BadgeCheck size={18} /> Fresh nursery stock</span>
            <span><Truck size={18} /> Local dispatch support</span>
          </div>
        </div>

        <div className="hero-product-card">
          <span className="deal-badge">Ready Stock</span>
          <Image src={heroProduct.image} alt={heroProduct.name} width={680} height={520} />
          <div>
            <p className="meta">{heroProduct.category}</p>
            <h3>{heroProduct.name}</h3>
            <p className="price">Rs. {heroProduct.price}</p>
          </div>
        </div>
      </section>

      <section className="section category-showcase">
        <div className="section-header centered">
          <div>
            <p className="eyebrow">Browse Category</p>
            <h2>Pick your product type</h2>
          </div>
        </div>
        <div className="category-tile-grid">
          {categories.map((category) => (
            <button
              className={`category-tile ${selectedCategory === category ? "active" : ""}`}
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
            >
              <Image
                src={categoryArt[category] || categoryArt["Ornamental Plants"]}
                alt={category}
                width={220}
                height={160}
              />
              <span>{category}</span>
              <small>{products.filter((product) => product.category === category).length} Products</small>
            </button>
          ))}
        </div>
      </section>

      <section className="section about-band">
        <div className="about-media">
          <Image
            src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80"
            alt="Nursery plants"
            width={760}
            height={620}
          />
        </div>
        <div className="about-copy">
          <p className="eyebrow">Welcome to Awantika Seeds</p>
          <h2>Healthy plants, practical advice, and reliable nursery supply</h2>
          <p>
            We help home gardeners, farms, and local buyers choose the right plants and seeds with stock that is easy to order, bill, and dispatch.
          </p>
          <div className="quality-list">
            <span><ShieldCheck size={18} /> Quality checked plants</span>
            <span><Leaf size={18} /> Seasonal and local varieties</span>
            <span><PackageCheck size={18} /> Billing and order tracking</span>
          </div>
        </div>
      </section>

      <section className="section home-trending">
        <div className="home-trending-header">
          <p className="eyebrow">Quality Products</p>
          <h2>{selectedCategory ? `${selectedCategory} Products` : "Trending Products"}</h2>
          <p className="meta">{loading ? "Loading live stock..." : "Fresh picks from your nursery catalog."}</p>
          {selectedCategory ? (
            <button className="pill active" type="button" onClick={() => setSelectedCategory(null)}>
              All Products
            </button>
          ) : null}
        </div>

        <div className="home-product-grid">
          {filteredProducts.length ? (
            filteredProducts.slice(0, 8).map((product) => (
              <article className="home-product-card" key={product.id}>
                {product.stock <= 0 ? <span className="stock-badge">Out of Stock</span> : null}
                {product.stock > 0 && product.stock < 100 ? <span className="stock-badge">Limited Stock</span> : null}
                <Link className="home-product-image" href={`/products/${product.id}`}>
                  <Image src={product.image} alt={product.name} width={420} height={360} />
                </Link>
                <div className="home-rating" aria-label="Rated 5 out of 5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={14} fill="currentColor" />
                  ))}
                </div>
                <h3>
                  <Link href={`/products/${product.id}`}>{product.name}</Link>
                </h3>
                <p className="meta">{product.category}</p>
                <div className="home-product-footer">
                  <strong>Rs. {product.price}</strong>
                  <Link href="/cart" aria-label={`Add ${product.name} to cart`}>
                    <ShoppingBasket size={20} />
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <p className="meta">No products found in this category.</p>
          )}
        </div>
        <div className="center-actions">
          <Link className="button secondary" href="/products">
            View All Products
          </Link>
        </div>
      </section>

      <section className="section feature-strip">
        <div className="feature-box">
          <Sprout size={30} />
          <h3>Direct From Nursery</h3>
          <p className="meta">Fresh plants and seeds managed from in-house stock.</p>
        </div>
        <div className="feature-box">
          <Headphones size={30} />
          <h3>Customer Support</h3>
          <p className="meta">Call or WhatsApp for availability and bulk orders.</p>
        </div>
        <div className="feature-box">
          <Truck size={30} />
          <h3>Dispatch Flow</h3>
          <p className="meta">Orders move from approval to delivery with tracking.</p>
        </div>
      </section>
    </main>
  );
}
