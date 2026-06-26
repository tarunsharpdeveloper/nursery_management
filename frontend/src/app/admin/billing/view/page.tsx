"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/api";
import Link from "next/link";

type BillItem = {
  id: number;
  quantity: number;
  unit_price: string;
  line_total: string;
  product_name: string;
  product_type: string;
};

type BillDetail = {
  id: number;
  bill_number: string;
  bill_type: string;
  payment_type: string;
  total_amount: string;
  paid_amount: string;
  balance_amount: string;
  bill_date: string;
  customer_name: string;
  phone: string;
  address: string;
  transaction_id?: string;
  items: BillItem[];
};

export default function ViewBillPage() {
  const searchParams = useSearchParams();
  const billId = searchParams.get("id");
  const [bill, setBill] = useState<BillDetail | null>(null);
  const [status, setStatus] = useState("Loading bill details...");

  useEffect(() => {
    if (!billId) {
      setStatus("Invalid Bill ID");
      return;
    }

    apiRequest<BillDetail>("/api/bills/get", {
      method: "POST",
      body: JSON.stringify({ billId: Number(billId) })
    })
      .then((data) => {
        setBill(data);
        setStatus("");
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Failed to load bill");
      });
  }, [billId]);

  if (!bill) {
    return (
      <AdminShell>
        <div className="section-header">
          <div>
            <p className="eyebrow">Offline Billing</p>
            <h1>View Bill</h1>
          </div>
          <Link href="/admin/billing" className="button secondary">
            <ArrowLeft size={17} />
            Back to Billing
          </Link>
        </div>
      </AdminShell>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("en-IN", {
        day: "numeric", month: "short", year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <AdminShell>
      <div className="section-header">
        <div>
          <p className="eyebrow">Offline Billing</p>
          <h1>Bill {bill.bill_number}</h1>
          <p className="meta">Billed on {formatDate(bill.bill_date)}</p>
        </div>
        <Link href="/admin/billing" className="button secondary">
          <ArrowLeft size={17} />
          Back to Billing
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>

        {/* Customer Details Card */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #e4e4e7', color: '#18181b' }}>Customer Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#71717a' }}>Name:</span>
              <span style={{ fontWeight: 500, color: '#27272a' }}>{bill.customer_name || "Walk-in Customer"}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#71717a' }}>Mobile:</span>
              <span style={{ fontWeight: 500, color: '#27272a' }}>{bill.phone || "N/A"}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '4px' }}>
              <span style={{ color: '#71717a', marginBottom: '4px' }}>Address:</span>
              <p style={{ background: '#f4f4f5', padding: '10px 12px', borderRadius: '6px', margin: 0, color: '#3f3f46', lineHeight: 1.5 }}>
                {bill.address || "No address provided."}
              </p>
            </div>
          </div>
        </div>

        {/* Bill Details Card */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #e4e4e7', color: '#18181b' }}>Bill Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#71717a' }}>Bill Type:</span>
              <span style={{ fontWeight: 500, color: '#27272a', textTransform: 'capitalize' }}>
                {bill.bill_type?.replace('_', ' ')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#71717a' }}>Payment Method:</span>
              <span style={{ fontWeight: 500, color: '#27272a', textTransform: 'uppercase' }}>
                {bill.payment_type}
              </span>
            </div>
            {bill.transaction_id && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#71717a' }}>Transaction ID:</span>
                <span style={{ fontWeight: 500, color: '#27272a' }}>
                  {bill.transaction_id}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px dashed #e4e4e7' }}>
              <span style={{ color: '#71717a' }}>Total Amount:</span>
              <span style={{ color: '#27272a', fontWeight: 'bold' }}>₹{Number(bill.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#71717a' }}>Paid Amount:</span>
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>₹{Number(bill.paid_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#71717a' }}>Balance Amount:</span>
              <span style={{ color: Number(bill.balance_amount) > 0 ? '#ef4444' : '#27272a', fontWeight: 'bold' }}>₹{Number(bill.balance_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e4e4e7', background: '#fafafa' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#18181b' }}>Purchased Items ({bill.items.length})</h3>
        </div>
        <div className="table-wrap" style={{ margin: 0, borderRadius: 0, boxShadow: 'none' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 24px', textAlign: 'left', background: '#f4f4f5', color: '#52525b', fontWeight: 600 }}>Product Name</th>
                <th style={{ padding: '12px 24px', textAlign: 'right', background: '#f4f4f5', color: '#52525b', fontWeight: 600 }}>Unit Price</th>
                <th style={{ padding: '12px 24px', textAlign: 'right', background: '#f4f4f5', color: '#52525b', fontWeight: 600 }}>Qty</th>
                <th style={{ padding: '12px 24px', textAlign: 'right', background: '#f4f4f5', color: '#52525b', fontWeight: 600 }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f4f4f5' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 500, color: '#27272a' }}>{item.product_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#a1a1aa', textTransform: 'capitalize' }}>{item.product_type}</div>
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
    </AdminShell>
  );
}
