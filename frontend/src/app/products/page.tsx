"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import type { Product, ProductType } from "@/lib/types";
import { useCart } from "@/context/CartContext";

interface BackendProduct {
  id: number;
  name: string;
  product_type: ProductType;
  description: string;
  selling_price: number;
  available_quantity: number;
  photo_url: string;
  media_urls: string | null;
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
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<ProductType | "all">("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await apiRequest<BackendProduct[]>("/api/products");
        const transformedProducts: Product[] = data.map((product) => {
          // Resolve best image: first from media_urls JSON array, then photo_url, then fallback
          const FALLBACK_IMG = "https://dms.mydukaan.io/original/jpeg/media/54ecc558-e85c-462a-b5e5-692caad96f53.jpg";
          let resolvedImage = product.photo_url || FALLBACK_IMG;
          if (product.media_urls) {
            try {
              const parsed = JSON.parse(product.media_urls);
              if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
                resolvedImage = parsed[0];
              }
            } catch {
              if (product.media_urls) resolvedImage = product.media_urls;
            }
          }
          return {
            id: product.id,
            name: product.name,
            type: product.product_type,
            category: product.category,
            description: product.description,
            price: Number(product.selling_price),
            stock: Math.max(0, Number(product.available_quantity)),
            sold: 0,
            image: resolvedImage,
            active: Boolean(product.is_active)
          };
        });

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

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    
    // Category param
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      const matchedCategory = categories.find(
        (category) => category.toLowerCase() === categoryParam.toLowerCase()
      );
      setSelectedCategory(matchedCategory || categoryParam);
    } else {
      setSelectedCategory(null);
    }

    // Search param
    const searchParam = searchParams.get("search");
    if (searchParam) {
      setQuery(searchParam);
    }
  }, [categories]);

  const selectCategory = (category: string | null) => {
    setSelectedCategory(category);
    const nextUrl = category ? `/products?category=${encodeURIComponent(category)}` : "/products";
    window.history.pushState(null, "", nextUrl);
  };

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesCategory = selectedCategory
        ? product.category.toLowerCase() === selectedCategory.toLowerCase()
        : true;
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
      {/* ── Breadcrumb Header ── */}
      <section className="z-index-common breadcumb-wrapper" style={{ backgroundImage: "url('https://img.magnific.com/free-photo/pot-with-young-monstera-with-deep-cuts-droplets-water-after-spraying-tropical-liana-dark-background-growing-tropical-plants-home-office_166373-9133.jpg?semt=ais_hybrid&w=740&q=80')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="container">
          <div className="row justify-content-between align-items-center">
            <div className="col-auto">
              <div className="breadcumb-content">
                <h1 className="breadcumb-title">Product List</h1>
                <div className="breadcumb-menu-wrap">
                  <ul className="breadcumb-menu">
                    <li><Link href="/">Home</Link></li>
                    <li>Product List</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Product Area ── */}
      <section className="space space-extra-bottom">
        <div className="container">
          <div className="row">
            {/* ── Sidebar (Left Column) ── */}
            <div className="col-lg-3">
              <aside className="sidebar-area product">
                {/* Search Widget */}
                <div className="widget widget--product widget_search">
                  <form className="search-form" onSubmit={(e) => e.preventDefault()}>
                    <input
                      type="text"
                      placeholder="Search Here"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <button type="submit" aria-label="search button"><i className="far fa-search"></i></button>
                  </form>
                </div>

                {/* Categories Widget */}
                <div className="widget widget--product">
                  <h3 className="widget_title">Categories</h3>
                  <ul className="widget_categories">
                    <li>
                      <a
                        href="/products"
                        onClick={(e) => { e.preventDefault(); selectCategory(null); }}
                        style={selectedCategory === null ? { backgroundColor: "var(--theme-color)", color: "var(--white-color)" } : {}}
                      >
                        All Categories
                        <span
                          className="cat-item__number"
                          style={selectedCategory === null ? { backgroundColor: "var(--theme-color2)", color: "var(--title-color)" } : {}}
                        >
                          {products.length}
                        </span>
                      </a>
                    </li>
                    {categories.map((category) => {
                      const isActive = selectedCategory?.toLowerCase() === category.toLowerCase();
                      return (
                        <li key={category}>
                          <a
                            href={`/products?category=${encodeURIComponent(category)}`}
                            onClick={(e) => { e.preventDefault(); selectCategory(category); }}
                            style={isActive ? { backgroundColor: "var(--theme-color)", color: "var(--white-color)" } : {}}
                          >
                            {category}
                            <span
                              className="cat-item__number"
                              style={isActive ? { backgroundColor: "var(--theme-color2)", color: "var(--title-color)" } : {}}
                            >
                              {products.filter((p) => p.category === category).length}
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Product Type Widget */}
                <div className="widget widget--product">
                  <h3 className="widget_title">Product Type</h3>
                  <ul className="widget_categories">
                    <li>
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); setSelectedType("all"); }}
                        style={selectedType === "all" ? { backgroundColor: "var(--theme-color)", color: "var(--white-color)" } : {}}
                      >
                        All Types
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); setSelectedType("plant"); }}
                        style={selectedType === "plant" ? { backgroundColor: "var(--theme-color)", color: "var(--white-color)" } : {}}
                      >
                        Plants
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); setSelectedType("seed"); }}
                        style={selectedType === "seed" ? { backgroundColor: "var(--theme-color)", color: "var(--white-color)" } : {}}
                      >
                        Seeds
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Info Widget */}
                <div className="widget widget--product" style={{ padding: "40px 30px", backgroundColor: "#eef3ec", borderRadius: "30px", border: "none" }}>
                  <h3 className="widget_title" style={{ fontSize: "20px", marginBottom: "15px" }}>Bulk Nursery Stock?</h3>
                  <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "25px", lineHeight: "1.6" }}>
                    Call us for grafting sapling availability, advance bookings, and dispatch support.
                  </p>
                  <Link href="/contact" className="vs-btn style2" style={{ display: "inline-flex", width: "100%", justifyContent: "center" }}>
                    Contact Store
                  </Link>
                </div>
              </aside>
            </div>

            {/* ── Products List/Grid (Right Column) ── */}
            <div className="col-lg-9">
              <div className="vs-sort-bar">
                <div className="row gap-4 align-items-center justify-content-between">
                  <div className="col-md-auto flex-grow-1">
                    <p className="woocommerce-result-count">
                      Showing {filteredProducts.length} of {products.length} results
                    </p>
                  </div>
                  <div className="col-md-auto d-flex align-items-center gap-3">
                    <div className="woocommerce-ordering">
                      <select
                        className="orderby"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{ display: "block" }}
                      >
                        <option value="featured">Sort by: Name</option>
                        <option value="price-low">Sort by price: low to high</option>
                        <option value="price-high">Sort by price: high to low</option>
                        <option value="stock">Sort by stock</option>
                      </select>
                    </div>
                    <ul className="nav nav-tabs" role="tablist" style={{ borderBottom: 0 }}>
                      <li className="nav-item" role="presentation">
                        <button
                          className={`nav-link ${viewMode === "list" ? "active" : ""}`}
                          onClick={() => setViewMode("list")}
                          type="button"
                          aria-label="List View"
                          style={{
                            border: "none",
                            background: viewMode === "list" ? "#ffc107" : "transparent",
                            color: viewMode === "list" ? "#000" : "inherit",
                            padding: "6px 10px",
                            borderRadius: "50%"
                          }}
                        >
                          <i className="fad fa-th-list"></i>
                        </button>
                      </li>
                      <li className="nav-item" role="presentation">
                        <button
                          className={`nav-link ${viewMode === "grid" ? "active" : ""}`}
                          onClick={() => setViewMode("grid")}
                          type="button"
                          aria-label="Grid View"
                          style={{
                            border: "none",
                            background: viewMode === "grid" ? "#ffc107" : "transparent",
                            color: viewMode === "grid" ? "#000" : "inherit",
                            padding: "6px 10px",
                            borderRadius: "50%"
                          }}
                        >
                          <i className="fad fa-th"></i>
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Products Output */}
              {loading ? (
                <div style={{ textAlign: "center", padding: "80px 20px" }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: "32px", color: "var(--brand)", marginBottom: "15px" }}></i>
                  <p style={{ color: "var(--muted)" }}>Loading live catalog...</p>
                </div>
              ) : filteredProducts.length ? (
                viewMode === "list" ? (
                  /* ── List View (product-style7) ── */
                  <div className="row">
                    {filteredProducts.map((product) => (
                      <div className="col-12 mb-30" key={product.id}>
                        <div className="vs-product product-style7" style={{ display: "flex", alignItems: "stretch", minHeight: "200px" }}>
                          <div className="product-img" style={{ position: "relative", width: "300px", height: "300px", flexShrink: 0 }}>
                            <Link href={`/products/${product.id}`} style={{ width: "100%", height: "100%", display: "block" }}>
                              <img
                                src={product.image}
                                alt={product.name}
                                className="img"
                                style={{ 
                                  width: "100%", 
                                  height: "100%", 
                                  objectFit: "cover",
                                  borderRadius: "8px"
                                }}
                              />
                            </Link>
                            {product.stock <= 0 && <span className="product-tag2" style={{ position: "absolute", top: "15px", left: "15px", fontSize: "12px", fontWeight: 600, padding: "3px 12px", borderRadius: "15px", background: "var(--danger)", color: "#fff", zIndex: 2, border: "1px solid #fff" }}>Out of Stock</span>}
                            {product.stock > 0 && product.stock < 100 && <span className="product-tag2" style={{ position: "absolute", top: "15px", left: "15px", fontSize: "12px", fontWeight: 600, padding: "3px 12px", borderRadius: "15px", background: "var(--accent)", color: "#fff", zIndex: 2, border: "1px solid #fff", whiteSpace: "nowrap" }}>Limited Stock</span>}
                          </div>
                          <div className="product-content" style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                            <div className="star-rating">
                              <span style={{ width: "100%" }}>Rated 5.0 out of 5</span>
                            </div>
                            <h3 className="product-title">
                              <Link href={`/products/${product.id}`}>{product.name}</Link>
                            </h3>
                            <span className="product-weight">{product.category} - {product.type}</span>
                            <p style={{ fontSize: "14px", color: "var(--muted)", margin: "10px 0" }}>
                              {product.description}
                            </p>
                            <span className="product-price">
                              Rs. {product.price}
                              <span style={{ fontSize: "13px", fontWeight: "normal", color: "var(--muted)", marginLeft: "12px" }}>
                                {product.stock.toLocaleString("en-IN")} in stock
                              </span>
                            </span>
                            <button
                              type="button"
                              className="cart-btn"
                              aria-label="Add to cart"
                              style={{ border: "none", cursor: "pointer" }}
                              onClick={() => addToCart(product, 1)}
                            >
                              <i className="fas fa-shopping-basket"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* ── Grid View (product-style1 from homepage) ── */
                  <div className="row">
                    {filteredProducts.map((product) => (
                      <div className="col-xl-4 col-md-6 mb-30" key={product.id}>
                        <div className="vs-product product-style1">
                          <div className="product-img">
                            <Link href={`/products/${product.id}`}>
                              <img src={product.image} alt={product.name} className="img w-100" style={{ height: "230px", objectFit: "cover" }} />
                            </Link>
                            {product.stock <= 0 && <span className="product-tag2" style={{ background: "var(--danger)" }}>Out of Stock</span>}
                            {product.stock > 0 && product.stock < 100 && <span className="product-tag2" style={{ background: "var(--accent)" }}>Limited Stock</span>}
                          </div>
                          <div className="product-content">
                            <div className="star-rating">
                              <span style={{ width: "100%" }}>Rated 5.0 out of 5</span>
                            </div>
                            <h3 className="product-title">
                              <Link href={`/products/${product.id}`}>{product.name}</Link>
                            </h3>
                            <span className="product-cate">{product.category}</span>
                            <span className="product-price">Rs. {product.price}</span>
                            <div className="product-actions">
                              <button type="button" className="vs-btn" onClick={() => addToCart(product, 1)}>
                                Add to Cart
                              </button>
                              <button type="button" className="cart-btn" onClick={() => addToCart(product, 1)} aria-label={`Add ${product.name} to cart`}>
                                <i className="fas fa-shopping-basket"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Empty state */
                <div className="empty-shop" style={{ textAlign: "center", padding: "80px 20px", background: "white", borderRadius: "30px", border: "1px solid var(--vs-border-color3)" }}>
                  <i className="fal fa-seedling" style={{ fontSize: "48px", color: "var(--brand)", marginBottom: "20px", display: "block" }}></i>
                  <h3>No products found</h3>
                  <p className="meta" style={{ color: "var(--muted)" }}>Try another category, product type, or search query.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
