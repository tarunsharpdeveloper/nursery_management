"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { ProductReviewSummary } from "@/components/ProductReviewSummary";

interface ProductSliderProps {
  products: Product[];
  itemsPerView?: number;
}

export function ProductSlider({ products, itemsPerView = 5 }: ProductSliderProps) {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsToShow, setItemsToShow] = useState(itemsPerView);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Responsive items per view
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 700) {
        setItemsToShow(2);
      } else if (window.innerWidth < 992) {
        setItemsToShow(2);
      } else if (window.innerWidth < 1200) {
        setItemsToShow(itemsPerView);
      } else {
        setItemsToShow(itemsPerView);
      }
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, [itemsPerView]);

  const maxIndex = Math.max(0, products.length - itemsToShow);

  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    setTimeout(() => setIsTransitioning(false), 600);
  };

  // Auto-play functionality
  useEffect(() => {
    if (isPaused || products.length <= itemsToShow || isTransitioning) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
      setTimeout(() => setIsTransitioning(false), 600);
    }, 4000000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [isPaused, maxIndex, itemsToShow, products.length, isTransitioning]);

  // Get visible products for current slide
  const getVisibleProducts = () => {
    const start = currentIndex;
    const end = start + itemsToShow;
    return products.slice(start, end);
  };

  const visibleProducts = getVisibleProducts();

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
    <div 
      className="product-slider-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="product-slider-wrapper">
        <button
          className="slider-nav-btn slider-nav-prev"
          onClick={handlePrev}
          aria-label="Previous products"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="product-slider" ref={sliderRef}>
          <div className="product-slider-track-fade">
            {visibleProducts.map((prod, idx) => (
              <div 
                key={`${prod.id}-${currentIndex}-${idx}`}
                className="product-slider-item-fade"
                style={{
                  animation: 'fadeSlideIn 0.6s ease',
                  animationFillMode: 'both',
                  animationDelay: `${idx * 0.1}s`
                }}
              >
                <div className="vs-product product-style1 modern-card">
                  <div className="product-img">
                    <button
                      type="button"
                      className="card-favorite-btn"
                      aria-label={isFavorite(prod.id) ? "Remove from Favorites" : "Add to Favorites"}
                      onClick={(e) => toggleFavorite(prod, e)}
                    >
                      <i className={isFavorite(prod.id) ? "fas fa-heart" : "far fa-heart"} style={{ color: isFavorite(prod.id) ? "#dc2626" : "#666666" }}></i>
                    </button>
                    <Link href={`/products/${prod.id}`}>
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="img w-100"
                      />
                    </Link>
                    {prod.stock <= 0 && (
                      <span className="product-tag2" style={{ background: "var(--danger)" }}>
                        Out of Stock
                      </span>
                    )}
                    {prod.stock > 0 && prod.stock < 100 && (
                      <span className="product-tag2" style={{ background: "var(--accent)" }}>
                        Limited Stock
                      </span>
                    )}
                  </div>
                  <div className="product-content">
                    <ProductReviewSummary productId={prod.id} rating={prod.average_rating} totalReviews={prod.total_reviews} />
                    <h3
                      className="product-title"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginBottom: "6px",
                      }}
                    >
                      <Link href={`/products/${prod.id}`}>{prod.name}</Link>
                    </h3>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#777777",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginBottom: "12px",
                        lineHeight: "1.4",
                      }}
                    >
                      {prod.description || "No description available."}
                    </p>
                    <span className="product-cate" style={{ margin: 0, fontSize: "11px", fontWeight: 700, marginBottom: "8px", display: "block" }}>
                      SUBCATEGORY:{" "}
                      <span style={{ fontWeight: 500, color: "var(--title-color)" }}>{prod.category}</span>
                    </span>
                    <span className="product-price">Rs. {prod.price}</span>
                    <div className="product-actions">
                      <button type="button" className="vs-btn" onClick={() => handleAddToCart(prod)}>
                        Add to Cart
                      </button>
                      <button
                        type="button"
                        className="cart-btn"
                        onClick={() => handleAddToCart(prod)}
                        aria-label={`Add ${prod.name} to cart`}
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
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

        <button
          className="slider-nav-btn slider-nav-next"
          onClick={handleNext}
          aria-label="Next products"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Dots indicator */}
      <div className="slider-dots">
        {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
          <button
            key={idx}
            className={`slider-dot ${idx === currentIndex ? "active" : ""}`}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
