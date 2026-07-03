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
        <div className="product-header-container">
          <Link href="/admin/products" className="product-back-link">
            <ArrowLeft size={16} /> Back to Products
          </Link>
          <h1 className="product-title">Product Details</h1>
        </div>
      </div>
    );
  }

  const readOnlyStyle: React.CSSProperties = {
    background: '#f0f4ee',
    padding: '9px 11px',
    borderRadius: '8px',
    border: '1px solid var(--line)',
    color: 'var(--text)',
    fontSize: '14px',
    fontWeight: 500,
    minHeight: '42px',
    display: 'flex',
    alignItems: 'center'
  };

  return (
    <>
      <div className="section-header">
        <div className="product-header-container">
          <Link href="/admin/products" className="product-back-link">
            <ArrowLeft size={16} /> Back to Products
          </Link>
          <h1 className="product-title">
            {product.name}
            {product.unit ? <span className="product-unit-text">({product.unit})</span> : ""}
          </h1>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="form-grid">
            <div className="field">
              <span>Category</span>
              <div style={readOnlyStyle}>{product.category}</div>
            </div>

            <div className="field">
              <span>Total Stock</span>
              <div style={readOnlyStyle}>{product.available_quantity}</div>
            </div>

            <div className="field">
              <span>Status</span>
              <div style={{ ...readOnlyStyle, background: 'transparent', border: 'none', padding: 0 }}>
                <span className={`status-badge ${isActive(product) ? "status-paid" : "status-failed"}`}>
                  {isActive(product) ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <span>Description</span>
              <div style={{ ...readOnlyStyle, alignItems: 'flex-start', minHeight: '92px' }}>
                {product.description || <span className="meta" style={{ fontStyle: "italic" }}>No description provided.</span>}
              </div>
            </div>

            <div className="field">
              <span>Actual Price</span>
              <div style={{ ...readOnlyStyle, textDecoration: 'line-through', color: 'var(--muted)' }}>₹{product.actual_price}</div>
            </div>

            <div className="field">
              <span>Selling Price</span>
              <div style={{ ...readOnlyStyle, fontWeight: 600, color: 'var(--brand)' }}>₹{product.selling_price}</div>
            </div>

            {product.variants && product.variants.length > 0 && (
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <span>Variants</span>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Unit / Size</th>
                        <th>Actual Price</th>
                        <th>Selling Price</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((v, i) => (
                        <tr key={i}>
                          <td>{v.unit_value ? `${v.unit_value} ` : ""}{v.unit || "-"}</td>
                          <td><span style={{ textDecoration: 'line-through', color: 'var(--muted)' }}>₹{v.actual_price}</span></td>
                          <td><span style={{ fontWeight: 600 }}>₹{v.selling_price}</span></td>
                          <td>{v.available_quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <span>Product Media</span>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
                {(() => {
                  try {
                    const urls = JSON.parse(product.media_urls || "[]");
                    if (urls.length === 0) return <div className="meta" style={{ fontStyle: "italic" }}>No media available</div>;
                    return urls.map((url: string, i: number) => {
                      if (url.startsWith("data:video") || url.match(/\.(mp4|webm)$/)) {
                        return <video key={i} src={url} controls style={{ width: 120, height: 120, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--line)' }} />;
                      }
                      return <img key={i} src={url} alt={`product media ${i + 1}`} style={{ width: 120, height: 120, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--line)' }} />;
                    });
                  } catch {
                    return <div className="meta">Invalid media format</div>;
                  }
                })()}
              </div>
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
