"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Filter, Search, ShoppingCart, SlidersHorizontal, Sprout, Star } from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { Product, ProductType } from "@/lib/types";

interface BackendProduct {
  id: number;
  name: string;
  product_type: ProductType;
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
    description: "High germination tomato seed packet for vegetable growers.",
    price: 80,
    stock: 300,
    sold: 190,
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=900&q=80",
    active: true
  }
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<ProductType | "all">("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");
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

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
      const matchesType = selectedType === "all" ? true : product.type === selectedType;
      const matchesSearch = search
        ? `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(search)
        : true;
      return product.active && matchesCategory && matchesType && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "stock") return b.stock - a.stock;
      return a.name.localeCompare(b.name);
    });
  }, [products, query, selectedCategory, selectedType, sortBy]);

  return (
    <main>
      <section className="shop-hero">
        <div>
          <p className="eyebrow">Shop Products</p>
          <h1>Plants and Seeds</h1>
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Products</span>
          </div>
        </div>
      </section>

      <section className="section shop-layout">
        <aside className="shop-sidebar">
          <div className="shop-widget">
            <h3><Search size={18} /> Search</h3>
            <label className="search-field">
              <Search size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search plants or seeds"
              />
            </label>
          </div>

          <div className="shop-widget">
            <h3><Filter size={18} /> Categories</h3>
            <button
              className={`filter-link ${selectedCategory === null ? "active" : ""}`}
              type="button"
              onClick={() => setSelectedCategory(null)}
            >
              <span>All Categories</span>
              <small>{products.length}</small>
            </button>
            {categories.map((category) => (
              <button
                className={`filter-link ${selectedCategory === category ? "active" : ""}`}
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
              >
                <span>{category}</span>
                <small>{products.filter((product) => product.category === category).length}</small>
              </button>
            ))}
          </div>

          <div className="shop-widget">
            <h3><SlidersHorizontal size={18} /> Product Type</h3>
            <div className="type-filter">
              {[
                { label: "All", value: "all" },
                { label: "Plants", value: "plant" },
                { label: "Seeds", value: "seed" }
              ].map((option) => (
                <button
                  className={selectedType === option.value ? "active" : ""}
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedType(option.value as ProductType | "all")}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="shop-help">
            <Sprout size={24} />
            <h3>Need bulk nursery stock?</h3>
            <p>Call us for sapling availability, advance bookings, and dispatch help.</p>
            <Link className="button secondary" href="/contact">
              Contact Store
            </Link>
          </div>
        </aside>

        <div className="shop-results">
          <div className="shop-toolbar">
            <div>
              <p className="eyebrow">Our Products</p>
              <h2>{selectedCategory || "All nursery products"}</h2>
              <p className="meta">
                {loading ? "Loading live catalog..." : `Showing ${filteredProducts.length} of ${products.length} products`}
              </p>
            </div>
            <label className="sort-control">
              <span>Sort by</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="featured">Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="stock">Stock</option>
              </select>
            </label>
          </div>

          <div className="product-list">
            {filteredProducts.length ? (
              filteredProducts.map((product) => (
                <article className="product-list-card" key={product.id}>
                  <Link className="product-list-image" href={`/products/${product.id}`}>
                    <Image src={product.image} alt={product.name} width={360} height={300} />
                  </Link>
                  <div className="product-list-body">
                    <div className="rating-row" aria-label="Rated 5 out of 5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={15} fill="currentColor" />
                      ))}
                    </div>
                    <p className="meta">{product.category} - {product.type}</p>
                    <h3><Link href={`/products/${product.id}`}>{product.name}</Link></h3>
                    <p>{product.description}</p>
                    <div className="product-list-meta">
                      <strong>Rs. {product.price}</strong>
                      <span>{product.stock.toLocaleString("en-IN")} in stock</span>
                    </div>
                    <div className="row-actions">
                      <Link className="button" href={`/products/${product.id}`}>
                        View Details
                      </Link>
                      <Link className="button secondary" href="/cart" aria-label={`Add ${product.name} to cart`}>
                        <ShoppingCart size={17} />
                        Add
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-shop">
                <Sprout size={34} />
                <h3>No products found</h3>
                <p className="meta">Try another category, product type, or search term.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
