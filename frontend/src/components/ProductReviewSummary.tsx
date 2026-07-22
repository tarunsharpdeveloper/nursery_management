"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
}

export function ProductReviewSummary({ productId }: { productId: number }) {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      try {
        const data = await apiRequest<ReviewStats>(`/api/reviews/stats/${productId}`);
        if (mounted) {
          setStats(data);
        }
      } catch (error) {
        if (mounted) {
          setStats({ total_reviews: 0, average_rating: 0 });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadStats();
    return () => {
      mounted = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="product-review-summary" style={{ marginBottom: "8px" }}>
        <span style={{ color: "var(--muted)", fontSize: "12px" }}>Loading reviews…</span>
      </div>
    );
  }

  if (!stats || stats.total_reviews === 0) {
    return (
      <div className="product-review-summary" style={{ marginBottom: "8px" }}>
        <span style={{ color: "var(--muted)", fontSize: "12px" }}>No reviews yet</span>
      </div>
    );
  }

  const rating = Number(stats.average_rating || 0);
  const roundedRating = Math.round(rating * 10) / 10;

  // Function to render stars with half-star support
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        // Full star
        stars.push(
          <span key={i} style={{ color: "#f0a500" }}>
            ★
          </span>
        );
      } else if (rating >= i - 0.5) {
        // Half star - using Unicode half star or overlay technique
        stars.push(
          <span key={i} style={{ position: "relative", display: "inline-block" }}>
            <span style={{ color: "#d0d0d0" }}>★</span>
            <span 
              style={{ 
                position: "absolute", 
                left: 0, 
                top: 0, 
                width: "50%", 
                overflow: "hidden", 
                color: "#f0a500" 
              }}
            >
              ★
            </span>
          </span>
        );
      } else {
        // Empty star
        stars.push(
          <span key={i} style={{ color: "#d0d0d0" }}>
            ★
          </span>
        );
      }
    }
    return stars;
  };

  return (
    <div className="product-review-summary" style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "6px" , marginTop: "6px"}}>
      <div className="product-review-score" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
        <span aria-label={`Rated ${roundedRating.toFixed(1)} out of 5`} style={{ letterSpacing: "1px", fontSize: "14px" }}>
          {renderStars()}
        </span>
        <span style={{ color: "var(--title-color)", fontSize: "13px", fontWeight: 700 }}>
          {roundedRating.toFixed(1)}
        </span>
      </div>
      {stats.total_reviews > 1 && (
        <span style={{ color: "var(--muted)", fontSize: "12px" }}>
          {stats.total_reviews} reviews
        </span>
      )}
    </div>
  );
}
