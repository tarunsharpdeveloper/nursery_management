"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useCart } from "@/context/CartContext";

// ── Types ──────────────────────────────────────────────────────────────────
interface BackendProduct {
  id: number;
  name: string;
  product_type: string;
  description: string | null;
  selling_price: number;
  actual_price: number;
  available_quantity: number;
  unit: string | null;
  photo_url: string | null;
  media_urls: string | null;
  is_active: boolean;
  category: string;
  variants: Array<{
    id: number;
    unit: string | null;
    unit_value: string | null;
    actual_price: number;
    selling_price: number;
    available_quantity: number;
  }>;
}

// ── Countdown timer hook ───────────────────────────────────────────────────
function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculate = () => {
      const distance = targetDate.getTime() - Date.now();
      if (distance < 0) return setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setTimeLeft({
        days: Math.floor(distance / 86_400_000),
        hours: Math.floor((distance % 86_400_000) / 3_600_000),
        minutes: Math.floor((distance % 3_600_000) / 60_000),
        seconds: Math.floor((distance % 60_000) / 1000),
      });
    };
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

// ── Star rating display ────────────────────────────────────────────────────
function StarRating({ rating = 5, max = 5 }: { rating?: number; max?: number }) {
  return (
    <div className="star-rating" role="img" aria-label={`Rated ${rating} out of ${max}`}>
      <span style={{ width: `${(rating / max) * 100}%` }}>
        Rated <strong className="rating">{rating}</strong> out of {max}
      </span>
    </div>
  );
}

// ── Fallback image ─────────────────────────────────────────────────────────
const DEFAULT_IMG =
  "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80";

const OFFER_DATE = new Date("2027-12-31T00:00:00");

