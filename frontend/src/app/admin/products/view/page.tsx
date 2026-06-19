"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
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
          <p className="meta">{status}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="section-header">
        <div>
          <Link href="/admin/products" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--brand)", fontWeight: 600, marginBottom: 12 }}>
            <ArrowLeft size={16} /> Back to Products
          </Link>
          <p className="eyebrow">Product View</p>
          <h1>{product.name} {product.unit ? `(${product.unit})` : ""}</h1>
          <p className="meta">{status}</p>
        </div>
      </div>

      <div className="card" style={{ padding: 20, width: "100%", maxWidth: 800 }}>
        <div className="card-header" style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #e2e8f0" }}>
          <h2 style={{ margin: 0 }}>Product Details</h2>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div style={{ marginBottom: 16 }}>
            <strong>Category:</strong> {product.category}
          </div>
          <div style={{ marginBottom: 16 }}>
            <strong>Description:</strong> <p style={{ whiteSpace: "pre-wrap", margin: "4px 0", color: "#475569" }}>{product.description || "N/A"}</p>
          </div>
          <div style={{ marginBottom: 16, display: "flex", gap: 20, flexWrap: "wrap", background: "#f8fafc", padding: 15, borderRadius: 6, border: "1px solid #e2e8f0" }}>
            <div><strong>Base Actual Price:</strong> ₹{product.actual_price}</div>
            <div><strong>Base Selling Price:</strong> ₹{product.selling_price}</div>
            <div><strong>Base Stock:</strong> {product.available_quantity}</div>
            <div><strong>Status:</strong> <span className={`status-badge ${isActive(product) ? "status-paid" : "status-failed"}`}>{isActive(product) ? "Active" : "Inactive"}</span></div>
          </div>

          {product.variants && product.variants.length > 0 && (
            <div style={{ marginTop: 30 }}>
              <h3 style={{ margin: "0 0 10px 0" }}>Variants</h3>
              <div className="table-wrapper">
                <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                      <th style={{ padding: "10px", borderBottom: "2px solid #cbd5e1" }}>Unit</th>
                      <th style={{ padding: "10px", borderBottom: "2px solid #cbd5e1" }}>Actual Price</th>
                      <th style={{ padding: "10px", borderBottom: "2px solid #cbd5e1" }}>Selling Price</th>
                      <th style={{ padding: "10px", borderBottom: "2px solid #cbd5e1" }}>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((v, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "10px" }}>{v.unit_value ? `${v.unit_value} ` : ""}{v.unit || "-"}</td>
                        <td style={{ padding: "10px", textDecoration: "line-through", color: "#94a3b8" }}>₹{v.actual_price}</td>
                        <td style={{ padding: "10px", fontWeight: 600 }}>₹{v.selling_price}</td>
                        <td style={{ padding: "10px" }}>{v.available_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ marginTop: 30 }}>
            <h3 style={{ margin: "0 0 10px 0" }}>Media</h3>
            <div style={{ display: "flex", gap: 15, flexWrap: "wrap", background: "#f8fafc", padding: 15, borderRadius: 8, border: "1px solid #e2e8f0" }}>
              {(() => {
                try {
                  const urls = JSON.parse(product.media_urls || "[]");
                  if (urls.length === 0) return <span className="meta">No media available</span>;
                  return urls.map((url: string, i: number) => {
                    if (url.startsWith("data:video") || url.match(/\.(mp4|webm)$/)) {
                      return <video key={i} src={url} controls style={{ width: 140, height: 140, objectFit: "cover", borderRadius: 6, border: "1px solid #cbd5e1" }} />
                    }
                    return <img key={i} src={url} alt="media" style={{ width: 140, height: 140, objectFit: "cover", borderRadius: 6, border: "1px solid #cbd5e1" }} />
                  });
                } catch {
                  return <span className="meta">Invalid media format</span>;
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
    <AdminShell>
      <Suspense fallback={<p>Loading...</p>}>
        <ProductDetailContent />
      </Suspense>
    </AdminShell>
  );
}
