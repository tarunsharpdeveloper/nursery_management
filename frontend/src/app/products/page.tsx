"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiRequest, getMediaUrl } from "@/lib/api";
import type { Product, ProductType } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { ProductReviewSummary } from "@/components/ProductReviewSummary";

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
  average_rating?: number;
  total_reviews?: number;
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

function normalizeCategory(str: string | null | undefined): string {
  if (!str) return "";
  let clean = str.toLowerCase().trim().replace(/[-_]/g, " ");
  clean = clean.replace(/\b(seeds|plants)\b/g, (match) => match.slice(0, -1));
  return clean;
}

function isCategoryMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const normA = normalizeCategory(a);
  const normB = normalizeCategory(b);
  if (normA === normB) return true;
  return normA.includes(normB) || normB.includes(normA);
}

export default function ProductsPage() {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [dbCategories, setDbCategories] = useState<{ id: number; name: string; product_count: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<ProductType | "all">("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    function handleResize() {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setViewMode("grid");
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load all categories for sidebar widget
  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await apiRequest<any[]>("/api/categories");
        if (Array.isArray(data)) {
          setDbCategories(
            data
              .filter((c) => {
                const isActive = c.is_active !== 0 && c.is_active !== false;
                const directCount = c.direct_product_count !== undefined ? Number(c.direct_product_count) : Number(c.product_count || 0);
                return isActive && directCount > 0;
              })
              .map((c) => ({
                id: c.id,
                name: c.name,
                product_count: c.direct_product_count !== undefined ? Number(c.direct_product_count) : Number(c.product_count || 0)
              }))
          );
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, []);

  // Read URL search params on mount
  useEffect(() => {
    function readParams() {
      if (typeof window !== "undefined") {
        const searchParams = new URLSearchParams(window.location.search);
        const catParam = searchParams.get("category");
        if (catParam) {
          const cleanCat = decodeURIComponent(catParam).replace(/\+/g, " ");
          setSelectedCategory(cleanCat);
        }
        const searchParam = searchParams.get("search");
        if (searchParam) {
          const cleanQuery = decodeURIComponent(searchParam).replace(/\+/g, " ");
          setQuery(cleanQuery);
        }
      }
    }

    readParams();
    window.addEventListener("popstate", readParams);
    return () => window.removeEventListener("popstate", readParams);
  }, []);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [visibleCount, setVisibleCount] = useState(6);

  // Fetch all active products once on mount
  useEffect(() => {
    let mounted = true;
    async function loadAllProducts() {
      try {
        setLoading(true);
        const response = await apiRequest<{
          data: BackendProduct[];
          totalRecords: number;
        }>("/api/products?limit=1000");

        if (!mounted) return;

        const transformed: Product[] = (response.data || []).map((product) => {
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
            image: getMediaUrl(resolvedImage),
            active: Boolean(product.is_active),
            average_rating: product.average_rating || 0,
            total_reviews: product.total_reviews || 0
          };
        });

        setAllProducts(transformed);
      } catch (error) {
        console.error("Failed to load products:", error);
        if (mounted) setAllProducts(fallbackProducts);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAllProducts();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter and sort in memory over loaded records
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Filter by Category
    if (selectedCategory) {
      result = result.filter((p) => isCategoryMatch(p.category, selectedCategory));
    }

    // Filter by Product Type ("plant", "seed")
    if (selectedType && selectedType !== "all") {
      const typeLower = selectedType.toLowerCase().trim();
      result = result.filter(
        (p) =>
          (p.type || "").toLowerCase().trim().includes(typeLower) ||
          (p.category || "").toLowerCase().trim().includes(typeLower)
      );
    }

    // Filter by Search Query
    if (query.trim()) {
      const qLower = query.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(qLower) ||
          (p.description || "").toLowerCase().includes(qLower) ||
          (p.category || "").toLowerCase().includes(qLower)
      );
    }

    // Sort
    if (sortBy === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name" || sortBy === "featured") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "stock") {
      result.sort((a, b) => b.stock - a.stock);
    } else if (sortBy === "rating") {
      result.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
    }

    return result;
  }, [allProducts, selectedCategory, selectedType, query, sortBy]);

  // Reset visible count on filter/search/sort change
  useEffect(() => {
    setVisibleCount(6);
  }, [selectedCategory, selectedType, query, sortBy]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const selectCategory = (category: string | null) => {
    setSelectedCategory(category);
    setVisibleCount(6);
    const nextUrl = category ? `/products?category=${encodeURIComponent(category)}` : "/products";
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", nextUrl);
    }
    document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const selectType = (type: ProductType | "all") => {
    setSelectedType(type);
    setVisibleCount(6);
    document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMoreProducts = () => {
    setVisibleCount((prev) => prev + 6);
  };

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
      <section className="space space-extra-bottom" id="products-section" style={{ scrollMarginTop: "120px" }}>
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
                          {dbCategories.reduce((acc, c) => acc + c.product_count, 0) || totalRecords}
                        </span>
                      </a>
                    </li>
                    {dbCategories.map((cat) => {
                      const isActive = isCategoryMatch(selectedCategory, cat.name);
                      return (
                        <li key={cat.id || cat.name}>
                          <a
                            href={`/products?category=${encodeURIComponent(cat.name)}`}
                            onClick={(e) => { e.preventDefault(); selectCategory(cat.name); }}
                            style={isActive ? { backgroundColor: "var(--theme-color)", color: "var(--white-color)" } : {}}
                          >
                            {cat.name}
                            <span
                              className="cat-item__number"
                              style={isActive ? { backgroundColor: "var(--theme-color2)", color: "var(--title-color)" } : {}}
                            >
                              {cat.product_count}
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
                        onClick={(e) => { e.preventDefault(); selectType("all"); }}
                        style={selectedType === "all" ? { backgroundColor: "var(--theme-color)", color: "var(--white-color)" } : {}}
                      >
                        All Types
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); selectType("plant"); }}
                        style={selectedType === "plant" ? { backgroundColor: "var(--theme-color)", color: "var(--white-color)" } : {}}
                      >
                        Plants
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); selectType("seed"); }}
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
                      Showing {displayedProducts.length} of {filteredProducts.length} products
                    </p>
                  </div>
                  <div className="col-md-auto d-flex align-items-center gap-3" style={{ position: 'relative', zIndex: 10 }}>
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
                    <ul className="nav nav-tabs d-none d-md-flex" role="tablist" style={{ borderBottom: 0 }}>
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
                          <i className="fas fa-list"></i>
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
                          <i className="fas fa-th"></i>
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
              ) : displayedProducts.length ? (
                <>
                  {viewMode === "list" ? (
                    /* ── List View (product-style7) ── */
                    <div className="row">
                      {displayedProducts.map((product) => (
                        <div className="col-12 mb-30" key={product.id}>
                          <div className="vs-product product-style1 modern-card" style={{ display: "flex", alignItems: "stretch", height: "240px", flexDirection: "row", textAlign: "left" }}>
                            <div className="product-img" style={{ position: "relative", width: "240px", height: "100%", flexShrink: 0, padding: "20px", background: "#f8fcf6", borderRight: "1px solid rgba(0,0,0,0.02)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                              <button
                                type="button"
                                className="card-favorite-btn"
                                aria-label={isFavorite(product.id) ? "Remove from Favorites" : "Add to Favorites"}
                                onClick={(e) => toggleFavorite(product, e)}
                              >
                                <i className={isFavorite(product.id) ? "fas fa-heart" : "far fa-heart"} style={{ color: isFavorite(product.id) ? "#dc2626" : "#666666" }}></i>
                              </button>
                              <Link href={`/products/${product.id}`} style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="img-fluid"
                                  style={{ 
                                    height: "180px", 
                                    width: "auto",
                                    objectFit: "contain"
                                  }}
                                />
                              </Link>
                              {product.stock <= 0 && <span className="product-tag2" style={{ background: "var(--danger)" }}>Out of Stock</span>}
                              {product.stock > 0 && product.stock < 100 && <span className="product-tag2" style={{ background: "#d4a516" }}>Limited Stock</span>}
                            </div>
                            <div className="product-content" style={{ flex: 1, padding: "25px 30px", display: "flex", flexDirection: "column", justifyContent: "flex-start", position: "relative", height: "100%" }}>
                              <ProductReviewSummary productId={product.id} rating={product.average_rating} totalReviews={product.total_reviews} />
                              <h3 className="product-title" style={{ marginBottom: "8px", fontSize: "1.2rem" }}>
                                <Link href={`/products/${product.id}`}>{product.name}</Link>
                              </h3>
                              <p style={{ fontSize: "13px", color: "#777777", margin: "0 0 12px 0", lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {product.description || "No description available."}
                              </p>
                              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                <span className="product-cate" style={{ margin: 0, fontSize: "10px", fontWeight: 700 }}>
                                  SUBCATEGORY: <span style={{ fontWeight: 500, color: "var(--title-color)" }}>{product.category}</span>
                                </span>
                              </div>
                              
                              <span className="product-price" style={{ fontSize: "22px", color: "var(--title-color)", fontWeight: "800", display: "flex", alignItems: "center", gap: "10px", position: "absolute", bottom: "22px", left: "30px" }}>
                                Rs. {product.price}
                                <span style={{ fontSize: "12px", fontWeight: "normal", color: "var(--muted)", padding: "3px 8px", background: "#f4f4f4", borderRadius: "8px" }}>
                                  {product.stock} in stock
                                </span>
                              </span>
                              
                              <div className="product-actions" style={{ right: "30px", bottom: "16px", position: "absolute" }}>
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
                  ) : (
                    /* ── Grid View (product-style1 from homepage) ── */
                    <div className="row">
                      {displayedProducts.map((product) => (
                        <div className="col-6 col-sm-6 col-md-6 col-lg-6 col-xl-6 mb-20 px-2" key={product.id}>
                          <div className="vs-product product-style1 modern-card">
                            <div className="product-img">
                              <button
                                type="button"
                                className="card-favorite-btn"
                                aria-label={isFavorite(product.id) ? "Remove from Favorites" : "Add to Favorites"}
                                onClick={(e) => toggleFavorite(product, e)}
                              >
                                <i className={isFavorite(product.id) ? "fas fa-heart" : "far fa-heart"} style={{ color: isFavorite(product.id) ? "#dc2626" : "#666666" }}></i>
                              </button>
                              <Link href={`/products/${product.id}`}>
                                <img src={product.image} alt={product.name} className="img w-100" />
                              </Link>
                              {product.stock <= 0 && <span className="product-tag2" style={{ background: "var(--danger)" }}>Out of Stock</span>}
                              {product.stock > 0 && product.stock < 100 && <span className="product-tag2" style={{ background: "#d4a516" }}>Limited Stock</span>}
                            </div>
                            <div className="product-content">
                              <ProductReviewSummary productId={product.id} rating={product.average_rating} totalReviews={product.total_reviews} />
                              <h3 className="product-title" style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                marginBottom: "6px"
                              }}>
                                <Link href={`/products/${product.id}`}>{product.name}</Link>
                              </h3>
                              <p style={{
                                fontSize: "13px",
                                color: "#777777",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                marginBottom: "12px",
                                lineHeight: "1.4"
                              }}>
                                {product.description || "No description available."}
                              </p>
                              <span className="product-cate" style={{ margin: 0, fontSize: "11px", fontWeight: 700, marginBottom: "8px", display: "block" }}>
                                SUBCATEGORY: <span style={{ fontWeight: 500, color: "var(--title-color)" }}>{product.category}</span>
                              </span>
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
                  )}

                  {/* Load More Button */}
                  {visibleCount < filteredProducts.length && (
                    <div style={{ display: "flex", justifyContent: "center", marginTop: "20px", marginBottom: "20px" }}>
                      <button
                        onClick={loadMoreProducts}
                        className=""
                        style={{
                          padding: "10px 30px",
                          fontSize: "14px",
                          fontWeight: 700,
                          borderRadius: "10px",
                          minWidth: "100px",
                          cursor: "pointer",
                          background:'#47b32d',
                          color:'white',
                          border:'0px solid #47b32d'
                        }}
                      >
                        Load More Products
                        <i className="fas fa-arrow-down" style={{ marginLeft: "8px" }}></i>
                      </button>
                    </div>
                  )}
                </>
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
