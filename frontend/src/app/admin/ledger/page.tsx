"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminModule } from "@/components/admin-module";
import { FormModal } from "@/components/form-modal";
import { apiRequest } from "@/lib/api";
import { CreditCard, Save } from "lucide-react";

export default function LedgerPage() {
  const router = useRouter();
  const [reloadKey, setReloadKey] = useState(0);

  // Pay Outstanding Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isFixedCustomer, setIsFixedCustomer] = useState(false);
  const [fixedCustomerName, setFixedCustomerName] = useState("");
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [payCustomerId, setPayCustomerId] = useState<string>("");
  const [payAmount, setPayAmount] = useState<string>("");
  const [payMethod, setPayMethod] = useState<string>("cash");
  const [payRemarks, setPayRemarks] = useState<string>("");
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState("");

  const loadCustomersForPayModal = async () => {
    try {
      const data = await apiRequest<any[]>("/api/customer-ledger");
      setCustomersList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load customer ledger list:", err);
    }
  };

  const openPayModal = (customerId?: number | string, outstandingAmt?: number, customerName?: string) => {
    setPayError("");
    setPaySuccess("");
    loadCustomersForPayModal();
    if (customerId) {
      setIsFixedCustomer(true);
      setFixedCustomerName(customerName || "");
      const strId = String(customerId);
      setPayCustomerId(strId);
      setPayAmount(outstandingAmt !== undefined && outstandingAmt > 0 ? String(outstandingAmt) : "");
    } else {
      setIsFixedCustomer(false);
      setFixedCustomerName("");
      setPayCustomerId("");
      setPayAmount("");
    }
    setPayMethod("cash");
    setPayRemarks("");
    setIsPayModalOpen(true);
  };

  const handleCustomerSelectChange = (id: string) => {
    setPayCustomerId(id);
    setPayError("");
    if (!id) {
      setPayAmount("");
      return;
    }
    const found = customersList.find((c) => String(c.customer_id) === String(id));
    if (found && Number(found.outstanding_amount) > 0) {
      setPayAmount(String(found.outstanding_amount));
    } else {
      setPayAmount("");
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payCustomerId) {
      setPayError("Please select a customer");
      return;
    }
    const numAmt = Number(payAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setPayError("Please enter a valid payment amount");
      return;
    }

    setPayBusy(true);
    setPayError("");
    setPaySuccess("");

    try {
      const res = await apiRequest<any>("/api/customer-ledger/pay", {
        method: "POST",
        body: JSON.stringify({
          customerId: Number(payCustomerId),
          amount: numAmt,
          paymentMethod: payMethod,
          remarks: payRemarks
        })
      });

      setPaySuccess(res?.message || "Payment recorded successfully!");
      setReloadKey((prev) => prev + 1);
      setTimeout(() => {
        setIsPayModalOpen(false);
        setPaySuccess("");
      }, 1200);
    } catch (err: any) {
      setPayError(err.message || "Failed to record payment");
    } finally {
      setPayBusy(false);
    }
  };

  const selectedCustomerInfo = customersList.find((c) => String(c.customer_id) === String(payCustomerId));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2
    }).format(amount);
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

  return (
    <>
      <AdminModule
        eyebrow="Customer Ledger"
        title="Credit Customer Outstanding"
        listPath={`/api/customer-ledger?t=${reloadKey}`}
        headerActions={
          <button className="button" type="button" onClick={() => openPayModal()}>
            <CreditCard size={17} />
            Pay Outstanding Amount
          </button>
        }
        columns={[
          { key: "customer", label: "Customer" },
          { key: "total_purchase", label: "Total Purchase" },
          { key: "amount_paid", label: "Amount Paid" },
          { key: "outstanding_amount", label: "Outstanding" },
          { key: "actions", label: "Action" }
        ]}
        renderCell={(row, column) => {
          if (column.key === "customer") {
            return (
              <button
                onClick={() => router.push(`/admin/ledger/details?customerId=${row.customer_id}&name=${encodeURIComponent(row.customer)}`)}
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
                title="Click to view dedicated ledger details page"
              >
                {row.customer}
              </button>
            );
          }
          if (column.key === "outstanding_amount") {
            return renderBalanceBadge(Number(row.outstanding_amount || 0));
          }
          if (column.key === "actions") {
            return (
              <button
                className="button secondary"
                type="button"
                style={{ padding: "4px 10px", fontSize: "13px" }}
                onClick={() => openPayModal(row.customer_id, Number(row.outstanding_amount), row.customer)}
              >
                Pay
              </button>
            );
          }
          return null;
        }}
      />

      {/* Pay Outstanding Modal */}
      <FormModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={isFixedCustomer ? `Pay Outstanding - ${fixedCustomerName || selectedCustomerInfo?.customer || ""}` : "Pay Customer Outstanding Amount"}
        maxWidth={600}
        footer={
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", width: "100%" }}>
            <button className="button secondary" type="button" onClick={() => setIsPayModalOpen(false)}>
              Cancel
            </button>
            <button
              className="button"
              type="button"
              onClick={handlePaySubmit}
              disabled={payBusy || !payCustomerId || !payAmount || Number(payAmount) <= 0}
            >
              <Save size={17} />
              {payBusy ? "Recording..." : "Record Payment"}
            </button>
          </div>
        }
      >
        <form onSubmit={handlePaySubmit} className="card-body" style={{ padding: 0 }}>
          {payError && (
            <div style={{ padding: "10px 14px", background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: "6px", fontSize: "14px", marginBottom: "16px" }}>
              {payError}
            </div>
          )}
          {paySuccess && (
            <div style={{ padding: "10px 14px", background: "#dcfce7", border: "1px solid #86efac", color: "#15803d", borderRadius: "6px", fontSize: "14px", marginBottom: "16px" }}>
              {paySuccess}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {!isFixedCustomer ? (
              <label className="field" style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600, marginBottom: "4px" }}>
                  Select Customer <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <select
                  value={payCustomerId}
                  onChange={(e) => handleCustomerSelectChange(e.target.value)}
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--line)" }}
                >
                  <option value="">-- Choose Customer --</option>
                  {customersList.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.customer} ({Number(c.outstanding_amount || 0) > 0 ? `Due: ₹${Number(c.outstanding_amount).toLocaleString("en-IN")}` : Number(c.outstanding_amount || 0) < 0 ? `Advance: ₹${Math.abs(Number(c.outstanding_amount)).toLocaleString("en-IN")}` : "Settled"})
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div style={{ padding: "14px 18px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>Customer</div>
                  <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text)", marginTop: "2px" }}>
                    {fixedCustomerName || selectedCustomerInfo?.customer || "Selected Customer"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>Outstanding Balance</div>
                  <div style={{ marginTop: "2px" }}>
                    {renderBalanceBadge(Number(selectedCustomerInfo?.outstanding_amount || payAmount || 0))}
                  </div>
                </div>
              </div>
            )}

            {!isFixedCustomer && selectedCustomerInfo && (
              <div style={{ padding: "12px 16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "13px", color: "var(--muted)" }}>Customer Name</div>
                  <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--text)" }}>{selectedCustomerInfo.customer}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "13px", color: "var(--muted)" }}>Current Outstanding</div>
                  <div style={{ marginTop: "2px" }}>
                    {renderBalanceBadge(Number(selectedCustomerInfo.outstanding_amount || 0))}
                  </div>
                </div>
              </div>
            )}

            <label className="field" style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 600, marginBottom: "4px" }}>
                Payment Amount (₹) <span style={{ color: "#ef4444" }}>*</span>
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Enter amount to pay"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </label>

            <label className="field" style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 600, marginBottom: "4px" }}>
                Payment Method <span style={{ color: "#ef4444" }}>*</span>
              </span>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--line)" }}
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="net_banking">Net Banking</option>
              </select>
            </label>

            <label className="field" style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 600, marginBottom: "4px" }}>Remarks / Notes</span>
              <input
                type="text"
                placeholder="e.g. Received cash payment, Receipt #102"
                value={payRemarks}
                onChange={(e) => setPayRemarks(e.target.value)}
              />
            </label>
          </div>
        </form>
      </FormModal>
    </>
  );
}
