"use client";

import { useEffect, useState, useMemo } from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { RefreshCw, Save, Trash2, Eye, MoreVertical, Plus, X, Search } from "lucide-react";
import { FormModal } from "@/components/form-modal";
import { apiRequest } from "@/lib/api";
import Link from "next/link";
import { ConfirmModal } from "@/components/confirm-modal";

type Customer = { id: number; name: string; phone?: string };
type Variant = { id: number; product_id: number; unit: string; unit_value: string; selling_price: number };
type Product = { id: number; name: string; selling_price: number; variants: Variant[] };

const selectStyles = {
  container: (base: any) => ({ ...base, width: '100%' }),
  control: (base: any, state: any) => ({
    ...base,
    minHeight: '50px',
    height: '50px',
    borderRadius: '8px',
    borderColor: state.isFocused ? '#2f6b3f' : '#d7e0d4',
    boxShadow: state.isFocused ? '0 0 0 1px #2f6b3f' : 'none',
    fontSize: '14px',
    fontFamily: 'inherit',
    '&:hover': {
      borderColor: state.isFocused ? '#2f6b3f' : '#a3b1a5'
    }
  }),
  valueContainer: (base: any) => ({
    ...base,
    height: '48px',
    padding: '0 12px',
  }),
  input: (base: any) => ({
    ...base,
    margin: '0px',
    padding: '0px',
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: '48px',
  }),
  placeholder: (base: any) => ({
    ...base,
    color: '#9ca3af',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  menu: (base: any) => ({
    ...base,
    zIndex: 9999
  }),
  menuList: (base: any) => ({
    ...base,
    maxHeight: '200px',
    overflowY: 'auto'
  }),
  option: (base: any) => ({
    ...base,
    fontSize: '14px',
  }),
  singleValue: (base: any) => ({
    ...base,
    fontSize: '14px',
  })
};

export default function BillingPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Loading...");
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [dropdownDirection, setDropdownDirection] = useState<"up" | "down">("down");
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterValue, setFilterValue] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterValue]);

  const [form, setForm] = useState({
    customerId: null as number | null,
    customerName: "",
    customerPhone: "",
    billType: "cash_sale",
    paymentType: "cash",
    transactionId: "",
    productId: null as number | null,
    variantId: null as number | null,
    quantity: "",
    unitPrice: ""
  });

  async function loadData() {
    setBusy(true);
    try {
      const searchParams = new URLSearchParams({ page: String(currentPage), limit: "10" });
      if (debouncedSearch) searchParams.set("search", debouncedSearch);
      if (filterValue) {
        searchParams.set("filterKey", "bill_type");
        searchParams.set("filterValue", filterValue);
      }

      const [custs, prods, b] = await Promise.all([
        apiRequest<Customer[]>("/api/customers"),
        apiRequest<Product[]>("/api/products"),
        apiRequest<any>(`/api/admin/data-list?model=bills&${searchParams.toString()}`)
      ]);
      setCustomers(Array.isArray(custs) ? custs : []);
      setProducts(Array.isArray(prods) ? prods : []);
      setBills(b && b.data && Array.isArray(b.data) ? b.data : (Array.isArray(b) ? b : []));
      setTotalPages(b?.totalPages || 1);
      setStatus("Ready");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load data");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { loadData(); }, [currentPage, debouncedSearch, filterValue]);

  const customerOptions = useMemo(() => customers.map(c => ({ value: c.id, label: c.name, customer: c })), [customers]);
  const productOptions = useMemo(() => products.map(p => ({ value: p.id, label: p.name, product: p })), [products]);

  const selectedProduct = useMemo(() => products.find(p => p.id === form.productId), [products, form.productId]);
  const variantOptions = useMemo(() => {
    if (!selectedProduct || !selectedProduct.variants) return [];
    return selectedProduct.variants.map(v => ({ value: v.id, label: `${v.unit_value} ${v.unit} - ₹${v.selling_price}`, variant: v }));
  }, [selectedProduct]);

  useEffect(() => {
    if (!selectedProduct) {
      setForm(f => ({ ...f, unitPrice: "" }));
      return;
    }

    let price = selectedProduct.selling_price;
    if (form.variantId) {
      const variant = selectedProduct.variants.find(v => v.id === form.variantId);
      if (variant) price = variant.selling_price;
    }

    setForm(f => ({ ...f, unitPrice: String(price) }));
  }, [form.productId, form.variantId, selectedProduct]);

  const totalAmount = (Number(form.quantity) || 0) * (Number(form.unitPrice) || 0);

  async function submitForm() {
    if (!form.customerName) {
      setStatus("Validation Error: Please select or create a Customer Name.");
      return;
    }
    if (!form.productId) {
      setStatus("Validation Error: Please select a Product.");
      return;
    }
    if (!form.quantity) {
      setStatus("Validation Error: Please enter a Quantity.");
      return;
    }
    if (!form.unitPrice) {
      setStatus("Validation Error: Unit Price cannot be empty.");
      return;
    }

    setBusy(true);
    try {
      await apiRequest("/api/billing", {
        method: "POST",
        body: JSON.stringify({
          customerId: form.customerId,
          customer: form.customerId ? undefined : { name: form.customerName, phone: form.customerPhone },
          billType: form.billType,
          paymentType: form.paymentType,
          transactionId: form.paymentType === "upi" ? form.transactionId : undefined,
          items: [{
            productId: form.productId,
            variantId: form.variantId || undefined,
            quantity: Number(form.quantity),
            unitPrice: Number(form.unitPrice)
          }]
        })
      });
      setStatus("Bill generated successfully");
      setForm({
        customerId: null,
        customerName: "",
        customerPhone: "",
        billType: "cash_sale",
        paymentType: "cash",
        transactionId: "",
        productId: null,
        variantId: null,
        quantity: "",
        unitPrice: ""
      });
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save bill");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="section-header">
        <div>
          {/* <p className="eyebrow">Offline Billing</p> */}
          <h1>Cash Sale and Credit Sale</h1>
          {/* <p className="meta" style={{ color: status.includes("Error") ? "#d32f2f" : undefined }}>{status}</p> */}
        </div>
        <button className="button" type="button" onClick={() => setIsModalOpen(true)} disabled={busy}>
          <Plus size={17} />
          Create Bill
        </button>
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Bill"
        maxWidth={700}
        footer={
          <>
            <button className="button secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="button" type="button" onClick={submitForm} disabled={busy}>
              <Save size={16} style={{ marginRight: 6 }} />
              Generate Bill
            </button>
          </>
        }
      >
        <form className="card-body" style={{ padding: 0 }}>
          <div className="form-grid">
            <label className="field">
              <span>Customer Name</span>
              <CreatableSelect
                isClearable
                options={customerOptions}
                placeholder="Search or enter new name"
                styles={selectStyles}
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                menuPosition="fixed"
                value={form.customerId ? customerOptions.find(o => o.value === form.customerId) : form.customerName ? { label: form.customerName, value: "new" } : null}
                onChange={(option: any) => {
                  if (!option) {
                    setForm(f => ({ ...f, customerId: null, customerName: "", customerPhone: "" }));
                  } else if (option.__isNew__ || typeof option.value === 'string') {
                    setForm(f => ({ ...f, customerId: null, customerName: option.label, customerPhone: "" }));
                  } else {
                    setForm(f => ({ ...f, customerId: option.value, customerName: option.label, customerPhone: option.customer?.phone || "" }));
                  }
                }}
              />
            </label>

            <label className="field">
              <span>Customer Phone (Optional)</span>
              <input
                type="text"
                placeholder="Phone number"
                value={form.customerPhone}
                onChange={(e) => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                readOnly={!!form.customerId}
              />
            </label>

            <label className="field">
              <span>Bill Type</span>
              <select value={form.billType} onChange={(e) => setForm(f => ({ ...f, billType: e.target.value as any }))}>
                <option value="cash_sale">Cash Sale</option>
                <option value="credit_sale">Credit Sale</option>
              </select>
            </label>

            <label className="field">
              <span>Payment Type</span>
              <select value={form.paymentType} onChange={(e) => setForm(f => ({ ...f, paymentType: e.target.value as any }))}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
              </select>
            </label>

            {form.paymentType === "upi" && (
              <label className="field">
                <span>Transaction ID / Ref Number (Optional)</span>
                <input
                  type="text"
                  placeholder="e.g. 123456789"
                  value={form.transactionId}
                  onChange={(e) => setForm(f => ({ ...f, transactionId: e.target.value }))}
                />
              </label>
            )}
          </div>

          <hr style={{ margin: "20px 0", borderTop: "1px solid #e4e4e7", borderBottom: "none", borderLeft: "none", borderRight: "none" }} />

          <h5 style={{ margin: "0 0 16px 0", fontSize: "1rem" }}>Bill Item</h5>
          <div className="form-grid">
            <label className="field">
              <span>Product</span>
              <Select
                isClearable
                options={productOptions}
                placeholder="Select product"
                styles={selectStyles}
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                menuPosition="fixed"
                value={productOptions.find(o => o.value === form.productId) || null}
                onChange={(option: any) => setForm(f => ({ ...f, productId: option ? option.value : null, variantId: null }))}
              />
            </label>

            {variantOptions.length > 0 && (
              <label className="field">
                <span>Variant</span>
                <Select
                  isClearable
                  options={variantOptions}
                  placeholder="Select variant (optional)"
                  styles={selectStyles}
                  menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                  menuPosition="fixed"
                  value={variantOptions.find(o => o.value === form.variantId) || null}
                  onChange={(option: any) => setForm(f => ({ ...f, variantId: option ? option.value : null }))}
                />
              </label>
            )}

            <label className="field">
              <span>Quantity</span>
              <input
                type="number"
                min="1"
                placeholder="Qty"
                value={form.quantity}
                onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))}
              />
            </label>

            <label className="field">
              <span>Unit Price (₹)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Auto-calculated"
                value={form.unitPrice}
                onChange={(e) => setForm(f => ({ ...f, unitPrice: e.target.value }))}
              />
            </label>
          </div>

          <div style={{ marginTop: 16, padding: "12px 16px", background: "#f4f4f5", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e4e4e7" }}>
            <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#52525b" }}>Total Amount:</span>
            <span style={{ fontSize: "1rem", fontWeight: "bold", color: "#16a34a" }}>₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        </form>
      </FormModal>

      <div className="filter-bar-container">
        <div className="filter-bar-wrapper">
          <div className="filter-group">
            <label className="filter-label">Search</label>
            <div className="filter-input-wrapper">
              <div className="filter-input-icon">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search bill number, customer, transaction..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-input"
              />
            </div>
          </div>
          
          <div className="filter-group-fixed">
            <label className="filter-label">Bill Type</label>
            <select
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="filter-select"
            >
              <option value="">All</option>
              <option value="cash_sale">Cash Sale</option>
              <option value="credit_sale">Credit Sale</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-wrap" style={{ position: "relative" }}>
        {busy && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.6)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <RefreshCw size={24} className="spin" color="#3b82f6" />
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th>Bill Number</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Payment</th>
              <th>Transaction ID</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bills.length ? bills.map((row, index) => (
              <tr key={row.id || index}>
                <td>{row.bill_number}</td>
                <td>{row.customer || "-"}</td>
                <td>{row.bill_type === "credit_sale" ? "Credit" : "Cash"}</td>
                <td>{row.payment_type?.toUpperCase()}</td>
                <td>{row.transaction_id || "-"}</td>
                <td>₹{Number(row.total_amount).toLocaleString("en-IN")}</td>
                <td>₹{Number(row.paid_amount).toLocaleString("en-IN")}</td>
                <td>₹{Number(row.balance_amount).toLocaleString("en-IN")}</td>
                <td>{row.bill_date ? new Date(row.bill_date).toLocaleDateString("en-IN") : "-"}</td>
                <td>
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
                      disabled={busy} 
                      style={{ padding: "6px" }}
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
                            href={`/admin/billing/view?id=${row.id}`}
                            className="button secondary actions-dropdown-item" 
                            title="View Bill" 
                          >
                            <Eye size={16} color="#3b82f6" style={{ marginRight: 8 }} />
                            View
                          </Link>
                          <button 
                            className="button secondary actions-dropdown-item danger" 
                            type="button"
                            title="Delete Bill"
                            onClick={() => {
                              setOpenActionId(null);
                              setConfirmState({
                                isOpen: true,
                                title: "Delete Bill",
                                message: `Are you sure you want to delete bill ${row.bill_number}?`,
                                action: async () => {
                                  setBusy(true);
                                  try {
                                    await apiRequest("/api/bills/delete", {
                                      method: "POST",
                                      body: JSON.stringify({ billId: row.id })
                                    });
                                    loadData();
                                  } catch (e) {
                                    alert("Failed to delete bill");
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
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: "32px 16px", color: "var(--muted)" }}>No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "white", borderTop: "1px solid #e2e8f0", borderBottomLeftRadius: 8, borderBottomRightRadius: 8, marginTop: -1, marginBottom: 24 }}>
        <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>Page {currentPage} of {totalPages}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="button secondary" style={{ padding: "6px 12px", height: "auto" }} disabled={currentPage <= 1 || busy} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Previous</button>
          <button className="button secondary" style={{ padding: "6px 12px", height: "auto" }} disabled={currentPage >= totalPages || busy} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Next</button>
        </div>
      </div>
      
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
