"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { ArrowLeft, Search, RefreshCw, CreditCard } from "lucide-react";

function LedgerDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId") || "";
  const customerName = searchParams.get("name") || "";

  const [ledgerData, setLedgerData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchLedgerDetails = async () => {
    if (!customerId) return;
    setIsLoading(true);
    try {
      const data = await apiRequest<any[]>(`/api/customer-ledger/details?customerId=${customerId}`);
      setLedgerData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load customer ledger details:", err);
      setLedgerData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerDetails();
  }, [customerId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return dateString;
    return dateObj.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const formatTimestamp = (dateString: string) => {
    if (!dateString) return "-";
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return dateString;
    return dateObj.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const renderBalanceBadge = (amt: number) => {
    if (amt > 0) {
      return (
        <span style={{ color: "#ef4444", fontWeight: 700 }}>
          {formatCurrency(amt)}{" "}
          <span style={{ fontSize: "11px", textTransform: "uppercase", background: "#fee2e2", color: "#b91c1c", padding: "2px 6px", borderRadius: "4px", marginLeft: "4px", fontWeight: 600 }}>
            Due
          </span>
        </span>
      );
    } else if (amt < 0) {
      return (
        <span style={{ color: "#2563eb", fontWeight: 700 }}>
          {formatCurrency(Math.abs(amt))}{" "}
          <span style={{ fontSize: "11px", textTransform: "uppercase", background: "#dbeafe", color: "#1e40af", padding: "2px 6px", borderRadius: "4px", marginLeft: "4px", fontWeight: 600 }}>
            Advance
          </span>
        </span>
      );
    } else {
      return (
        <span style={{ color: "#10b981", fontWeight: 700 }}>
          ₹0.00{" "}
          <span style={{ fontSize: "11px", textTransform: "uppercase", background: "#dcfce7", color: "#15803d", padding: "2px 6px", borderRadius: "4px", marginLeft: "4px", fontWeight: 600 }}>
            Settled
          </span>
        </span>
      );
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase: "Purchase",
      payment: "Payment",
      advance: "Advance"
    };
    return labels[type] || type;
  };

  const getTransactionTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      purchase: "#ef4444",
      payment: "#10b981",
      advance: "#3b82f6"
    };
    return colors[type] || "#6b7280";
  };

  const totalDebit = ledgerData.reduce((sum, item) => sum + Number(item.debit_amount || 0), 0);
  const totalCredit = ledgerData.reduce((sum, item) => sum + Number(item.credit_amount || 0), 0);
  const outstandingBalance = totalDebit - totalCredit;

  const filteredLedger = ledgerData.filter((item) => {
    if (typeFilter && item.transaction_type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchRemarks = item.remarks && item.remarks.toLowerCase().includes(q);
      const matchRef = item.reference_type && item.reference_type.toLowerCase().includes(q);
      const matchType = item.transaction_type && item.transaction_type.toLowerCase().includes(q);
      return matchRemarks || matchRef || matchType;
    }
    return true;
  });

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <Link href="/admin/ledger" className="button secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
            <ArrowLeft size={16} />
            Back to Customer Ledger
          </Link>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "var(--text)" }}>
            {customerName ? `Ledger Details — ${customerName}` : "Customer Ledger Details"}
          </h1>
          <p style={{ color: "var(--muted)", margin: "4px 0 0 0", fontSize: "14px" }}>
            Complete statement of debit purchases and credit payments
          </p>
        </div>

        <button className="button secondary" type="button" onClick={fetchLedgerDetails} disabled={isLoading}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ padding: "20px", background: "white", borderRadius: "12px", border: "1px solid var(--line)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "13px", color: "#b91c1c", fontWeight: 600, textTransform: "uppercase" }}>Total Purchases (Debit)</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#ef4444", marginTop: "6px" }}>
            {formatCurrency(totalDebit)}
          </div>
        </div>

        <div style={{ padding: "20px", background: "white", borderRadius: "12px", border: "1px solid var(--line)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "13px", color: "#15803d", fontWeight: 600, textTransform: "uppercase" }}>Total Payments (Credit)</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#10b981", marginTop: "6px" }}>
            {formatCurrency(totalCredit)}
          </div>
        </div>

        <div style={{ padding: "20px", background: "white", borderRadius: "12px", border: "1px solid var(--line)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "13px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>Current Outstanding Balance</div>
          <div style={{ fontSize: "22px", fontWeight: 700, marginTop: "6px" }}>
            {renderBalanceBadge(outstandingBalance)}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar-container" style={{ marginBottom: "24px" }}>
        <div className="filter-bar-wrapper" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "16px", alignItems: "center" }}>
          <div className="filter-group">
            <label className="filter-label">Search</label>
            <div className="filter-input-wrapper">
              <div className="filter-input-icon">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search by remarks, reference ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-input"
              />
            </div>
          </div>

          <div className="filter-group-fixed">
            <label className="filter-label">Transaction Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-select"
              style={{ minWidth: "180px" }}
            >
              <option value="">All Types</option>
              <option value="purchase">Purchase (Debit)</option>
              <option value="payment">Payment (Credit)</option>
              <option value="advance">Advance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid var(--line)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--muted)" }}>
            Loading customer ledger details...
          </div>
        ) : filteredLedger.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--muted)" }}>
            No ledger transactions found for this customer.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: "13px", textTransform: "uppercase" }}>Date & Time</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: "13px", textTransform: "uppercase" }}>Type</th>
                  <th style={{ padding: "14px 16px", textAlign: "right", fontWeight: 600, color: "var(--muted)", fontSize: "13px", textTransform: "uppercase" }}>Amount</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: "13px", textTransform: "uppercase" }}>Reference</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: "13px", textTransform: "uppercase" }}>Remarks / Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.map((item) => {
                  const isDebit = Number(item.debit_amount || 0) > 0;
                  const isCredit = Number(item.credit_amount || 0) > 0;
                  const amountVal = isDebit ? Number(item.debit_amount) : Number(item.credit_amount);

                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 16px", fontSize: "14px", fontWeight: 500 }}>
                        <div>{formatDate(item.transaction_date)}</div>
                        <div style={{ fontSize: "12px", color: "var(--muted)" }}>{formatTimestamp(item.created_at)}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "white",
                            backgroundColor: getTransactionTypeBadge(item.transaction_type)
                          }}
                        >
                          {getTransactionTypeLabel(item.transaction_type)}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "15px", fontWeight: 700 }}>
                        {isDebit ? (
                          <span style={{ color: "#ef4444" }}>
                            + {formatCurrency(amountVal)}{" "}
                            <span style={{ fontSize: "11px", fontWeight: 600, background: "#fee2e2", color: "#b91c1c", padding: "2px 6px", borderRadius: "4px", marginLeft: "4px" }}>
                              Debit
                            </span>
                          </span>
                        ) : isCredit ? (
                          <span style={{ color: "#16a34a" }}>
                            - {formatCurrency(amountVal)}{" "}
                            <span style={{ fontSize: "11px", fontWeight: 600, background: "#dcfce7", color: "#15803d", padding: "2px 6px", borderRadius: "4px", marginLeft: "4px" }}>
                              Credit
                            </span>
                          </span>
                        ) : (
                          <span style={{ color: "var(--muted)" }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "var(--text)" }}>
                        {item.reference_type ? (
                          <span style={{ fontWeight: 600 }}>
                            {item.reference_type}
                            {item.reference_id && ` #${item.reference_id}`}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "var(--muted)" }}>
                        {item.remarks || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #e2e8f0", background: "#f8fafc", fontWeight: 600 }}>
                  <td colSpan={2} style={{ padding: "14px 16px", textAlign: "right", fontSize: "14px" }}>
                    TOTAL PURCHASES (DEBIT):
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "15px", color: "#ef4444", fontWeight: 700 }}>
                    + {formatCurrency(totalDebit)}
                  </td>
                  <td colSpan={2} style={{ padding: "14px 16px" }}></td>
                </tr>
                <tr style={{ borderTop: "1px solid #e2e8f0", background: "#f8fafc", fontWeight: 600 }}>
                  <td colSpan={2} style={{ padding: "14px 16px", textAlign: "right", fontSize: "14px" }}>
                    TOTAL PAYMENTS (CREDIT):
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "15px", color: "#16a34a", fontWeight: 700 }}>
                    - {formatCurrency(totalCredit)}
                  </td>
                  <td colSpan={2} style={{ padding: "14px 16px" }}></td>
                </tr>
                <tr style={{ borderTop: "2px solid #cbd5e1", background: "#f1f5f9", fontWeight: 700 }}>
                  <td colSpan={2} style={{ padding: "14px 16px", textAlign: "right", fontSize: "15px" }}>
                    OUTSTANDING BALANCE:
                  </td>
                  <td colSpan={3} style={{ padding: "14px 16px", fontSize: "16px" }}>
                    {renderBalanceBadge(outstandingBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LedgerDetailsPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "60px", color: "var(--muted)" }}>Loading page...</div>}>
      <LedgerDetailsContent />
    </Suspense>
  );
}
