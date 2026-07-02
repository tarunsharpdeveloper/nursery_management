"use client";

import { useState } from "react";
import { AdminModule } from "@/components/admin-module";
import Link from "next/link";
import { Plus, Eye, Trash2, Search, MoreVertical } from "lucide-react";
import { ConfirmModal } from "@/components/confirm-modal";
import { apiRequest } from "@/lib/api";

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [dropdownDirection, setDropdownDirection] = useState<"up" | "down">("down");
  const [busy, setBusy] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: async () => {}
  });
  
  return (
    <>
      <AdminModule
        eyebrow=""
        title="Received to Delivered"
        listPath="/api/admin/data-list?model=orders"
        searchPlaceholder="Search order number, customer..."
        filterConfig={{
          key: "status",
          label: "Order Status",
          options: [
            { value: "received", label: "Received" },
            { value: "approved", label: "Approved" },
            { value: "dispatch", label: "Dispatch" },
            { value: "delivered", label: "Delivered" },
            { value: "cancelled", label: "Cancelled" }
          ]
        }}
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
        // filterContent={
        //   <div style={{ display: 'flex', gap: '16px', background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        //     <div style={{ flex: 1, position: 'relative' }}>
        //       <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }}>
        //         <Search size={18} />
        //       </div>
        //       <input
        //         type="text"
        //         placeholder="Search by Order ID, Customer, or Product..."
        //         value={searchQuery}
        //         onChange={(e) => setSearchQuery(e.target.value)}
        //         style={{ width: '100%', paddingLeft: '38px', height: '42px', borderRadius: '8px', border: '1px solid #e4e4e7', outline: 'none' }}
        //       />
        //     </div>
        //     <div style={{ width: '200px' }}>
        //       <select
        //         value={statusFilter}
        //         onChange={(e) => setStatusFilter(e.target.value)}
        //         style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1px solid #e4e4e7', outline: 'none', padding: '0 12px', color: statusFilter ? '#18181b' : '#71717a' }}
        //       >
        //         <option value="">All Statuses</option>
        //         <option value="received">Received</option>
        //         <option value="approved">Approved</option>
        //         <option value="dispatch">Dispatch</option>
        //         <option value="delivered">Delivered</option>
        //         <option value="cancelled">Cancelled</option>
        //       </select>
        //     </div>
        //   </div>
        // }
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
          <div className="actions-dropdown-wrapper">
            <button 
              className="button secondary" 
              type="button" 
              title="Actions"
              onClick={(e) => {
                if (openActionId === row.id) {
                  setOpenActionId(null);
                } else {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const spaceBelow = window.innerHeight - rect.bottom;
                  setDropdownDirection(spaceBelow < 200 ? "up" : "down");
                  setOpenActionId(row.id);
                }
              }}
              style={{ padding: '6px' }}
            >
              <MoreVertical size={16} />
            </button>
            
            {openActionId === row.id && (
              <>
                <div 
                  className="actions-dropdown-overlay" 
                  onClick={(e) => { e.stopPropagation(); setOpenActionId(null); }} 
                />
                <div className={`actions-dropdown-menu direction-${dropdownDirection}`}>
                  <Link 
                    href={`/admin/orders/view?id=${row.id}`}
                    className="button secondary actions-dropdown-item" 
                    title="View Order" 
                  >
                    <Eye size={16} color="#3b82f6" style={{ marginRight: 8 }} />
                    View
                  </Link>
                  <button 
                    className="button secondary actions-dropdown-item danger" 
                    title="Delete Order"
                    type="button"
                    onClick={() => {
                      setOpenActionId(null);
                      setConfirmState({
                        isOpen: true,
                        title: "Delete Order",
                        message: `Are you sure you want to delete order ${row.order_number}?`,
                        action: async () => {
                          setBusy(true);
                          try {
                            await apiRequest("/api/orders/delete", {
                              method: "POST",
                              body: JSON.stringify({ orderId: row.id })
                            });
                            window.location.reload();
                          } catch (e) {
                            alert("Failed to delete order");
                          } finally {
                            setBusy(false);
                            setConfirmState(prev => ({ ...prev, isOpen: false }));
                          }
                        }
                      });
                    }}
                  >
                    <Trash2 size={16} color="#ef4444" style={{ marginRight: 8 }} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      />
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText="Delete"
        isDestructive={true}
        isLoading={busy}
        onConfirm={confirmState.action}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}
