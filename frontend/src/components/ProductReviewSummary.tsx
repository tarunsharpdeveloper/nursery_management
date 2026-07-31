"use client";

import { useEffect, useState } from "react";

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
}

export function ProductReviewSummary({ productId, rating: initialRating, totalReviews: initialTotalReviews }: { productId: number; rating?: number; totalReviews?: number }) {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Use the props directly if provided (from parent/batch API)
    if (initialRating !== undefined && initialTotalReviews !== undefined) {
      setStats({
        average_rating: initialRating,
        total_reviews: initialTotalReviews
      });
      setLoading(false);
    } else {
      // Only load if props are not provided
      setLoading(true);
    }
  }, [initialRating, initialTotalReviews]);

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

  return (
    <div className="product-review-summary" style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "6px" , marginTop: "6px"}}>
      <div className="product-review-score" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
        <span aria-label={`Rated ${roundedRating.toFixed(1)} out of 5`} style={{ color: "#f0a500", letterSpacing: "1px", fontSize: "14px" }}>
          {Array.from({ length: 5 }).map((_, index) => {
            const filled = index < Math.round(rating);
            return (
              <span key={index} style={{ color: filled ? "#f0a500" : "#d0d0d0" }}>
                ★
              </span>
            );
          })}
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