// ── Page component ─────────────────────────────────────────────────────────
export default function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<BackendProduct | null>(null);
  const [allProducts, setAllProducts] = useState<BackendProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [activeThumb, setActiveThumb] = useState(0);
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const countdown = useCountdown(OFFER_DATE);
  const pad = (n: number) => String(n).padStart(2, "0");

  // Fetch all products (public endpoint) and find the one matching this id
  useEffect(() => {
    async function load() {
      try {
        const data = await apiRequest<BackendProduct[]>("/api/products");
        setAllProducts(data);
        const found = data.find((p) => p.id === Number(id));
        if (found) {
          setProduct(found);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load product:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!product?.variants?.length) {
      setSelectedVariantId(null);
      return;
    }
    setSelectedVariantId(product.variants[0].id);
    setQuantity(1);
  }, [product?.id]);

  // ── Related products (exclude current, show up to 4) ──────────────────
  const related = allProducts
    .filter((p) => p.id !== Number(id) && p.is_active)
    .slice(0, 4);

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <main>
        <section
          className="z-index-common breadcumb-wrapper"
          style={{ backgroundImage: "url('/assets/img/bg/b-1-3.png')" }}
        >
          <div className="container">
            <div className="breadcumb-content">
              <h1 className="breadcumb-title">Shop Details</h1>
            </div>
          </div>
        </section>
        <section className="space space-extra-bottom">
          <div className="container" style={{ textAlign: "center", padding: "80px 20px" }}>
            <i
              className="fas fa-spinner fa-spin"
              style={{ fontSize: "40px", color: "var(--brand)", marginBottom: "20px" }}
            ></i>
            <p style={{ color: "var(--muted)", fontSize: "18px" }}>Loading product…</p>
          </div>
        </section>
      </main>
    );
  }

  // ── Not found state ────────────────────────────────────────────────────
  if (notFound || !product) {
    return (
      <main>
        <section
          className="z-index-common breadcumb-wrapper"
          style={{ backgroundImage: "url('/assets/img/bg/b-1-3.png')" }}
        >
          <div className="container">
            <div className="breadcumb-content">
              <h1 className="breadcumb-title">Product Not Found</h1>
              <div className="breadcumb-menu-wrap">
                <ul className="breadcumb-menu">
                  <li><Link href="/">Home</Link></li>
                  <li><Link href="/products">Products</Link></li>
                  <li>Not Found</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        <section className="space space-extra-bottom">
          <div className="container" style={{ textAlign: "center", padding: "80px 20px" }}>
            <i
              className="fal fa-seedling"
              style={{ fontSize: "60px", color: "var(--brand)", marginBottom: "20px", display: "block" }}
            ></i>
            <h2>Product not found</h2>
            <p style={{ color: "var(--muted)", marginBottom: "30px" }}>
              This product doesn&apos;t exist or has been removed.
            </p>
            <Link href="/products" className="vs-btn">
              Browse All Products
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // ── Resolve image ──────────────────────────────────────────────────────
  const mainImage = product.photo_url || DEFAULT_IMG;

  // Parse extra media URLs if available
  let thumbImages: string[] = [mainImage];
  if (product.media_urls) {
    try {
      const parsed = JSON.parse(product.media_urls);
      if (Array.isArray(parsed) && parsed.length > 0) {
        thumbImages = [mainImage, ...parsed.filter((u: string) => u !== mainImage)].slice(0, 4);
      }
    } catch {
      // media_urls might just be a single URL string
      if (product.media_urls !== mainImage) {
        thumbImages = [mainImage, product.media_urls];
      }
    }
  }

  const displayImage = thumbImages[activeThumb] || mainImage;
  const variants = product.variants || [];
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) || null;
  const selectedVariantLabel = selectedVariant
    ? [selectedVariant.unit_value, selectedVariant.unit].filter(Boolean).join(" ") || selectedVariant.unit || "Default"
    : "";
  const displaySellingPrice = Number(selectedVariant?.selling_price ?? product.selling_price);
  const displayActualPrice = Number(selectedVariant?.actual_price ?? product.actual_price);
  const displayStock = Number(selectedVariant?.available_quantity ?? product.available_quantity);
  const displayUnit = selectedVariant?.unit || product.unit;
  const hasDiscount = displayActualPrice > displaySellingPrice;

  return (
    <main>
      {/* ── Breadcrumb ── */}
      <section
        className="z-index-common breadcumb-wrapper"
        style={{ backgroundImage: "url('/assets/img/bg/b-1-3.png')" }}
      >
        <div className="container">
          <div className="row justify-content-between align-items-center">
            <div className="col-auto">
              <div className="breadcumb-content">
                <h1 className="breadcumb-title">Shop Details</h1>
                <div className="breadcumb-menu-wrap">
                  <ul className="breadcumb-menu">
                    <li><Link href="/">Home</Link></li>
                    <li><Link href="/products">Products</Link></li>
                    <li>{product.name}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Product Details ── */}
      <section className="space space-extra-bottom">
        <div className="container">
          <div className="row ">

            {/* Left: Images */}
            <div className="col-lg-6 mb-30">
              <div className="product-slide-row">
                {/* Main image */}
                <div className="product-big-img">
                  <div className="img">
                    <img
                      src={displayImage}
                      alt={product.name}
                      style={{ width: "100%", height: "auto", maxHeight: "480px", objectFit: "contain" }}
                    />
                  </div>
                </div>

                {/* Thumbnails */}
                {thumbImages.length > 1 && (
                  <div
                    className="product-thumb-slide"
                    style={{ display: "flex", gap: "12px", marginTop: "15px" }}
                  >
                    {thumbImages.map((src, i) => (
                      <div
                        key={i}
                        className={`thumb${activeThumb === i ? " active" : ""}`}
                        style={{ flex: 1, cursor: "pointer" }}
                        onClick={() => setActiveThumb(i)}
                      >
                        <img
                          src={src}
                          alt={`View ${i + 1}`}
                          style={{ width: "100%", height: "90px", objectFit: "cover" }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Product Info */}
            <div className="col-lg-6 mb-30">
              <div className="product-about">

                {/* Rating + Stock */}
                <div className="product-rating">
                  <span className="product-instock">
                    {displayStock > 0 ? "Available" : "Out of Stock"}
                  </span>
                  <StarRating rating={5} />
                  <span className="product-rating__total">(Verified)</span>
                </div>

                {/* Title */}
                <h2 className="product-title">{product.name}</h2>

                {/* Category / Type */}
                <span className="product-ml">
                  {product.category}
                  {product.product_type ? ` · ${product.product_type}` : ""}
                  {displayUnit ? ` · ${displayUnit}` : ""}
                </span>

                {/* Price */}
                <p className="product-price">
                  Rs.&nbsp;{displaySellingPrice.toFixed(2)}
                  {hasDiscount && (
                    <del>Rs.&nbsp;{displayActualPrice.toFixed(2)}</del>
                  )}
                </p>

                {variants.length > 0 && (
                  <div className="product-variant-picker">
                    <div className="product-variant-heading">
                      <span>Choose Variant</span>
                      {selectedVariantLabel && <strong>{selectedVariantLabel}</strong>}
                    </div>
                    <div className="product-variant-options">
                      {variants.map((variant) => {
                        const label =
                          [variant.unit_value, variant.unit].filter(Boolean).join(" ") ||
                          variant.unit ||
                          "Default";
                        const stock = Number(variant.available_quantity);

                        return (
                          <button
                            key={variant.id}
                            type="button"
                            className={`product-variant-option${selectedVariantId === variant.id ? " active" : ""}`}
                            onClick={() => {
                              setSelectedVariantId(variant.id);
                              setQuantity(1);
                            }}
                          >
                            <span>{label}</span>
                            <strong>Rs.&nbsp;{Number(variant.selling_price).toFixed(2)}</strong>
                            <small>{stock > 0 ? `${stock} in stock` : "Out of stock"}</small>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Description snippet */}
                {product.description && (
                  <p style={{ marginBottom: "24px", color: "var(--muted)", lineHeight: "1.7" }}>
                    {product.description}
                  </p>
                )}

                {/* Quantity selector */}
                <div className="actions">
                  <div className="quantity">
                    <label htmlFor="qty-field" className="screen-reader-text">Quantity:</label>
                    <div className="quantity__field quantity-container">
                      <input
                        type="number"
                        id="qty-field"
                        className="qty-input"
                        min={1}
                        max={displayStock || 99}
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(
                            Math.max(1, Math.min(displayStock || 99, Number(e.target.value)))
                          )
                        }
                        title="Qty"
                      />
                      <div className="quantity__buttons">
                        <button
                          type="button"
                          className="quantity-plus qty-btn"
                          onClick={() =>
                            setQuantity((q) => Math.min(displayStock || 99, q + 1))
                          }
                        >
                          <i className="fas fa-caret-up"></i>
                        </button>
                        <button
                          type="button"
                          className="quantity-minus qty-btn"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        >
                          <i className="fas fa-caret-down"></i>
                        </button>
                      </div>
                    </div>
                    <span style={{ color: "var(--muted)", fontSize: "14px" }}>
                      {displayStock} in stock
                    </span>
                  </div>
                </div>

                {/* Countdown */}
                <span className="counter-title">Limited Time Offer:</span>
                <div className="counter-style">
                  <ul className="offer-counter">
                    {[
                      { val: countdown.days, label: "Days" },
                      { val: countdown.hours, label: "Hours" },
                      { val: countdown.minutes, label: "Minutes" },
                      { val: countdown.seconds, label: "Seconds" },
                    ].map(({ val, label }) => (
                      <li key={label}>
                        <div className="count-number">{pad(val)}</div>
                        <span className="count-name">{label}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Buttons */}
                <div className="pro-btns">
                  <button
                    type="button"
                    className="vs-btn"
                    disabled={displayStock <= 0}
                    onClick={() => {
                      addToCart(
                        {
                          ...product,
                          cartKey: selectedVariant ? `${product.id}:${selectedVariant.id}` : String(product.id),
                          variant_id: selectedVariant?.id || null,
                          variant_label: selectedVariantLabel || null,
                          name: selectedVariant ? `${product.name} (${selectedVariantLabel})` : product.name,
                          selling_price: displaySellingPrice,
                          actual_price: displayActualPrice,
                          available_quantity: displayStock,
                          unit: displayUnit,
                        },
                        quantity
                      );
                      router.push("/cart");
                    }}
                  >
                    Add to Cart
                  </button>
                  <button type="button" className="icon-btn" aria-label="Wishlist">
                    <i className="far fa-heart"></i>
                  </button>
                </div>

                {/* Meta info */}
                <div className="product_meta">
                  <span className="sku_wrapper">
                    <p>SKU:</p>
                    <span className="sku">PROD-{String(product.id).padStart(4, "0")}</span>
                  </span>
                  <span>
                    <p>Category:</p>
                    <Link href="/products" rel="tag">{product.category}</Link>
                  </span>
                  <span>
                    <p>Type:</p>
                    <span style={{ textTransform: "capitalize", color: "#555", fontWeight: 700 }}>
                      {product.product_type}
                    </span>
                  </span>
                </div>

                {/* Payment image */}
                <div className="product-getway">
                  <Image
                    src="/assets/img/others/payment-2.png"
                    alt="Accepted payment methods"
                    width={300}
                    height={50}
                    style={{ maxWidth: "100%", height: "auto" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Description + Benefits + Info + Reviews ── */}
      <section className="space-extra-bottom">
        <div className="container">

          {/* Description */}
          <div className="product-description mb-50">
            <h3 className="blog-inner-title">Description</h3>
            {product.description ? (
              <p>{product.description}</p>
            ) : (
              <p>
                Premium quality {product.product_type} sourced and nurtured with care at our nursery.
                We ensure healthy root systems and optimal growth potential for every specimen we supply.
                Each item is cultivated using organic fertilizers and sustainable practices, making
                them ideal for home gardens, commercial farms, and landscaping projects.
              </p>
            )}
            <p>
              Our team provides expert growing guidance with every purchase.
              All stock is freshly dispatched to guarantee maximum vitality on arrival.
              Contact us for bulk orders, advance bookings, or custom requirements.
            </p>
          </div>

          {/* Benefits & Care */}
          <div>
            <div className="row gx-50">
              <div className="col-lg-6 mb-50">
                <div className="pros">
                  <h3 className="blog-inner-title">Benefits</h3>
                  <div className="list-style4">
                    <ul>
                      <li>Improves air quality and oxygen levels</li>
                      <li>Enhances aesthetics and landscape beauty</li>
                      <li>Provides fresh produce right at home</li>
                      <li>Supports local biodiversity and pollinators</li>
                      <li>Reduces stress and promotes well-being</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-lg-6 mb-50">
                <div className="cons">
                  <h3 className="blog-inner-title">Care Tips</h3>
                  <div className="list-style4">
                    <ul>
                      <li>Water regularly — avoid overwatering</li>
                      <li>Ensure adequate sunlight (4–6 hrs/day)</li>
                      <li>Use well-draining, nutrient-rich soil</li>
                      <li>Fertilize monthly during growing season</li>
                      <li>Prune dead leaves for healthy growth</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mb-30">
            <h3 className="blog-inner-title">Additional Information</h3>
            <div className="product-information">
              <div className="product-information__item">
                <span className="product-information__name">Stock Available</span>
                <span>{displayStock} units</span>
              </div>
              {displayUnit && (
                <div className="product-information__item">
                  <span className="product-information__name">Unit</span>
                  <span style={{ textTransform: "capitalize" }}>{displayUnit}</span>
                </div>
              )}
              <div className="product-information__item">
                <span className="product-information__name">Type</span>
                <span style={{ textTransform: "capitalize" }}>{product.product_type}</span>
              </div>
              <div className="product-information__item">
                <span className="product-information__name">Category</span>
                <span>{product.category}</span>
              </div>
              {hasDiscount && (
                <div className="product-information__item">
                  <span className="product-information__name">You Save</span>
                  <span style={{ color: "#8cc63f", fontWeight: 700 }}>
                    Rs.&nbsp;{(displayActualPrice - displaySellingPrice).toFixed(2)}
                    {" "}({Math.round(((displayActualPrice - displaySellingPrice) / displayActualPrice) * 100)}% off)
                  </span>
                </div>
              )}

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div className="product-information__item" style={{ flexDirection: "column", alignItems: "flex-start", padding: "15px 25px", borderRadius: "20px" }}>
                  <span className="product-information__name" style={{ marginRight: 0, marginBottom: "10px", minWidth: "auto", border: "none", padding: 0 }}>
                    Available Variants
                  </span>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {product.variants.map((v) => (
                      <span
                        key={v.id}
                        style={{
                          background: "#fff",
                          border: "1px solid #8cc63f",
                          borderRadius: "999px",
                          padding: "5px 16px",
                          fontSize: "14px",
                          color: "#555",
                        }}
                      >
                        {v.unit_value ? `${v.unit_value} ${v.unit || ""}`.trim() : v.unit || "Default"} — Rs. {Number(v.selling_price).toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          <div className="woocommerce-reviews space-extra-top mb-50">
            <h3 className="blog-inner-title">Customer Reviews</h3>

            <div className="vs-post-comment">
              <div className="rating-select">
                <p className="stars">
                  <span>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <a key={s} className={`star-${s}`} href="#">{s}</a>
                    ))}
                  </span>
                </p>
              </div>
              <div className="comment-avater">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                  alt="Reviewer"
                />
              </div>
              <div className="comment-content">
                <h4 className="name h4">
                  Ramesh Patel <span className="commented-on">February 12, 2026</span>
                </h4>
                <p className="text">
                  Excellent quality! Arrived well-packed and in perfect health. Already showing new
                  growth within two weeks. Highly recommend this nursery for all your gardening needs.
                </p>
              </div>
            </div>

            <div className="vs-post-comment">
              <div className="rating-select">
                <p className="stars">
                  <span>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <a key={s} className={`star-${s}`} href="#">{s}</a>
                    ))}
                  </span>
                </p>
              </div>
              <div className="comment-avater">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
                  alt="Reviewer"
                />
              </div>
              <div className="comment-content">
                <h4 className="name h4">
                  Priya Sharma <span className="commented-on">April 3, 2026</span>
                </h4>
                <p className="text">
                  Great value for money and the team was very helpful with care instructions.
                  Will definitely purchase again!
                </p>
              </div>
            </div>
          </div>

          {/* Add Review Form */}
          <div className="vs-comment-form reviews-form">
            <div id="respond">
              <div className="form-title">
                <div className="form-left">
                  <h3 className="blog-inner-title">Add a Review</h3>
                  <p className="mb-0">Your email address will not be published.</p>
                </div>
                <div className="rating-select">
                  <label>Select Rating:</label>
                  <p className="stars">
                    <span>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <a
                          key={s}
                          href="#"
                          className={`star-${s}${reviewRating >= s || hoverRating >= s ? " active" : ""}`}
                          onClick={(e) => { e.preventDefault(); setReviewRating(s); }}
                          onMouseEnter={() => setHoverRating(s)}
                          onMouseLeave={() => setHoverRating(0)}
                        >
                          {s}
                        </a>
                      ))}
                    </span>
                  </p>
                </div>
              </div>
              <div className="row gx-20">
                <div className="col-md-6 form-group">
                  <input type="text" className="form-control" placeholder="Full Name" />
                </div>
                <div className="col-md-6 form-group">
                  <input type="email" className="form-control" placeholder="Email Address" />
                </div>
                <div className="col-12 form-group">
                  <textarea className="form-control" placeholder="Your Review"></textarea>
                </div>
                <div className="col-12 form-group mb-0">
                  <button type="button" className="vs-btn style2">Post Review</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Related Products ── */}
      {related.length > 0 && (
        <section className="space-extra-bottom">
          <div className="container">
            <h3 className="blog-inner-title">Related Products</h3>
            <div className="row">
              {related.map((rp) => (
                <div key={rp.id} className="col-xl-3 col-lg-4 col-md-6 mb-30">
                  <div className="vs-product product-style6">
                    <div className="product-img">
                      <Link href={`/products/${rp.id}`}>
                        <img
                          src={rp.photo_url || DEFAULT_IMG}
                          alt={rp.name}
                          className="img w-100"
                          style={{ objectFit: "cover", height: "220px", width: "100%", display: "block" }}
                        />
                      </Link>
                      {rp.available_quantity <= 0 && (
                        <Link href={`/products/${rp.id}`} className="product-tag2">
                          Out of Stock
                        </Link>
                      )}
                    </div>
                    <div className="product-content">
                      <StarRating rating={5} />
                      <h3 className="product-title">
                        <Link href={`/products/${rp.id}`}>{rp.name}</Link>
                      </h3>
                      <span className="product-cate">{rp.category}</span>
                      <span className="product-price">
                        Rs.&nbsp;{Number(rp.selling_price).toFixed(2)}
                      </span>
                      <div className="product-actions">
                        <button
                          type="button"
                          className="vs-btn"
                          disabled={rp.available_quantity <= 0}
                          onClick={() => {
                            addToCart(rp, 1);
                            router.push("/cart");
                          }}
                        >
                          Add to Cart
                        </button>
                        <button
                          type="button"
                          className="cart-btn"
                          aria-label="Cart"
                          disabled={rp.available_quantity <= 0}
                          onClick={() => {
                            addToCart(rp, 1);
                            router.push("/cart");
                          }}
                        >
                          <i className="fas fa-shopping-basket"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
