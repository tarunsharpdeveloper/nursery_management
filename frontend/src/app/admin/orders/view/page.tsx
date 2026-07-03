"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/api";
import Link from "next/link";

type OrderItem = {
  id: number;
  quantity: number;
  unit_price: string;
  line_total: string;
  product_name: string;
  product_type: string;
  unit: string | null;
  unit_value: string | null;
};

type OrderDetail = {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: string;
  created_at: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  order_source?: string;
  items: OrderItem[];
};

function ViewOrderContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [status, setStatus] = useState("Loading order details...");

  useEffect(() => {
    if (!orderId) {
      setStatus("Invalid Order ID");
      return;
    }

    apiRequest<OrderDetail>("/api/orders/get", {
      method: "POST",
      body: JSON.stringify({ orderId: Number(orderId) })
    })
      .then((data) => {
        setOrder(data);
        setStatus("");
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Failed to load order");
      });
  }, [orderId]);

  if (!order) {
    return (
      <>
        <div className="section-header">
          <div>
            {/* <p className="eyebrow">Online Order Management</p> */}
            <h1>View Order</h1>

          </div>
          <Link href="/admin/orders" className="button secondary">
            <ArrowLeft size={17} />
            Back to Orders
          </Link>
        </div>
      </>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("en-IN", {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'received': return '#3b82f6';
      case 'approved': return '#8b5cf6';
      case 'dispatch': return '#f59e0b';
      case 'delivered': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <>
      <div className="section-header">
        <div>
          {/* <p className="eyebrow">Online Order Management</p> */}
          <h1>Order {order.order_number}</h1>
          <p className="meta">Placed on {formatDate(order.created_at)}</p>
        </div>
        <Link href="/admin/orders" className="button secondary">
          <ArrowLeft size={17} />
          Back to Orders
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>

        {/* Customer Details Card */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #e4e4e7', color: '#18181b' }}>Customer Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#71717a' }}>Name:</span>
              <span style={{ fontWeight: 500, color: '#27272a' }}>{order.customer_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#71717a' }}>Mobile:</span>
              <span style={{ fontWeight: 500, color: '#27272a' }}>{order.phone || "N/A"}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#71717a' }}>Email:</span>
              <span style={{ fontWeight: 500, color: '#27272a' }}>{order.email || "N/A"}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '4px' }}>
              <span style={{ color: '#71717a', marginBottom: '4px' }}>Shipping Address:</span>
              <p style={{ background: '#f4f4f5', padding: '10px 12px', borderRadius: '6px', margin: 0, color: '#3f3f46', lineHeight: 1.5 }}>
                {order.address || "No address provided."}
              </p>
            </div>
          </div>
        </div>

        {/* Order Details Card */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #e4e4e7', color: '#18181b' }}>Order Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#71717a' }}>Order Source:</span>
              <span style={{ fontWeight: 500, color: '#27272a', textTransform: 'capitalize' }}>
                {order.order_source?.replace('_', ' ') || "Manual Entry"}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#71717a' }}>Order Status:</span>
              <span style={{
                background: `${getStatusColor(order.status)}15`,
                color: getStatusColor(order.status),
                padding: '4px 10px',
                borderRadius: '999px',
                fontWeight: 600,
                fontSize: '0.85rem',
                textTransform: 'capitalize'
              }}>
                {order.status}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#71717a' }}>Payment Status:</span>
              <span style={{
                background: order.payment_status === 'paid' ? '#10b98115' : '#f59e0b15',
                color: order.payment_status === 'paid' ? '#10b981' : '#f59e0b',
                padding: '4px 10px',
                borderRadius: '999px',
                fontWeight: 600,
                fontSize: '0.85rem',
                textTransform: 'capitalize'
              }}>
                {order.payment_status}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px dashed #e4e4e7' }}>
              <span style={{ color: '#3f3f46', fontWeight: 600 }}>Grand Total:</span>
              <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '1.2rem' }}>₹{Number(order.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e4e4e7', background: '#fafafa' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#18181b' }}>Purchased Items ({order.items.length})</h3>
        </div>
        <div className="table-wrap" style={{ margin: 0, borderRadius: 0, boxShadow: 'none' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 24px', textAlign: 'left', background: '#f4f4f5', color: '#52525b', fontWeight: 600 }}>Product Name</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', background: '#f4f4f5', color: '#52525b', fontWeight: 600 }}>Variant</th>
                <th style={{ padding: '12px 24px', textAlign: 'right', background: '#f4f4f5', color: '#52525b', fontWeight: 600 }}>Unit Price</th>
                <th style={{ padding: '12px 24px', textAlign: 'right', background: '#f4f4f5', color: '#52525b', fontWeight: 600 }}>Qty</th>
                <th style={{ padding: '12px 24px', textAlign: 'right', background: '#f4f4f5', color: '#52525b', fontWeight: 600 }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f4f4f5' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 500, color: '#27272a' }}>{item.product_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#a1a1aa', textTransform: 'capitalize' }}>{item.product_type}</div>
                  </td>
                  <td style={{ padding: '16px 24px', color: '#52525b' }}>
                    {item.unit_value && item.unit ? `${item.unit_value} ${item.unit}` : <span style={{ color: '#a1a1aa' }}>-</span>}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', color: '#52525b' }}>
                    ₹{Number(item.unit_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', color: '#52525b' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600, color: '#27272a' }}>
                    ₹{Number(item.line_total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function ViewOrderPage() {
  return (
    <Suspense fallback={
      <>
        <div className="section-header">
          <div>
            {/* <p className="eyebrow">Online Order Management</p> */}
            <h1>View Order</h1>
            <p className="meta">Loading...</p>
          </div>
        </div>
      </>
    }>
      <ViewOrderContent />
    </Suspense>
  );
}
