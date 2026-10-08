"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AdminModule } from "@/components/admin-module";
import Link from "next/link";
import { Plus, Eye, Trash2, Search, MoreVertical } from "lucide-react";
import { ConfirmModal } from "@/components/confirm-modal";
import { apiRequest } from "@/lib/api";

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [busy, setBusy] = useState(false);
  const [responseModal, setResponseModal] = useState<{
    isOpen: boolean;
    response: any;
    orderId: string;
  }>({
    isOpen: false,
    response: null,
    orderId: ""
  });
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
          { key: "merchant_transaction_id", label: "Merchant Txn ID" },
          { key: "atom_transaction_id", label: "Atom Txn ID" },
          { key: "total_amount", label: "Amount" },
          { key: "created_at", label: "Created" }
        ]}
        renderCell={(row, column, reload) => {
          // Custom rendering for transaction ID columns
          if (column.key === "merchant_transaction_id") {
            const value = row.merchant_transaction_id;
            if (!value) {
              return <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>;
            }
            return (
              <div 
                title={value}
                style={{ 
                  fontSize: '11px', 
                  fontFamily: 'monospace', 
                  minWidth: '180px',
                  maxWidth: '200px', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {value}
              </div>
            );
          }
          
          if (column.key === "atom_transaction_id") {
            const value = row.atom_transaction_id;
            if (!value) {
              return <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>;
            }
            return (
              <div 
                title={value}
                style={{ 
                  fontSize: '11px', 
                  fontFamily: 'monospace', 
                  minWidth: '140px',
                  maxWidth: '160px', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  color: '#059669',
                  whiteSpace: 'nowrap'
                }}
              >
                {value}
              </div>
            );
          }

          // Custom rendering for payment status with color coding
          if (column.key === "payment_status") {
            const status = row.payment_status as string;
            const colors: Record<string, string> = {
              'paid': '#059669',
              'pending': '#d97706', 
              'failed': '#dc2626'
            };
            return (
              <span style={{ 
                color: colors[status] || '#6b7280', 
                fontSize: '12px',
                fontWeight: '600' 
              }}>
                {status?.toUpperCase() || 'N/A'}
              </span>
            );
          }

          // Default rendering for other columns
          return null;
        }}
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
                  const dropdownWidth = 160;
                  
                  // Position dropdown aligned with button top
                  let top = rect.top;
                  let left = rect.right - dropdownWidth;
                  
                  // Keep dropdown within viewport horizontally
                  if (left < 10) left = 10;
                  if (left + dropdownWidth > window.innerWidth) left = window.innerWidth - dropdownWidth - 10;
                  
                  setDropdownPosition({ top, left });
                  setOpenActionId(row.id);
                }
              }}
              style={{ padding: '6px' }}
            >
              <MoreVertical size={16} />
            </button>
            
            {openActionId === row.id && typeof document !== 'undefined' && createPortal(
              <>
                <div 
                  className="actions-dropdown-overlay" 
                  onClick={(e) => { e.stopPropagation(); setOpenActionId(null); }} 
                />
                <div 
                  className="actions-dropdown-menu direction-down"
                  style={{
                    position: 'fixed',
                    top: dropdownPosition.top + 'px',
                    left: dropdownPosition.left + 'px',
                    zIndex: 10001,
                  }}
                >
                  <Link 
                    href={`/admin/orders/view?id=${row.id}`}
                    className="button secondary actions-dropdown-item" 
                    title="View Order" 
                  >
                    <Eye size={16} color="#3b82f6" style={{ marginRight: 8 }} />
                    View
                  </Link>
                  {row.ndps_response && (
                    <button 
                      className="button secondary actions-dropdown-item" 
                      title="View NDPS Response"
                      type="button"
                      onClick={() => {
                        setOpenActionId(null);
                        try {
                          const response = typeof row.ndps_response === 'string' 
                            ? JSON.parse(row.ndps_response) 
                            : row.ndps_response;
                          setResponseModal({
                            isOpen: true,
                            response: response,
                            orderId: row.order_number || row.id
                          });
                        } catch (error) {
                          setResponseModal({
                            isOpen: true,
                            response: { error: "Invalid JSON", raw: row.ndps_response },
                            orderId: row.order_number || row.id
                          });
                        }
                      }}
                    >
                      <Search size={16} color="#059669" style={{ marginRight: 8 }} />
                      NDPS Response
                    </button>
                  )}
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
              </>,
              document.body
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

      {/* NDPS Response Modal */}
      {responseModal.isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10002,
          }}
          onClick={() => setResponseModal(prev => ({ ...prev, isOpen: false }))}
        >
          <div 
            className="modal-content"
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '800px',
              maxHeight: '80vh',
              overflow: 'auto',
              margin: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#1f2937', fontSize: '20px', fontWeight: '600' }}>
                NDPS Response - Order {responseModal.orderId}
              </h2>
              <button 
                onClick={() => setResponseModal(prev => ({ ...prev, isOpen: false }))}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  padding: '4px',
                }}
              >
                ×
              </button>
            </div>

            {responseModal.response?.error ? (
              <div>
                <div style={{ 
                  backgroundColor: '#fee2e2', 
                  border: '1px solid #fecaca', 
                  borderRadius: '8px', 
                  padding: '16px', 
                  marginBottom: '16px' 
                }}>
                  <h3 style={{ color: '#dc2626', margin: '0 0 8px 0', fontSize: '16px' }}>
                    Error: {responseModal.response.error}
                  </h3>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    Raw Response:
                  </h4>
                  <pre style={{
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {responseModal.response.raw}
                  </pre>
                </div>
              </div>
            ) : (
              <div>
                {/* Status Summary */}
                {responseModal.response?.payInstrument?.[0]?.responseDetails && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ 
                      backgroundColor: '#f0fdf4', 
                      border: '1px solid #bbf7d0', 
                      borderRadius: '8px', 
                      padding: '16px' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'monospace', color: '#059669' }}>
                            {responseModal.response.payInstrument[0].responseDetails.statusCode}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                            {responseModal.response.payInstrument[0].responseDetails.message || 'No message'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Formatted Response */}
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ color: '#374151', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                    Complete NDPS Response:
                  </h4>
                  <pre style={{
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '20px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    overflow: 'auto',
                    maxHeight: '400px',
                    lineHeight: '1.5',
                  }}>
                    {JSON.stringify(responseModal.response, null, 2)}
                  </pre>
                </div>

                {/* Key Details */}
                {responseModal.response?.payInstrument?.[0] && (
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ color: '#374151', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                      Key Details:
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                      {Object.entries(responseModal.response.payInstrument[0]).map(([key, value]) => (
                        <div key={key} style={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          padding: '12px',
                        }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {key}
                          </div>
                          <div style={{ fontSize: '13px', color: '#1f2937', marginTop: '4px', fontFamily: 'monospace' }}>
                            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button 
                className="button secondary"
                onClick={() => setResponseModal(prev => ({ ...prev, isOpen: false }))}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
