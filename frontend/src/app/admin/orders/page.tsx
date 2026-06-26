"use client";

import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { AdminModule } from "@/components/admin-module";
import Link from "next/link";
import { Plus, Eye, Trash2, Search } from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  return (
    <AdminShell>
      <AdminModule
        eyebrow="Online Order Management"
        title="Received to Delivered"
        listPath="/api/orders"
        headerActions={
          <Link href="/admin/orders/create" className="button">
            <Plus size={16} />
            Create Order
          </Link>
        }
        columns={[
          { key: "order_number", label: "Order" },
          { key: "customer", label: "Customer" },
          { key: "status", label: "Status" },
          { key: "payment_status", label: "Payment" },
          { key: "total_amount", label: "Amount" },
          { key: "created_at", label: "Created" }
        ]}
        filterContent={
          <div style={{ display: 'flex', gap: '16px', background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }}>
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Search by Order ID, Customer, or Product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: '38px', height: '42px', borderRadius: '8px', border: '1px solid #e4e4e7', outline: 'none' }}
              />
            </div>
            <div style={{ width: '200px' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1px solid #e4e4e7', outline: 'none', padding: '0 12px', color: statusFilter ? '#18181b' : '#71717a' }}
              >
                <option value="">All Statuses</option>
                <option value="received">Received</option>
                <option value="approved">Approved</option>
                <option value="dispatch">Dispatch</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        }
        filterRows={(rows) => rows.filter(row => {
          const search = searchQuery.toLowerCase();
          const matchSearch = !search ||
            String(row.order_number || "").toLowerCase().includes(search) ||
            String(row.customer || "").toLowerCase().includes(search) ||
            String(row.products || "").toLowerCase().includes(search);

          const matchStatus = !statusFilter || row.status === statusFilter;

          return matchSearch && matchStatus;
        })}
        rowActions={(row) => (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href={`/admin/orders/view?id=${row.id}`} className="button secondary" title="View Order" style={{ padding: '6px 8px', minHeight: 'auto', height: 'auto' }}>
              <Eye size={16} color="#52525b" />
            </Link>
            <button 
              className="button secondary" 
              title="Delete Order"
              style={{ padding: '6px 8px', minHeight: 'auto', height: 'auto', color: '#ef4444', borderColor: '#fee2e2', backgroundColor: '#fef2f2' }}
              onClick={async () => {
                if (confirm(`Are you sure you want to delete order ${row.order_number}?`)) {
                  try {
                    await apiRequest("/api/orders/delete", {
                      method: "POST",
                      body: JSON.stringify({ orderId: row.id })
                    });
                    window.location.reload();
                  } catch (e) {
                    alert("Failed to delete order");
                  }
                }
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />
    </AdminShell>
  );
}
