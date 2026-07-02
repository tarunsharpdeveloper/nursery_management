"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type Product = {
  id: number;
  category_id: number;
  name: string;
  description: string;
  selling_price: string;
  actual_price: string;
  available_quantity: number;
  unit: string | null;
  media_urls: string | null;
  is_active: number | boolean;
  category: string;
  created_at: string;
  updated_at: string;
  variants: { id: number; unit: string; unit_value: string; actual_price: string; selling_price: string; available_quantity: number }[];
};

function isActive(p: Product) {
  return Boolean(p.is_active);
}

function ProductDetailContent() {
  const searchParams = useSearchParams();
  const productId = Number(searchParams?.get("id"));
  const [product, setProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    if (!productId) {
      setStatus("No product ID provided");
      return;
    }

    async function loadData() {
      try {
        const data = await apiRequest<Product>("/api/products/get", {
          method: "POST",
          body: JSON.stringify({ productId })
        });
        setProduct(data);
        setStatus("Loaded successfully");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to load product");
      }
    }
    loadData();
  }, [productId]);

  if (!product) {
    return (
      <div className="section-header">
        <div>
          <Link href="/admin/products" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--brand)", fontWeight: 600, marginBottom: 12 }}>
            <ArrowLeft size={16} /> Back to Products
          </Link>
          <h1>Product Details</h1>

        </div>
      </div>
    );
  }

  return (
    <>
      <div className="section-header">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <Link href="/admin/products" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--brand)", fontWeight: 600, marginBottom: 16, fontSize: 14, textDecoration: "none" }}>
            <ArrowLeft size={16} /> Back to Products
          </Link>
          <p className="eyebrow" style={{ margin: 0, marginBottom: 4 }}>Product View</p>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: "-0.5px" }}>{product.name} {product.unit ? <span style={{ color: "#64748b", fontWeight: 500 }}>({product.unit})</span> : ""}</h1>
        </div>
      </div>

      <div className="card" style={{ padding: 20, width: "100%" }}>
        <div style={{ display: "grid", gap: 20 }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
            <span className="meta" style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Category</span>
            <div style={{ fontSize: 16, fontWeight: 500, color: "var(--text)" }}>{product.category}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
            <span className="meta" style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Description</span>
            <div style={{ fontSize: 14, color: "#475569", whiteSpace: "pre-wrap", background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0", lineHeight: 1.6 }}>
              {product.description || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>No description provided.</span>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 20, background: "#f8fafc", padding: 20, borderRadius: 10, border: "1px solid #e2e8f0", marginTop: 10 }}>
            <div>
              <span className="meta" style={{ display: "block", fontSize: 12, marginBottom: 6, textTransform: "uppercase", fontWeight: 600 }}>Actual Price</span>
              <div style={{ fontSize: 16, color: "#94a3b8", textDecoration: "line-through", fontWeight: 500 }}>₹{product.actual_price}</div>
            </div>
            <div>
              <span className="meta" style={{ display: "block", fontSize: 12, marginBottom: 6, textTransform: "uppercase", fontWeight: 600 }}>Selling Price</span>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--brand)" }}>₹{product.selling_price}</div>
            </div>
            <div>
              <span className="meta" style={{ display: "block", fontSize: 12, marginBottom: 6, textTransform: "uppercase", fontWeight: 600 }}>Total Stock</span>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text)" }}>{product.available_quantity}</div>
            </div>
            <div>
              <span className="meta" style={{ display: "block", fontSize: 12, marginBottom: 6, textTransform: "uppercase", fontWeight: 600 }}>Status</span>
              <div><span className={`status-badge ${isActive(product) ? "status-paid" : "status-failed"}`}>{isActive(product) ? "Active" : "Inactive"}</span></div>
            </div>
          </div>

          {product.variants && product.variants.length > 0 && (
            <div>
              <h3 style={{ margin: "0 0 15px 0", fontSize: 18, fontWeight: 600, color: "var(--text)", borderBottom: "1px solid #e2e8f0", paddingBottom: 10 }}>Variants</h3>
              <div className="table-wrapper" style={{ borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                      <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: 12, textTransform: "uppercase", fontWeight: 600 }}>Unit / Size</th>
                      <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: 12, textTransform: "uppercase", fontWeight: 600 }}>Actual Price</th>
                      <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: 12, textTransform: "uppercase", fontWeight: 600 }}>Selling Price</th>
                      <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: 12, textTransform: "uppercase", fontWeight: 600 }}>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((v, i) => (
                      <tr key={i} style={{ borderBottom: i === product.variants.length - 1 ? "none" : "1px solid #e2e8f0" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 500 }}>{v.unit_value ? `${v.unit_value} ` : ""}{v.unit || "-"}</td>
                        <td style={{ padding: "12px 16px", textDecoration: "line-through", color: "#94a3b8" }}>₹{v.actual_price}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--brand)" }}>₹{v.selling_price}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: 4, fontWeight: 500, fontSize: 13, color: "#334155" }}>
                            {v.available_quantity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <h3 style={{ margin: "0 0 15px 0", fontSize: 18, fontWeight: 600, color: "var(--text)", borderBottom: "1px solid #e2e8f0", paddingBottom: 10 }}>Product Media</h3>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {(() => {
                try {
                  const urls = JSON.parse(product.media_urls || "[]");
                  if (urls.length === 0) return <div style={{ color: "#94a3b8", fontStyle: "italic", fontSize: 14 }}>No media available</div>;
                  return urls.map((url: string, i: number) => {
                    if (url.startsWith("data:video") || url.match(/\.(mp4|webm)$/)) {
                      return <video key={i} src={url} controls style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }} />
                    }
                    return <img key={i} src={url} alt={`product media ${i + 1}`} style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }} />
                  });
                } catch {
                  return <div style={{ color: "#ef4444", fontSize: 14 }}>Invalid media format</div>;
                }
              })()}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default function ProductDetailPage() {
  return (
    <>
      <Suspense fallback={<p>Loading...</p>}>
        <ProductDetailContent />
      </Suspense>
    </>
  );
}
