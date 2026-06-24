"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useCart } from "@/context/CartContext";
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
  "Fruit Plants": "/assets/img/cate/c-1-1.png",
  "Flower Plants": "/assets/img/cate/c-1-2.png",
  "Medicinal Plants": "/assets/img/cate/c-1-3.png",
  "Ornamental Plants": "/assets/img/cate/c-1-4.png",
  "Vegetable Seeds": "/assets/img/cate/c-1-5.png",
  "Flower Seeds": "/assets/img/cate/c-1-2.png"
};

export default function HomePage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [videoOpen, setVideoOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 12, hours: 23, minutes: 59, seconds: 59 });

  // Auto-scroll hero slideshow
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, []);

  // Countdown timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch live products
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
          image: product.photo_url || "https://dms.mydukaan.io/original/jpeg/media/54ecc558-e85c-462a-b5e5-692caad96f53.jpg",
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

  const handleAddToCart = (product: Product) => {
    addToCart(
      {
        id: product.id,
        name: product.name,
        category: product.category,
        selling_price: product.price,
        actual_price: product.price,
        photo_url: product.image,
        available_quantity: product.stock,
      },
      1
    );
  };

  return (
    <>
      {/* ── Hero Slides Area (Awantika Seeds Content) ── */}
      <section className="hero-style1">
        <div className="hero-bg" style={{ backgroundImage: "url('/assets/img/bg/b-1-1.png')" }}></div>
        <div className="hero-leaf2 wow fadeInUp" data-wow-delay="1s">
          <img src="/assets/img/hero/h-1-3.png" alt="hero leaf 2" />
        </div>
        <div className="hero-leaf3 wow fadeInUp" data-wow-delay="1.2s">
          <img src="/assets/img/hero/h-1-4.png" alt="hero leaf 3" />
        </div>
        <div className="container">
          {/* Slide 0 */}
          {activeSlide === 0 && (
            <div className="row gy-4 justify-content-between align-items-center animate-fade">
              <div className="col-xxl-6 col-xl-6 col-lg-8 mx-auto">
                <div className="hero-content">
                  <h1 className="hero-title">High-Quality Plants &amp; Saplings</h1>
                  <p className="hero-text">Premium organic saplings and custom-crafted fruit plants directly from our central nursery fields.</p>
                  <span className="hero-subtitle">
                    <img src="/assets/img/icons/i-1-1.png" alt="icon" />
                    100% Certified Nursery Stock &amp; Seeds.
                  </span>
                  <div className="d-flex">
                    <Link href="/products" className="vs-btn style1">Start Shopping<i className="fas fa-long-arrow-right"></i></Link>
                  </div>
                </div>
              </div>
              <div className="col-xxl-auto col-xl-6 col-lg-8 mx-auto">
                <div className="hero-img">
                  <img src="/assets/img/hero/h-1-1.png" alt="saplings" />
                  <span className="circle"></span>
                  <div className="hero-certificate">
                    <img src="/assets/img/logos/l-1-1.png" alt="logo" />
                  </div>
                  <div className="hero-leaf">
                    <img src="/assets/img/hero/h-1-2.png" alt="leaf decoration" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Slide 1 */}
          {activeSlide === 1 && (
            <div className="row gy-4 justify-content-between align-items-center animate-fade">
              <div className="col-xxl-6 col-xl-6 col-lg-8 mx-auto">
                <div className="hero-content">
                  <h1 className="hero-title">Pure &amp; Certified Seeds Selection</h1>
                  <p className="hero-text">High-yield hybrid vegetable and flower seeds optimized for regional Indian soil conditions.</p>
                  <span className="hero-subtitle">
                    <img src="/assets/img/icons/i-1-1.png" alt="icon" />
                    Tested for High Germination Rates.
                  </span>
                  <div className="d-flex">
                    <Link href="/products" className="vs-btn style1">Start Shopping<i className="fas fa-long-arrow-right"></i></Link>
                  </div>
                </div>
              </div>
              <div className="col-xxl-auto col-xl-6 col-lg-8 mx-auto">
                <div className="hero-img">
                  <img src="/assets/img/hero/h-1-1.png" alt="seeds display" />
                  <span className="circle"></span>
                  <div className="hero-certificate">
                    <img src="/assets/img/logos/l-1-1.png" alt="logo" />
                  </div>
                  <div className="hero-leaf">
                    <img src="/assets/img/hero/h-1-2.png" alt="leaf decoration" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Slide 2 */}
          {activeSlide === 2 && (
            <div className="row gy-4 justify-content-between align-items-center animate-fade">
              <div className="col-xxl-6 col-xl-6 col-lg-8 mx-auto">
                <div className="hero-content">
                  <h1 className="hero-title">Premium Nursery &amp; Farm Supplies</h1>
                  <p className="hero-text">A complete range of organic garden soils, compost mixes, nutrients and planting assistance.</p>
                  <span className="hero-subtitle">
                    <img src="/assets/img/icons/i-1-1.png" alt="icon" />
                    Direct Dispatch &amp; Billing Ledger Support.
                  </span>
                  <div className="d-flex">
                    <Link href="/products" className="vs-btn style1">Start Shopping<i className="fas fa-long-arrow-right"></i></Link>
                  </div>
                </div>
              </div>
              <div className="col-xxl-auto col-xl-6 col-lg-8 mx-auto">
                <div className="hero-img">
                  <img src="/assets/img/hero/h-1-1.png" alt="nursery showcase" />
                  <span className="circle"></span>
                  <div className="hero-certificate">
                    <img src="/assets/img/logos/l-1-1.png" alt="logo" />
                  </div>
                  <div className="hero-leaf">
                    <img src="/assets/img/hero/h-1-2.png" alt="leaf decoration" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Manual Slides Select */}
        <div className="category-dots" style={{ position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)" }}>
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              className={`category-dot ${idx === activeSlide ? "active" : ""}`}
              onClick={() => setActiveSlide(idx)}
            />
          ))}
        </div>
      </section>

      {/* ── Category Showcase (Dynamic Catalog Categories) ── */}
      <section className="cate space-top space-extra-bottom">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <div className="title-area text-center">
                <div className="sec-icon"><img src="/assets/img/icons/s-1-1.png" alt="icon" /></div>
                <span className="sec-subtitle">Browse Category</span>
                <h2 className="sec-title">Pick Your Product Type</h2>
              </div>
            </div>
          </div>
          <div className="row" style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
            {categories.map((category, idx) => (
              <div className="col-auto" key={category} style={{ flex: "1 1 200px", maxWidth: "240px" }}>
                <div className="cate-style">
                  <div className="cate-figure">
                    <img src={categoryArt[category] || "/assets/img/cate/c-1-1.png"} alt={category} className="cate-img" />
                  </div>
                  <div className="cate-content">
                    <h3 className="cate-title">
                      <Link href={`/products?category=${encodeURIComponent(category)}`} className="cate-title__link">
                        {category}
                      </Link>
                    </h3>
                    <span className="cate-num">
                      <Link href={`/products?category=${encodeURIComponent(category)}`} className="cate-num__link">
                        {products.filter((product) => product.category === category).length} Products
                      </Link>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Area (Awantika Seeds Video & Checklist) ── */}
      <section className="about-layout1 z-index-common space-extra-bottom">
        <img src="/assets/img/about/about-ele1-1.png" alt="about element" className="about-ele1" />
        <div className="container">
          <div className="row">
            <div className="col-lg-6 mb-30">
              <div className="img-box1">
                <div className="img1">
                  <img className="img" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRj64W6Yhp2BLcBoHVPk2pQeqJx-HbiJXtTpWPoQpkATQ&s=10" alt="about 1" />
                </div>
                <div className="video-thumb1">
                  <img className="img" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLvX2WV6_Uck7fxt9yiwYPUV43XfKB_o_FGI74BTJAualpPZ-yEvrP7TF9&s=10" alt="about 2" />
                  <button onClick={() => setVideoOpen(true)} className="play-btn style7 popup-video" style={{ background: "transparent", border: "none" }}><i className="fas fa-play"></i></button>
                </div>
              </div>
            </div>
            <div className="col-lg-6 mb-30">
              <div className="about-content1">
                <div className="title-area">
                  <span className="sec-subtitle">Welcome to Awantika Seeds</span>
                  <h2 className="sec-title">We Provide High Quality And Certified Saplings</h2>
                </div>
                <div className="about-body">
                  <p className="about-text">Cultivated locally in Ujjain, Madhya Pradesh, we specialize in high-survival saplings, high-germination flower and vegetable seeds, and certified organic compost. Supporting commercial orchards, local farmers, and gardening enthusiasts with robust stock and seamless billing records.</p>
                  <div className="list-style1">
                    <ul>
                      <li><i><img src="/assets/img/icons/shield.png" alt="shield" /></i>100% Quality Checked Saplings</li>
                      <li><i><img src="/assets/img/icons/marijuana.png" alt="saplings" /></i>Natural &amp; Organic Soil Mixes</li>
                      <li><i><img src="/assets/img/icons/microscope.png" alt="microscope" /></i>Horticultural Expert Checked</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal Display */}
      {videoOpen && (
        <div className="video-modal-overlay" onClick={() => setVideoOpen(false)}>
          <div className="video-modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="video-close-btn" onClick={() => setVideoOpen(false)}><X size={20} /></button>
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/zX-jSCDsJ8E?autoplay=1"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* ── Trust / Review Area (Nursery Adaptation) ── */}
      {/* <section className="space-bottom">
        <div className="container">
          <div className="position-relative">
            <div className="review-wrap">
              <div className="row g-md-3 align-items-center justify-content-center justify-content-lg-between">
                <div className="col-lg-8">
                  <div className="review-content">
                    <div className="review-content__left">
                      <div className="review-logo"><img src="/assets/img/logos/l-1-2.png" alt="logo" /></div>
                    </div>
                    <div className="review-content__right">
                      <h2 className="review-title h3">No.1 Nursery &amp; Seeds Specialist</h2>
                      <p className="review-text">Grafted fruit plants, flower pots, hybrid seeds, organic soils, advance bookings, billing dispatches and expert consultations...</p>
                    </div>
                  </div>
                </div>
                <div className="col-auto text-center text-lg-end">
                  <span className="review-subtitle">Rated 4.9 / 5</span>
                  <img src="/assets/img/others/ot-1-1.png" alt="stars" className="review-star" />
                  <p className="review-subtitle2">Based on 848 reviews</p>
                  <img src="/assets/img/logos/l-1-3.png" alt="trust logo" className="review-trust" />
                </div>
              </div>
            </div>
            <img src="/assets/img/shapes/s-1-1.png" alt="shape" className="shape-1" />
          </div>
        </div>
      </section> */}

      {/* ── Dynamic Products Display Area (Live Catalog Data) ── */}
      <section className="space-top space-bottom" style={{ backgroundImage: "url('/assets/img/bg/bg-1-1.jpg')", backgroundSize: "cover" }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-6 mx-auto">
              <div className="title-area text-center">
                <div className="sec-icon"><img src="/assets/img/icons/s-1-2.png" alt="icon" /></div>
                <span className="sec-subtitle">Quality Products</span>
                <h2 className="sec-title">Trending Products</h2>
              </div>
            </div>
          </div>
          <div className="row">
            {products.slice(0, 8).map((prod) => (
              <div className="col-lg-3 col-md-6" key={prod.id}>
                <div className="vs-product product-style1">
                  <div className="product-img">
                    <Link href={`/products/${prod.id}`}>
                      <img src={prod.image} alt={prod.name} className="img w-100" style={{ height: "230px", objectFit: "cover" }} />
                    </Link>
                    {prod.stock <= 0 && <span className="product-tag2" style={{ background: "var(--danger)" }}>Out of Stock</span>}
                    {prod.stock > 0 && prod.stock < 100 && <span className="product-tag2" style={{ background: "var(--accent)" }}>Limited Stock</span>}
                  </div>
                  <div className="product-content">
                    <div className="star-rating">
                      <span style={{ width: "100%" }}>Rated 5.0 out of 5</span>
                    </div>
                    <h3 className="product-title">
                      <Link href={`/products/${prod.id}`}>{prod.name}</Link>
                    </h3>
                    <span className="product-cate">{prod.category}</span>
                    <span className="product-price">Rs. {prod.price}</span>
                    <div className="product-actions">
                      <button type="button" className="vs-btn" onClick={() => handleAddToCart(prod)}>
                        Add to Cart
                      </button>
                      <button type="button" className="cart-btn" onClick={() => handleAddToCart(prod)} aria-label={`Add ${prod.name} to cart`}>
                        <i className="fas fa-shopping-basket"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="row justify-content-center">
            <div className="col-auto">
              <div className="d-inline-flex pt-30">
                <Link href="/products" className="vs-btn style2">View All Products</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Area (Why Us) ── */}
      <section className="space-top space-extra-bottom overflow-hidden">
        <div className="container">
          <div className="row justify-content-between align-items-center">
            <div className="col-xl-7 col-lg-8">
              <div className="title-area">
                <span className="sec-subtitle">What Makes Us Different?</span>
                <h2 className="sec-title">What Makes Awantika Seeds Different?</h2>
              </div>
            </div>
            <div className="col-auto">
              <div className="call-card">
                <div className="call-card__content">
                  <span className="call-card__title">Need Help?</span>
                  <a className="call-card__number" href="tel:+918085263020">+91 80852 63020</a>
                </div>
                <div className="call-card__icon"><img src="/assets/img/icons/phone-1-1.png" alt="icon" /></div>
              </div>
            </div>
          </div>
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="row">
                {[
                  { title: "Direct From Our Nursery", img: "/assets/img/icons/feature-1-1.png", text: "Healthy saplings cultivated in local regional weather fields." },
                  { title: "Certified Organic Fertilizer", img: "/assets/img/icons/feature-1-2.png", text: "Enriched with custom mineral bases and organic vermicompost." },
                  { title: "High Germination Seeds", img: "/assets/img/icons/feature-1-3.png", text: "Scientifically sorted hybrid flower and vegetable seed packets." },
                  { title: "Agronomist Consultations", img: "/assets/img/icons/feature-1-4.png", text: "Support and horticultural guidance from expert plant specialists." }
                ].map((feat, idx) => (
                  <div className="col-md-6" key={idx}>
                    <div className="feature-item">
                      <div className="feature-header">
                        <img src="/assets/img/features/feature-1-1.png" alt="bg" className="feature-icon-bg" />
                        <div className="feature-icon"><img src={feat.img} alt="icon" /></div>
                      </div>
                      <h3 className="feature-title"><a href="#">{feat.title}</a></h3>
                      <p className="feature-text">{feat.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-lg-6 mx-auto">
              <div className="img-box2">
                <div className="img-circle" style={{ backgroundImage: "url('/assets/img/features/feature-1-2.png')" }}></div>
                <img src="/assets/img/features/feature-1-3.png" alt="feature" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Promo Banners (Flowering Saplings & High-Yield Seeds) ── */}
      <div className="space-extra-bottom">
        <div className="container">
          <div className="row">
            <div className="col-lg-6">
              <div className="banner-style">
                <div className="row align-items-center justify-content-between">
                  <div className="col-auto">
                    <div className="banner-content">
                      <h3 className="banner-title">
                        <Link href="/products?category=Flower+Plants">Flowering Saplings</Link>
                      </h3>
                      <p className="banner-text">Vibrant flowers to beautify your home gardens and balconies.</p>
                      <Link href="/products?category=Flower+Plants" className="banner-link">View More <img src="/assets/img/icons/arrow-icon-1-1.png" alt="arrow" /></Link>
                    </div>
                  </div>
                </div>
                <div className="banner-img"><img src="/assets/img/banner/banner-1-1.png" alt="banner" /></div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="banner-style style2">
                <div className="row align-items-center justify-content-between">
                  <div className="col-auto">
                    <div className="banner-content">
                      <h3 className="banner-title">
                        <Link href="/products?type=seed">High-Yield Vegetable Seeds</Link>
                      </h3>
                      <p className="banner-text">Greenhouse-tested hybrid packets optimized for high growth production.</p>
                      <Link href="/products?type=seed" className="banner-link">View More <img src="/assets/img/icons/arrow-icon-1-1.png" alt="arrow" /></Link>
                    </div>
                  </div>
                </div>
                <div className="banner-img"><img src="/assets/img/banner/banner-1-2.png" alt="banner" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Brands Bar (Nursery Partners & Species) ── */}
      {/* <div className="brand-layout1" >
        <div className="container">
          <div className="row">
            <div className="col mx-auto text-center">
              <div className="mb-30">
                <h2 className="sec-title h4">Featured Varieties &amp; Partners</h2>
              </div>
            </div>
          </div>
          <div className="row text-center" style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "20px" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div className="col-auto" key={i}>
                <div className="brand-style">
                  <Link href="/about"><img src={`/assets/img/brand/brand-1-${i}.png`} alt="brand" /></Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div> */}

      {/* ── Top Selling Product Area (Featured Alphonso Mango Plant) ── */}
      {/* <section className="product-layout2 z-index-common" style={{ backgroundImage: "url('/assets/img/bg/b-1-3.jpg')", backgroundSize: "cover" }}>
        <img className="ele1" src="/assets/img/products/product-leaf-1-1.png" alt="leaf" />
        <img className="ele2" src="/assets/img/products/product-leaf-1-2.png" alt="leaf" />
        <div className="container">
          <div className="row">
            <div className="col-lg-6 mx-auto">
              <div className="title-area text-center">
                <span className="sec-subtitle">Trending Products</span>
                <h2 className="sec-title text-white">Top Selling Products</h2>
              </div>
            </div>
          </div>
          <div className="vs-product product-style2">
            <div className="row gx-60 align-items-center">
              <div className="col-lg-4 mb-30">
                <p className="product-text">100% Grafted Saplings</p>
                <h3 className="product-title">Grafted Alphonso Mango Plant</h3>
                <div className="star-rating">
                  <span style={{ width: "100%" }}>Rated 5.0 out of 5</span>
                </div>
                <span className="product-price"><del>Rs. 350.00</del>Rs. 220.00</span>
                <span className="product-tax">Tax included.</span>
                <span className="counter-title">Limited Time Offer:</span>
                <div className="counter-style">
                  <ul className="offer-counter">
                    <li><div className="day count-number">{timeLeft.days}</div><span className="count-name">Days</span></li>
                    <li><div className="hour count-number">{timeLeft.hours}</div><span className="count-name">Hours</span></li>
                    <li><div className="minute count-number">{timeLeft.minutes}</div><span className="count-name">Minutes</span></li>
                    <li><div className="seconds count-number">{timeLeft.seconds}</div><span className="count-name">Seconds</span></li>
                  </ul>
                </div>
              </div>
              <div className="col-lg-4 mb-30">
                <div className="product-image"><img src="/assets/img/products/p-l-2-1-1.png" alt="mango plant container" /></div>
              </div>
              <div className="col-lg-4 mb-30">
                <div className="buying-options">
                  <h4 className="buying-title">Buying Options</h4>
                  {["Single Purchase", "Weekly Delivery", "Every Two Weeks", "Every Four Weeks"].map((option, idx) => (
                    <div className="form-check" key={idx}>
                      <input className="form-check-input" type="radio" name="flexRadioDefault" id={`optOffer-${idx}`} defaultChecked={idx === 0} />
                      <label className="form-check-label" htmlFor={`optOffer-${idx}`}>{option}</label>
                    </div>
                  ))}
                  <Link href="/cart" className="vs-btn style3">Add to Cart<i className="fas fa-shopping-basket"></i></Link>
                </div>
              </div>
            </div>
          </div>
          <div className="product-features">
            <div className="row justify-content-between">
              {[
                { title: "Free Local Delivery Over Rs. 999", img: "/assets/img/icons/product-feature-1-1.png" },
                { title: "Dedicated Horticulturist Care", img: "/assets/img/icons/product-feature-1-2.png" },
                { title: "Secure Order Records", img: "/assets/img/icons/product-feature-1-3.png" },
                { title: "30-Day Plant Health Support", img: "/assets/img/icons/product-feature-1-4.png" }
              ].map((feat, idx) => (
                <div className="col-lg-auto col-md-6 mb-30" key={idx}>
                  <div className="item-style">
                    <div className="item-icon"><img src={feat.img} alt="feature icon" /></div>
                    <h3 className="item-title">{feat.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section> */}

      {/* ── Testimonials Area (Farmers & Gardeners Review) ── */}
      <section className="testimonials space-top space-bottom">
        <div className="container">
          <div className="row align-items-center justify-content-between">
            <div className="col-lg-7">
              <div className="title-area">
                <span className="sec-subtitle">TESTIMONIALS</span>
                <h2 className="sec-title">What Our Customers Say</h2>
              </div>
            </div>
          </div>
          <div className="row" style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {[
              { name: "Suresh R. (Farmer)", title: "Excellent Grafted Mango Plants", avatar: "/assets/img/testimonials/testi-1-1.png", text: "I ordered Alphonso Mango grafts for my orchard. They were dispatched quickly. The root health was incredible, and they are adapting very well." },
              { name: "Preeti S. (Gardener)", title: "High Germination Flower Seeds", avatar: "/assets/img/testimonials/testi-1-2.png", text: "The germination rate of the Marigold and Petunia seeds was close to 90%. My garden is completely transformed. Highly recommended nursery!" },
              { name: "Rajesh K. (Landscaper)", title: "Smooth Billing &amp; Dispatch Log", avatar: "/assets/img/testimonials/testi-1-3.png", text: "For commercial landscaping projects, we need clear billing logs. Their system generates invoice receipts, orders, and dispatch slips in one place." }
            ].map((testi, idx) => (
              <div className="col" key={idx} style={{ flex: "1 1 440px" }}>
                <div className="testi-style1">
                  <div className="star-rating">
                    <span style={{ width: "100%" }}>Rated 5 out of 5</span>
                  </div>
                  <span className="testi-author">By <a href="#">{testi.name}</a></span>
                  <h3 className="testi-title">{testi.title}</h3>
                  <div className="testi-content">
                    <div className="testi-image">
                      <img className="img1" src={testi.avatar} alt="testimonial avatar" />
                      <i className="testi-icon"><img src="/assets/img/icons/testimonials-quote-icon-1.png" alt="quote" /></i>
                    </div>
                    <p className="testi-text">{testi.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Blog Area (Plant & Farming Advice) ── */}
      {/* <section className="blog space-bottom">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <div className="title-area text-center">
                <div className="sec-icon"><img src="/assets/img/icons/s-1-1.png" alt="icon" /></div>
                <span className="sec-subtitle">News &amp; Updates</span>
                <h2 className="sec-title">Recent Articles</h2>
              </div>
            </div>
          </div>
          <div className="row">
            {[
              { title: "Nursery Management & Cultivation Standards in Central Regions", img: "/assets/img/blog/blog-1-1.jpg" },
              { title: "How Grafting Helps Your Fruit Saplings Develop Stronger Roots", img: "/assets/img/blog/blog-1-2.jpg" },
              { title: "Why Pre-Sowing Seed Germination Tests Save Seasonal Costs", img: "/assets/img/blog/blog-1-3.jpg" }
            ].map((blog, idx) => (
              <div className="col-lg-4" key={idx}>
                <div className="vs-blog blog-style1">
                  <div className="blog-img">
                    <img src={blog.img} alt="Blog" className="img w-100" />
                  </div>
                  <span className="blog-date">24 <span>Feb, 2026</span></span>
                  <div className="blog-content">
                    <div className="blog-meta">
                      <a href="#">Posted <span>By John Smith</span></a>
                      <a className="blog-meta-icon" href="#"><i className="fas fa-comments"></i> 14 Comments</a>
                    </div>
                    <h3 className="blog-title h5"><a href="#">{blog.title}</a></h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── Instagram Feed (Nursery Visuals) ── */}
      {/* <div className="insta-layout1" style={{ paddingBottom: "50px" }}>
        <div className="container">
          <h2 className="sec-title2"><i className="fab fa-instagram"></i>Follow <a href="https://www.instagram.com/">@AwantikaSeeds</a></h2>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div className="instagram-feed" key={i} style={{ flex: "1 1 120px", maxWidth: "180px" }}>
                <img src={`/assets/img/instagram/insta-1-${i}.jpg`} alt="instagram feed" />
                <a className="instagram-icon" href="https://www.instagram.com/"><i className="fab fa-instagram"></i></a>
              </div>
            ))}
          </div>
        </div>
      </div> */}
    </>
  );
}
