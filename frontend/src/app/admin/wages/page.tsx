"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AdminModule } from "@/components/admin-module";
import { FormModal } from "@/components/form-modal";
import { apiRequest } from "@/lib/api";
import { CreditCard, History, DollarSign, Calendar, Save, MoreVertical } from "lucide-react";

export default function WagesPage() {
  const router = useRouter();
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [wageMonth, setWageMonth] = useState<string>(currentMonthStr);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [employeesList, setEmployeesList] = useState<any[]>([]);

  // 3-Dots Dropdown Menu State
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Payout Modal State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isFixedEmployee, setIsFixedEmployee] = useState(false);
  const [fixedEmployeeName, setFixedEmployeeName] = useState("");
  const [payoutEmployeeId, setPayoutEmployeeId] = useState<string>("");
  const [payoutType, setPayoutType] = useState<"salary" | "advance">("salary");
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [payoutMethod, setPayoutMethod] = useState<string>("cash");
  const [payoutDate, setPayoutDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [payoutRemarks, setPayoutRemarks] = useState<string>("");
  const [payoutBusy, setPayoutBusy] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [payoutSuccess, setPayoutSuccess] = useState("");

  const loadEmployeesForPayout = async () => {
    try {
      const data = await apiRequest<any[]>(`/api/wages/summary?month=${wageMonth}`);
      setEmployeesList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load employee wage list:", err);
    }
  };

  useEffect(() => {
    loadEmployeesForPayout();
  }, [wageMonth, reloadKey]);

  const openPayoutModal = (empId?: number | string, type: "salary" | "advance" = "salary", empName?: string, suggestedAmount?: number) => {
    setPayoutError("");
    setPayoutSuccess("");
    loadEmployeesForPayout();

    setPayoutType(type);
    setPayoutDate(new Date().toISOString().slice(0, 10));
    setPayoutMethod("cash");
    setPayoutRemarks("");

    if (empId) {
      setIsFixedEmployee(true);
      setFixedEmployeeName(empName || "");
      const strId = String(empId);
      setPayoutEmployeeId(strId);
      if (suggestedAmount !== undefined && suggestedAmount > 0) {
        setPayoutAmount(String(suggestedAmount));
      } else {
        setPayoutAmount("");
      }
    } else {
      setIsFixedEmployee(false);
      setFixedEmployeeName("");
      setPayoutEmployeeId("");
      setPayoutAmount("");
    }

    setIsPayoutModalOpen(true);
  };

  const handleEmployeeSelectChange = (id: string) => {
    setPayoutEmployeeId(id);
    setPayoutError("");
    if (!id) {
      setPayoutAmount("");
      return;
    }
    const found = employeesList.find((e) => String(e.id) === String(id));
    if (found) {
      if (payoutType === "salary" && Number(found.payable_amount) > 0) {
        setPayoutAmount(String(found.payable_amount));
      } else {
        setPayoutAmount("");
      }
    }
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutEmployeeId) {
      setPayoutError("Please select an employee");
      return;
    }
    const numAmt = Number(payoutAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setPayoutError("Please enter a valid payout amount");
      return;
    }

    setPayoutBusy(true);
    setPayoutError("");
    setPayoutSuccess("");

    try {
      const res = await apiRequest<any>("/api/wages/payout", {
        method: "POST",
        body: JSON.stringify({
          employeeId: Number(payoutEmployeeId),
          payoutMonth: wageMonth,
          payoutType: payoutType,
          amount: numAmt,
          paymentMethod: payoutMethod,
          payoutDate: payoutDate,
          remarks: payoutRemarks
        })
      });

      setPayoutSuccess(res?.message || "Payout recorded successfully!");
      setReloadKey((prev) => prev + 1);
      setTimeout(() => {
        setIsPayoutModalOpen(false);
        setPayoutSuccess("");
      }, 1200);
    } catch (err: any) {
      setPayoutError(err.message || "Failed to record payout");
    } finally {
      setPayoutBusy(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2
    }).format(amount);
  };

  const selectedEmployeeInfo = employeesList.find((e) => String(e.id) === String(payoutEmployeeId));

  return (
    <>
      <AdminModule
        eyebrow="Payroll & Wages"
        title="Monthly & Daily Wage Payouts"
        listPath={`/api/wages/summary?month=${wageMonth}&t=${reloadKey}`}
        headerActions={
          <button className="button" type="button" onClick={() => openPayoutModal()}>
            <CreditCard size={17} />
            Record Payout
          </button>
        }
        columns={[
          { key: "name", label: "Employee" },
          { key: "employee_type", label: "Type" },
          { key: "days_worked", label: "Days Worked" },
          { key: "absent_days", label: "Absent" },
          { key: "gross_payable", label: "Gross Payable" },
          { key: "advance_paid", label: "Advance Paid" },
          { key: "salary_paid", label: "Salary Paid" },
          { key: "payable_amount", label: "Net Payable" },
          { key: "payout_status", label: "Status" },
          { key: "actions", label: "Actions" }
        ]}
        filterConfig={{
          key: "employee_type",
          label: "Employee Type",
          options: [
            { value: "daily_wage", label: "Daily Wage" },
            { value: "monthly_salary", label: "Monthly Salary" }
          ]
        }}
        filterExtra={
          <>
            <label className="filter-label">Wage Month</label>
            <input
              type="month"
              value={wageMonth}
              onChange={(e) => setWageMonth(e.target.value)}
              className="filter-select"
              style={{ padding: "6px 12px", fontSize: "14px", height: "42px" }}
            />
          </>
        }
        renderCell={(row, column) => {
          if (column.key === "name") {
            return (
              <button
                onClick={() => router.push(`/admin/wages/history?employeeId=${row.id}&name=${encodeURIComponent(row.name)}`)}
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
                title="Click to view full payout history page"
              >
                {row.name}
              </button>
            );
          }

          if (column.key === "employee_type") {
            return row.employee_type === "monthly_salary" ? "Monthly" : "Daily";
          }

          if (column.key === "gross_payable") {
            return formatCurrency(Number(row.gross_payable || row.payable_amount || 0));
          }

          if (column.key === "advance_paid") {
            const adv = Number(row.advance_paid || 0);
            return adv > 0 ? (
              <span style={{ color: "#2563eb", fontWeight: 600, background: "#dbeafe", padding: "2px 8px", borderRadius: "6px", fontSize: "13px" }}>
                {formatCurrency(adv)}
              </span>
            ) : (
              "-"
            );
          }

          if (column.key === "salary_paid") {
            const sal = Number(row.salary_paid || 0);
            return sal > 0 ? (
              <span style={{ color: "#16a34a", fontWeight: 600, background: "#dcfce7", padding: "2px 8px", borderRadius: "6px", fontSize: "13px" }}>
                {formatCurrency(sal)}
              </span>
            ) : (
              "-"
            );
          }

          if (column.key === "payable_amount") {
            const net = Number(row.payable_amount || 0);
            return (
              <span style={{ fontWeight: 700, color: net > 0 ? "#ef4444" : "#16a34a" }}>
                {formatCurrency(net)}
              </span>
            );
          }

          if (column.key === "payout_status") {
            const st = row.payout_status || "pending";
            if (st === "paid") {
              return (
                <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>
                  Paid
                </span>
              );
            } else if (st === "partial") {
              return (
                <span style={{ background: "#dbeafe", color: "#1e40af", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>
                  Partially Paid
                </span>
              );
            } else {
              return (
                <span style={{ background: "#fef3c7", color: "#b45309", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>
                  Pending
                </span>
              );
            }
          }

          if (column.key === "actions") {
            return (
              <div style={{ position: "relative" }}>
                <button
                  className="button secondary"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (openActionId === row.id) {
                      setOpenActionId(null);
                    } else {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const dropdownWidth = 170;
                      let top = rect.bottom + 4;
                      let left = rect.right - dropdownWidth;

                      if (left < 10) left = 10;
                      if (left + dropdownWidth > window.innerWidth) left = window.innerWidth - dropdownWidth - 10;

                      setDropdownPosition({ top, left });
                      setOpenActionId(row.id);
                    }
                  }}
                  style={{ padding: "6px 8px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                  title="Actions menu"
                >
                  <MoreVertical size={16} />
                </button>

                {openActionId === row.id && typeof document !== "undefined" && createPortal(
                  <>
                    <div
                      className="actions-dropdown-overlay"
                      onClick={(e) => { e.stopPropagation(); setOpenActionId(null); }}
                    />
                    <div
                      className="actions-dropdown-menu direction-down"
                      style={{
                        position: "fixed",
                        top: dropdownPosition.top + "px",
                        left: dropdownPosition.left + "px",
                        zIndex: 10001,
                        minWidth: "175px",
                        width: "max-content",
                        whiteSpace: "nowrap",
                        padding: "6px"
                      }}
                    >
                      <button
                        className="button secondary actions-dropdown-item"
                        type="button"
                        onClick={() => {
                          setOpenActionId(null);
                          openPayoutModal(row.id, "salary", row.name, Number(row.payable_amount));
                        }}
                        style={{ display: "flex", alignItems: "center", width: "100%", whiteSpace: "nowrap", padding: "8px 12px", textAlign: "left" }}
                      >
                        <DollarSign size={16} color="#16a34a" style={{ marginRight: 10, flexShrink: 0 }} />
                        <span>Pay Salary</span>
                      </button>
                      <button
                        className="button secondary actions-dropdown-item"
                        type="button"
                        onClick={() => {
                          setOpenActionId(null);
                          openPayoutModal(row.id, "advance", row.name);
                        }}
                        style={{ display: "flex", alignItems: "center", width: "100%", whiteSpace: "nowrap", padding: "8px 12px", textAlign: "left" }}
                      >
                        <CreditCard size={16} color="#2563eb" style={{ marginRight: 10, flexShrink: 0 }} />
                        <span>Pay Advance</span>
                      </button>
                      <button
                        className="button secondary actions-dropdown-item"
                        type="button"
                        onClick={() => {
                          setOpenActionId(null);
                          router.push(`/admin/wages/history?employeeId=${row.id}&name=${encodeURIComponent(row.name)}`);
                        }}
                        style={{ display: "flex", alignItems: "center", width: "100%", whiteSpace: "nowrap", padding: "8px 12px", textAlign: "left" }}
                      >
                        <History size={16} color="#64748b" style={{ marginRight: 10, flexShrink: 0 }} />
                        <span>Payout History</span>
                      </button>
                    </div>
                  </>,
                  document.body
                )}
              </div>
            );
          }

          return null;
        }}
      />

      {/* Record Payout Modal */}
      <FormModal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        title={
          isFixedEmployee
            ? `${payoutType === "advance" ? "Pay Advance" : "Pay Salary"} - ${fixedEmployeeName || selectedEmployeeInfo?.name || ""}`
            : "Record Employee Payout"
        }
        maxWidth={600}
        footer={
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", width: "100%" }}>
            <button className="button secondary" type="button" onClick={() => setIsPayoutModalOpen(false)}>
              Cancel
            </button>
            <button
              className="button"
              type="button"
              onClick={handlePayoutSubmit}
              disabled={payoutBusy || !payoutEmployeeId || !payoutAmount || Number(payoutAmount) <= 0}
            >
              <Save size={17} />
              {payoutBusy ? "Recording..." : `Record ${payoutType === "advance" ? "Advance" : "Salary"}`}
            </button>
          </div>
        }
      >
        <form onSubmit={handlePayoutSubmit} className="card-body" style={{ padding: 0 }}>
          {payoutError && (
            <div style={{ padding: "10px 14px", background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: "6px", fontSize: "14px", marginBottom: "16px" }}>
              {payoutError}
            </div>
          )}
          {payoutSuccess && (
            <div style={{ padding: "10px 14px", background: "#dcfce7", border: "1px solid #86efac", color: "#15803d", borderRadius: "6px", fontSize: "14px", marginBottom: "16px" }}>
              {payoutSuccess}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {!isFixedEmployee ? (
              <label className="field" style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600, marginBottom: "4px" }}>
                  Select Employee <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <select
                  value={payoutEmployeeId}
                  onChange={(e) => handleEmployeeSelectChange(e.target.value)}
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--line)" }}
                >
                  <option value="">-- Choose Employee --</option>
                  {employeesList.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} (Net Payable: ₹{Number(e.payable_amount || 0).toLocaleString("en-IN")})
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div style={{ padding: "14px 18px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>Employee</div>
                  <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text)", marginTop: "2px" }}>
                    {fixedEmployeeName || selectedEmployeeInfo?.name || "Selected Employee"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>Net Payable</div>
                  <div style={{ fontWeight: 700, fontSize: "17px", color: Number(selectedEmployeeInfo?.payable_amount || 0) > 0 ? "#ef4444" : "#16a34a", marginTop: "2px" }}>
                    {formatCurrency(Number(selectedEmployeeInfo?.payable_amount || 0))}
                  </div>
                </div>
              </div>
            )}

            {selectedEmployeeInfo && (
              <div style={{ padding: "12px 16px", background: "#f1f5f9", borderRadius: "8px", border: "1px solid #cbd5e1", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600 }}>Gross Payable</div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text)" }}>{formatCurrency(Number(selectedEmployeeInfo.gross_payable || 0))}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600 }}>Advance Paid</div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#2563eb" }}>{formatCurrency(Number(selectedEmployeeInfo.advance_paid || 0))}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600 }}>Salary Paid</div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#16a34a" }}>{formatCurrency(Number(selectedEmployeeInfo.salary_paid || 0))}</div>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label className="field" style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600, marginBottom: "4px" }}>
                  Payout Type <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <select
                  value={payoutType}
                  onChange={(e) => setPayoutType(e.target.value as "salary" | "advance")}
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--line)" }}
                >
                  <option value="salary">Regular Salary Payout</option>
                  <option value="advance">Advance Pay</option>
                </select>
              </label>

              <label className="field" style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600, marginBottom: "4px" }}>
                  Payout Month <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="month"
                  value={wageMonth}
                  disabled
                  style={{ padding: "9px 10px", borderRadius: "8px", border: "1px solid var(--line)", background: "#f8fafc" }}
                />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label className="field" style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600, marginBottom: "4px" }}>
                  Amount (₹) <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Enter payout amount"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                />
              </label>

              <label className="field" style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600, marginBottom: "4px" }}>
                  Payment Method <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--line)" }}
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label className="field" style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600, marginBottom: "4px" }}>Payout Date</span>
                <input
                  type="date"
                  value={payoutDate}
                  onChange={(e) => setPayoutDate(e.target.value)}
                />
              </label>

              <label className="field" style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600, marginBottom: "4px" }}>Remarks / Notes</span>
                <input
                  type="text"
                  placeholder="e.g. August Salary paid by cash"
                  value={payoutRemarks}
                  onChange={(e) => setPayoutRemarks(e.target.value)}
                />
              </label>
            </div>
          </div>
        </form>
      </FormModal>
    </>
  );
}
