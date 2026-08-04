"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { ArrowLeft, Search, RefreshCw, DollarSign, Calendar, History, CreditCard } from "lucide-react";

function PayoutHistoryContent() {
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("employeeId") || "";
  const employeeName = searchParams.get("name") || "";

  const [historyData, setHistoryData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ totalSalaryPaid: 0, totalAdvancePaid: 0, totalPaid: 0, totalTransactions: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      let query = "/api/wages/payout-history";
      const params = new URLSearchParams();
      if (employeeId) params.set("employeeId", employeeId);
      if (searchQuery) params.set("search", searchQuery);
      if (params.toString()) query += `?${params.toString()}`;

      const res = await apiRequest<any>(query);
      setHistoryData(res?.history || []);
      setSummary(res?.summary || { totalSalaryPaid: 0, totalAdvancePaid: 0, totalPaid: 0, totalTransactions: 0 });
    } catch (err) {
      console.error("Failed to load payout history:", err);
      setHistoryData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [employeeId, searchQuery]);

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

  const filteredHistory = historyData.filter((item) => {
    if (typeFilter && item.payout_type !== typeFilter) return false;
    return true;
  });

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <Link href="/admin/wages" className="button secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
            <ArrowLeft size={16} />
            Back to Wages Summary
          </Link>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "var(--text)" }}>
            {employeeName ? `Payout History — ${employeeName}` : "Employee Payout History"}
          </h1>
          <p style={{ color: "var(--muted)", margin: "4px 0 0 0", fontSize: "14px" }}>
            Complete audit trail of all salary payouts and advance payments
          </p>
        </div>

        <button className="button secondary" type="button" onClick={fetchHistory} disabled={isLoading}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ padding: "20px", background: "white", borderRadius: "12px", border: "1px solid var(--line)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "13px", color: "#166534", fontWeight: 600, textTransform: "uppercase" }}>Total Salary Paid</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#15803d", marginTop: "6px" }}>
            {formatCurrency(summary.totalSalaryPaid || 0)}
          </div>
        </div>

        <div style={{ padding: "20px", background: "white", borderRadius: "12px", border: "1px solid var(--line)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "13px", color: "#1e40af", fontWeight: 600, textTransform: "uppercase" }}>Total Advance Paid</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#1d4ed8", marginTop: "6px" }}>
            {formatCurrency(summary.totalAdvancePaid || 0)}
          </div>
        </div>

        <div style={{ padding: "20px", background: "white", borderRadius: "12px", border: "1px solid var(--line)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "13px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>Total Net Payouts</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--text)", marginTop: "6px" }}>
            {formatCurrency(summary.totalPaid || 0)}
            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--muted)", marginLeft: "8px" }}>
              ({summary.totalTransactions || 0} transactions)
            </span>
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
                placeholder="Search by employee name, remarks, payment method..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-input"
              />
            </div>
          </div>

          <div className="filter-group-fixed">
            <label className="filter-label">Payout Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-select"
              style={{ minWidth: "200px" }}
            >
              <option value="">All Payout Types</option>
              <option value="salary">Salary Payouts Only</option>
              <option value="advance">Advance Pays Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid var(--line)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--muted)" }}>
            Loading payout history...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "var(--muted)" }}>
            No payout transactions found.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: "13px", textTransform: "uppercase" }}>Transaction Date & Time</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: "13px", textTransform: "uppercase" }}>Employee</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: "13px", textTransform: "uppercase" }}>Month</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: "13px", textTransform: "uppercase" }}>Payout Type</th>
                  <th style={{ padding: "14px 16px", textAlign: "right", fontWeight: 600, color: "var(--muted)", fontSize: "13px", textTransform: "uppercase" }}>Amount</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: "13px", textTransform: "uppercase" }}>Payment Method</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: "13px", textTransform: "uppercase" }}>Remarks / Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px", fontSize: "14px", fontWeight: 500 }}>
                      <div>{formatDate(item.payout_date)}</div>
                      <div style={{ fontSize: "12px", color: "var(--muted)" }}>{formatTimestamp(item.created_at)}</div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>
                      {item.employee_name}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: "var(--muted)", fontWeight: 500 }}>
                      {item.payout_month}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {item.payout_type === "advance" ? (
                        <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, color: "#1d4ed8", backgroundColor: "#dbeafe" }}>
                          Advance Salary
                        </span>
                      ) : (
                        <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, color: "#15803d", backgroundColor: "#dcfce7" }}>
                          Salary Payout
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "16px", fontWeight: 700, color: item.payout_type === "advance" ? "#2563eb" : "#16a34a" }}>
                      {formatCurrency(Number(item.amount || 0))}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", color: "var(--text)", background: "#f1f5f9", padding: "3px 8px", borderRadius: "4px" }}>
                        {item.payment_method}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: "var(--muted)" }}>
                      {item.remarks || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PayoutHistoryPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "60px", color: "var(--muted)" }}>Loading page...</div>}>
      <PayoutHistoryContent />
    </Suspense>
  );
}
