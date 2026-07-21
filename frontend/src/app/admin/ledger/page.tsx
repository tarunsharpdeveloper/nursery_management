"use client";

import { useState } from "react";
import { AdminModule } from "@/components/admin-module";
import { FormModal } from "@/components/form-modal";
import { apiRequest } from "@/lib/api";
import { X } from "lucide-react";

export default function LedgerPage() {
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: number; name: string } | null>(null);
  const [ledgerDetails, setLedgerDetails] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomerLedger = async (customerId: number, customerName: string) => {
    setIsLoading(true);
    setSelectedCustomer({ id: customerId, name: customerName });
    setIsModalOpen(true);
    
    try {
      const data = await apiRequest<any[]>(`/api/customer-ledger/details?customerId=${customerId}`);
      setLedgerDetails(data || []);
    } catch (error) {
      console.error("Failed to fetch ledger details:", error);
      setLedgerDetails([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase: "Purchase",
      payment: "Payment",
      advance: "Advance",
      adjustment: "Adjustment"
    };
    return labels[type] || type;
  };

  const getTransactionTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      purchase: "#ef4444",
      payment: "#10b981",
      advance: "#3b82f6",
      adjustment: "#f59e0b"
    };
    return colors[type] || "#6b7280";
  };

  return (
    <>
      <AdminModule
        eyebrow="Customer Ledger"
        title="Credit Customer Outstanding"
        listPath="/api/customer-ledger"
        columns={[
          { key: "customer", label: "Customer" },
          { key: "total_purchase", label: "Total Purchase" },
          { key: "amount_paid", label: "Amount Paid" },
          { key: "outstanding_amount", label: "Outstanding" }
        ]}
        renderCell={(row, column) => {
          if (column.key === "customer") {
            return (
              <button
                onClick={() => fetchCustomerLedger(row.customer_id, row.customer)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2f6b3f",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                  fontSize: "inherit"
                }}
              >
                {row.customer}
              </button>
            );
          }
          return null;
        }}
      />

      <FormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCustomer(null);
          setLedgerDetails([]);
        }}
        title={`Ledger Details - ${selectedCustomer?.name || ""}`}
        maxWidth={1000}
      >
        <div style={{ padding: "20px" }}>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
              Loading ledger details...
            </div>
          ) : ledgerDetails.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
              No transactions found for this customer
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: "13px", textTransform: "uppercase" }}>Date</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: "13px", textTransform: "uppercase" }}>Type</th>
                    <th style={{ padding: "12px", textAlign: "right", fontWeight: 600, color: "var(--muted)", fontSize: "13px", textTransform: "uppercase" }}>Debit</th>
                    <th style={{ padding: "12px", textAlign: "right", fontWeight: 600, color: "var(--muted)", fontSize: "13px", textTransform: "uppercase" }}>Credit</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: "13px", textTransform: "uppercase" }}>Reference</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: "13px", textTransform: "uppercase" }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(ledgerDetails) && ledgerDetails.map((transaction) => (
                    <tr key={transaction.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px", fontSize: "14px" }}>
                        {formatDate(transaction.transaction_date)}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "white",
                            backgroundColor: getTransactionTypeBadge(transaction.transaction_type)
                          }}
                        >
                          {getTransactionTypeLabel(transaction.transaction_type)}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", fontSize: "14px", fontWeight: 500, color: Number(transaction.debit_amount) > 0 ? "#ef4444" : "var(--muted)" }}>
                        {Number(transaction.debit_amount) > 0 ? formatCurrency(Number(transaction.debit_amount)) : "-"}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", fontSize: "14px", fontWeight: 500, color: Number(transaction.credit_amount) > 0 ? "#10b981" : "var(--muted)" }}>
                        {Number(transaction.credit_amount) > 0 ? formatCurrency(Number(transaction.credit_amount)) : "-"}
                      </td>
                      <td style={{ padding: "12px", fontSize: "13px", color: "var(--muted)" }}>
                        {transaction.reference_type ? (
                          <>
                            {transaction.reference_type}
                            {transaction.reference_id && ` #${transaction.reference_id}`}
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={{ padding: "12px", fontSize: "13px", color: "var(--muted)" }}>
                        {transaction.remarks || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid #e2e8f0", fontWeight: 600 }}>
                    <td colSpan={2} style={{ padding: "12px", textAlign: "right", fontSize: "14px" }}>
                      TOTALS:
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", fontSize: "14px", color: "#ef4444" }}>
                      {formatCurrency(
                        Array.isArray(ledgerDetails) 
                          ? ledgerDetails.reduce((sum, t) => sum + Number(t.debit_amount || 0), 0)
                          : 0
                      )}
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", fontSize: "14px", color: "#10b981" }}>
                      {formatCurrency(
                        Array.isArray(ledgerDetails)
                          ? ledgerDetails.reduce((sum, t) => sum + Number(t.credit_amount || 0), 0)
                          : 0
                      )}
                    </td>
                    <td colSpan={2} style={{ padding: "12px" }}></td>
                  </tr>
                  <tr style={{ fontWeight: 600, backgroundColor: "#f8fafc" }}>
                    <td colSpan={2} style={{ padding: "12px", textAlign: "right", fontSize: "15px" }}>
                      OUTSTANDING BALANCE:
                    </td>
                    <td colSpan={4} style={{ padding: "12px", fontSize: "15px", color: "#2f6b3f" }}>
                      {formatCurrency(
                        Array.isArray(ledgerDetails)
                          ? ledgerDetails.reduce((sum, t) => sum + Number(t.debit_amount || 0), 0) -
                            ledgerDetails.reduce((sum, t) => sum + Number(t.credit_amount || 0), 0)
                          : 0
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </FormModal>
    </>
  );
}
