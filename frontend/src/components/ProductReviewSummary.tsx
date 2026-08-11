"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
}

export function ProductReviewSummary({ 
  productId, 
  rating: initialRating, 
  totalReviews: initialTotalReviews 
}: { 
  productId: number; 
  rating?: number; 
  totalReviews?: number; 
}) {
  const rating = Number(initialRating || 0);
  const total = Number(initialTotalReviews || 0);

  return (
    <div
      className="product-review-summary"
      style={{
        display: "inline-flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "3px",
        whiteSpace: "nowrap",
        flexWrap: "nowrap",
        margin: "3px 0"
      }}
    >
      <div
        className="product-review-stars"
        style={{
          display: "inline-flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "2px"
        }}
      >
        {Array.from({ length: 5 }).map((_, index) => {
          const filled = index < Math.round(rating);
          return (
            <span
              key={index}
              className="review-star-responsive"
              style={{
                color: filled ? "#f0a500" : "#d0d0d0",
                lineHeight: "1",
                display: "inline-block"
              }}
            >
              ★
            </span>
          );
        })}
      </div>
      {rating > 0 ? (
        <>
          <span style={{ color: "var(--title-color, #2d5016)", fontSize: "12px", fontWeight: 700, display: "inline-block" }}>
            {rating.toFixed(1)}
          </span>
          <span style={{ color: "#777777", fontSize: "11px", display: "inline-block" }}>
            ({total} {total === 1 ? "review" : "reviews"})
          </span>
        </>
      ) : (
        <span style={{ color: "#888888", fontSize: "11px", display: "inline-block" }}>
          (No reviews)
        </span>
      )}
    </div>
  );
}
