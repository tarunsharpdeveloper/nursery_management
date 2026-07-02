"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { Save, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/api";
import Link from "next/link";

type Customer = { id: number; name: string; phone?: string; email?: string; address?: string };
type Variant = { id: number; unit: string; unit_value: string; selling_price: number };
type Product = { id: number; name: string; selling_price: number; variants?: Variant[] };

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

export default function CreateOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [customer, setCustomer] = useState({
    customerId: null as number | null,
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: ""
  });

  const [items, setItems] = useState([{
    id: Date.now(),
    productId: null as number | null,
    variantId: null as number | null,
    quantity: "",
    unitPrice: ""
  }]);

  async function loadData() {
    setBusy(true);
    try {
      const [custs, prods] = await Promise.all([
        apiRequest<Customer[]>("/api/customers"),
        apiRequest<Product[]>("/api/products")
      ]);
      setCustomers(Array.isArray(custs) ? custs : []);
      setProducts(Array.isArray(prods) ? prods : []);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load data");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const customerOptions = useMemo(() => customers.map(c => ({ value: c.id, label: c.name, customer: c })), [customers]);
  const productOptions = useMemo(() => products.map(p => ({ value: p.id, label: p.name, product: p })), [products]);

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "productId") {
      const selectedProduct = products.find(p => p.id === value);
      newItems[index].variantId = null;
      newItems[index].unitPrice = selectedProduct ? String(selectedProduct.selling_price) : "";
    } else if (field === "variantId") {
      const selectedProduct = products.find(p => p.id === newItems[index].productId);
      if (selectedProduct && selectedProduct.variants) {
        const variant = selectedProduct.variants.find(v => v.id === value);
        if (variant) {
          newItems[index].unitPrice = String(variant.selling_price);
        }
      }
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), productId: null, variantId: null, quantity: "", unitPrice: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);

  async function submitForm() {
    const newErrors: Record<string, string> = {};
    
    if (!customer.customerName) newErrors.customerName = "Please select or create a Customer Name.";
    if (!customer.customerPhone) newErrors.customerPhone = "Please enter a Customer Phone.";
    if (!customer.customerEmail) newErrors.customerEmail = "Please enter a Customer Email.";
    if (!customer.customerAddress) newErrors.customerAddress = "Please enter a Customer Address.";
    
    items.forEach((it, idx) => {
      if (!it.productId) newErrors[`product_${idx}`] = "Please select a Product.";
      if (!it.quantity) newErrors[`quantity_${idx}`] = "Please enter a Quantity.";
      if (!it.unitPrice) newErrors[`unitPrice_${idx}`] = "Unit Price cannot be empty.";
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setStatus("Please fix the validation errors below.");
      return;
    }
    
    setErrors({});
    setBusy(true);
    setStatus("Saving order...");
    
    try {
      await apiRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          customer: { 
            name: customer.customerName, 
            phone: customer.customerPhone, 
            email: customer.customerEmail, 
            address: customer.customerAddress 
          },
          items: items.map(it => ({
            productId: it.productId,
            variantId: it.variantId || undefined,
            quantity: Number(it.quantity),
            unitPrice: Number(it.unitPrice)
          }))
        })
      });
      router.push("/admin/orders");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save order");
      setBusy(false);
    }
  }

  const ErrorText = ({ children }: { children: React.ReactNode }) => (
    <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', display: 'block', fontWeight: 400 }}>
      {children}
    </span>
  );

  return (
    <>
      <div className="section-header">
        <div>
          {/* <p className="eyebrow">Online Order Management</p> */}
          <h1>Create Order</h1>
          <p className="meta" style={{ color: status.includes("Error") || status.includes("error") ? "#d32f2f" : undefined }}>{status}</p>
        </div>
        <Link href="/admin/orders" className="button secondary">
          <ArrowLeft size={17} />
          Back to Orders
        </Link>
      </div>

      <form className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <h3 style={{ fontSize: "1.1rem", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid #e4e4e7" }}>Customer Details</h3>
          <div className="form-grid">
            <label className="field" style={{ position: "relative" }}>
              <span>Customer Name <span style={{ color: '#ef4444' }}>*</span></span>
              <CreatableSelect
                isClearable
                options={customerOptions}
                placeholder="Search or enter new name"
                styles={selectStyles}
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                menuPosition="fixed"
                value={customer.customerId ? customerOptions.find(o => o.value === customer.customerId) : customer.customerName ? { label: customer.customerName, value: "new" } : null}
                onChange={(option: any) => {
                  if (!option) {
                    setCustomer({ customerId: null, customerName: "", customerPhone: "", customerEmail: "", customerAddress: "" });
                  } else if (option.__isNew__ || typeof option.value === 'string') {
                    setCustomer({ customerId: null, customerName: option.label, customerPhone: "", customerEmail: "", customerAddress: "" });
                  } else {
                    setCustomer({ 
                      customerId: option.value, 
                      customerName: option.label, 
                      customerPhone: option.customer?.phone || "",
                      customerEmail: option.customer?.email || "",
                      customerAddress: option.customer?.address || ""
                    });
                  }
                  if (errors.customerName) setErrors(e => ({ ...e, customerName: "" }));
                }}
              />
              {errors.customerName && <ErrorText>{errors.customerName}</ErrorText>}
            </label>

            <label className="field" style={{ position: "relative" }}>
              <span>Mobile Number <span style={{ color: '#ef4444' }}>*</span></span>
              <input
                type="text"
                placeholder="Enter phone number"
                value={customer.customerPhone}
                onChange={(e) => {
                  setCustomer(f => ({ ...f, customerPhone: e.target.value }));
                  if (errors.customerPhone) setErrors(err => ({ ...err, customerPhone: "" }));
                }}
                style={{ borderColor: errors.customerPhone ? '#ef4444' : undefined }}
              />
              {errors.customerPhone && <ErrorText>{errors.customerPhone}</ErrorText>}
            </label>

            <label className="field" style={{ position: "relative" }}>
              <span>Email Address <span style={{ color: '#ef4444' }}>*</span></span>
              <input
                type="email"
                placeholder="Enter email address"
                value={customer.customerEmail}
                onChange={(e) => {
                  setCustomer(f => ({ ...f, customerEmail: e.target.value }));
                  if (errors.customerEmail) setErrors(err => ({ ...err, customerEmail: "" }));
                }}
                style={{ borderColor: errors.customerEmail ? '#ef4444' : undefined }}
              />
              {errors.customerEmail && <ErrorText>{errors.customerEmail}</ErrorText>}
            </label>

            <label className="field" style={{ gridColumn: "1 / -1", position: "relative" }}>
              <span>Address <span style={{ color: '#ef4444' }}>*</span></span>
              <textarea
                placeholder="Enter complete shipping address"
                rows={2}
                value={customer.customerAddress}
                onChange={(e) => {
                  setCustomer(f => ({ ...f, customerAddress: e.target.value }));
                  if (errors.customerAddress) setErrors(err => ({ ...err, customerAddress: "" }));
                }}
                style={{ borderColor: errors.customerAddress ? '#ef4444' : undefined }}
              />
              {errors.customerAddress && <ErrorText>{errors.customerAddress}</ErrorText>}
            </label>
          </div>

          <h3 style={{ fontSize: "1.1rem", marginBottom: "16px", marginTop: "30px", paddingBottom: "10px", borderBottom: "1px solid #e4e4e7" }}>Order Items</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {items.map((item, index) => {
              const selectedProduct = products.find(p => p.id === item.productId);
              const variantOptions = selectedProduct && selectedProduct.variants 
                ? selectedProduct.variants.map(v => ({ value: v.id, label: `${v.unit_value} ${v.unit} - ₹${v.selling_price}` }))
                : [];

              return (
                <div key={item.id} style={{ padding: "16px", backgroundColor: "#fafafa", borderRadius: "8px", border: "1px solid #e4e4e7", position: "relative" }}>
                  {items.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeItem(index)}
                      style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
                      title="Remove Item"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  
                  <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr", rowGap: "16px" }}>
                    <label className="field" style={{ position: "relative" }}>
                      <span>Product <span style={{ color: '#ef4444' }}>*</span></span>
                      <Select
                        isClearable
                        options={productOptions}
                        placeholder="Select product"
                        styles={selectStyles}
                        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                        menuPosition="fixed"
                        value={productOptions.find(o => o.value === item.productId) || null}
                        onChange={(option: any) => {
                          updateItem(index, "productId", option ? option.value : null);
                          if (errors[`product_${index}`]) setErrors(e => ({ ...e, [`product_${index}`]: "" }));
                        }}
                      />
                      {errors[`product_${index}`] && <ErrorText>{errors[`product_${index}`]}</ErrorText>}
                    </label>

                    <label className="field" style={{ position: "relative" }}>
                      <span>Variant (Optional)</span>
                      <Select
                        isClearable
                        options={variantOptions}
                        placeholder={variantOptions.length > 0 ? "Select variant" : "No variants available"}
                        styles={selectStyles}
                        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                        menuPosition="fixed"
                        value={variantOptions.find(o => o.value === item.variantId) || null}
                        onChange={(option: any) => updateItem(index, "variantId", option ? option.value : null)}
                        isDisabled={variantOptions.length === 0}
                      />
                    </label>

                    <label className="field" style={{ position: "relative" }}>
                      <span>Quantity <span style={{ color: '#ef4444' }}>*</span></span>
                      <input
                        type="number"
                        min="1"
                        placeholder="Enter quantity"
                        value={item.quantity}
                        onChange={(e) => {
                          updateItem(index, "quantity", e.target.value);
                          if (errors[`quantity_${index}`]) setErrors(err => ({ ...err, [`quantity_${index}`]: "" }));
                        }}
                        style={{ borderColor: errors[`quantity_${index}`] ? '#ef4444' : undefined }}
                      />
                      {errors[`quantity_${index}`] && <ErrorText>{errors[`quantity_${index}`]}</ErrorText>}
                    </label>

                    <label className="field" style={{ position: "relative" }}>
                      <span>Unit Price (₹) <span style={{ color: '#ef4444' }}>*</span></span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Auto-calculated"
                        value={item.unitPrice}
                        onChange={(e) => {
                          updateItem(index, "unitPrice", e.target.value);
                          if (errors[`unitPrice_${index}`]) setErrors(err => ({ ...err, [`unitPrice_${index}`]: "" }));
                        }}
                        style={{ borderColor: errors[`unitPrice_${index}`] ? '#ef4444' : undefined }}
                      />
                      {errors[`unitPrice_${index}`] && <ErrorText>{errors[`unitPrice_${index}`]}</ErrorText>}
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 16 }}>
            <button className="button secondary" type="button" onClick={addItem}>
              <Plus size={16} style={{ marginRight: 6 }} />
              Add Another Product
            </button>
          </div>

          <div style={{ marginTop: 24, padding: "16px 20px", background: "#f4f4f5", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e4e4e7" }}>
            <span style={{ fontSize: "1rem", fontWeight: 600, color: "#52525b" }}>Total Order Amount:</span>
            <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#16a34a" }}>₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>

          <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
            <button className="button" type="button" onClick={submitForm} disabled={busy} style={{ fontSize: "1.05rem", padding: "12px 24px" }}>
              <Save size={18} style={{ marginRight: 8 }} />
              Create Order
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
