"use client";

import { useEffect, useState, useMemo } from "react";
import Select from "react-select";
import { RefreshCw, Save, Plus, X, Search } from "lucide-react";
import { FormModal } from "@/components/form-modal";
import { apiRequest } from "@/lib/api";

type Category = {
  id: number;
  parent_id: number | null;
  name: string;
  is_active?: number | boolean;
};

type Product = {
  id: number;
  category_id: number;
  name: string;
};

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
    padding: '0 11px',
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
  })
};

export default function ProductionPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Loading...");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [categoryPath, setCategoryPath] = useState<number[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const [form, setForm] = useState({
    productId: "",
    productionType: "plant",
    productionDate: new Date().toISOString().slice(0, 10),
    quantityProduced: "",
    remarks: ""
  });

  async function loadData() {
    setBusy(true);
    try {
      const searchParams = new URLSearchParams({ page: String(currentPage), limit: "10" });
      if (debouncedSearch) searchParams.set("search", debouncedSearch);

      const [cats, prods, inv] = await Promise.all([
        apiRequest<Category[]>("/api/categories"),
        apiRequest<Product[]>("/api/products"),
        apiRequest<any>(`/api/admin/data-list?model=inventory&${searchParams.toString()}`)
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setProducts(Array.isArray(prods) ? prods : []);
      setInventory(inv && inv.data && Array.isArray(inv.data) ? inv.data : (Array.isArray(inv) ? inv : []));
      setTotalPages(inv?.totalPages || 1);
      setStatus(`Loaded inventory records`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load records");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [currentPage, debouncedSearch]);

  const activeCategories = useMemo(() => categories.filter(c => c.is_active !== 0 && c.is_active !== false), [categories]);

  const dropdowns = useMemo(() => {
    const list = [];

    const l0 = activeCategories.filter(c => !c.parent_id).sort((a, b) => a.name.localeCompare(b.name));
    if (l0.length > 0) list.push(l0);

    for (const selectedId of categoryPath) {
      if (!selectedId) break;
      const children = activeCategories.filter(c => c.parent_id === selectedId).sort((a, b) => a.name.localeCompare(b.name));
      if (children.length > 0) {
        list.push(children);
      } else {
        break;
      }
    }
    return list;
  }, [activeCategories, categoryPath]);

  const filteredProducts = useMemo(() => {
    const targetCategoryId = categoryPath.length > 0 ? categoryPath[categoryPath.length - 1] : null;
    if (!targetCategoryId) return products;
    return products.filter(p => p.category_id === Number(targetCategoryId));
  }, [products, categoryPath]);

  async function submitForm() {
    if (!form.productId || !form.quantityProduced || !form.productionDate) {
      setStatus("Please fill in the required fields (Product, Date, Quantity)");
      return;
    }

    setBusy(true);
    try {
      await apiRequest("/api/production", {
        method: "POST",
        body: JSON.stringify({
          categoryId: categoryPath[0] || undefined,
          subCategoryId: categoryPath[1] || undefined,
          subSubCategoryId: categoryPath[2] || undefined,
          productId: Number(form.productId),
          productionType: form.productionType,
          productionDate: form.productionDate,
          quantityProduced: Number(form.quantityProduced),
          remarks: form.remarks
        })
      });
      setStatus("Saved successfully");
      setForm(f => ({ ...f, quantityProduced: "", remarks: "" })); // keep category/product selected for quick entry
      setIsModalOpen(false);
      await loadData(); // refresh inventory table
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="section-header">
        <div>
          {/* <p className="eyebrow">Production Management</p> */}
          <h1>Plant and Seed Production Entry</h1>
        </div>
        <button className="button" type="button" onClick={() => setIsModalOpen(true)} disabled={busy}>
          <Plus size={17} />
          Add Production
        </button>
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Production Entry"
        maxWidth={800}
        footer={
          <>
            <button className="button secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="button" type="button" onClick={submitForm} disabled={busy || !form.productId || !form.quantityProduced}>
              <Save size={17} />
              Save and Increase Stock
            </button>
          </>
        }
      >
        <form className="card-body" style={{ padding: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
            {dropdowns.map((options, idx) => (
              <label key={idx} className="field" style={{ width: 230 }}>
                <span>{idx === 0 ? "Category" : idx === 1 ? "Subcategory" : `Level ${idx + 1} Subcategory`}</span>
                <select
                  value={categoryPath[idx] || ""}
                  onChange={e => {
                    const val = Number(e.target.value);
                    if (!val) {
                      setCategoryPath(categoryPath.slice(0, idx));
                    } else {
                      const newPath = categoryPath.slice(0, idx);
                      newPath.push(val);
                      setCategoryPath(newPath);
                    }
                    setForm(f => ({ ...f, productId: "" })); // clear product selection when category changes
                  }}
                >
                  <option value="">{`Select ${idx === 0 ? "Category" : "Subcategory"}`}</option>
                  {options.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            ))}
          </div>

          <div className="form-grid">

            <label className="field">
              <span>Product</span>
              <Select
                options={filteredProducts.map(p => ({ value: String(p.id), label: p.name }))}
                value={form.productId ? { value: form.productId, label: filteredProducts.find(p => String(p.id) === form.productId)?.name } : null}
                onChange={(option: any) => setForm(f => ({ ...f, productId: option ? option.value : "" }))}
                isClearable
                placeholder="Select Product"
                styles={selectStyles}
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                menuPosition="fixed"
              />
            </label>

            <label className="field">
              <span>Date</span>
              <input
                type="date"
                value={form.productionDate}
                onChange={e => setForm(f => ({ ...f, productionDate: e.target.value }))}
                required
              />
            </label>

            <label className="field">
              <span>Quantity Produced</span>
              <input
                type="number"
                value={form.quantityProduced}
                onChange={e => setForm(f => ({ ...f, quantityProduced: e.target.value }))}
                required
              />
            </label>

            <label className="field">
              <span>Remarks (Optional)</span>
              <input
                type="text"
                placeholder="Enter any remarks..."
                value={form.remarks}
                onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
              />
            </label>
          </div>
        </form>
      </FormModal>

      <div className="filter-bar-container">
        <div className="filter-bar-wrapper">
          <div className="filter-group">
            <label className="filter-label">Search Inventory</label>
            <div className="filter-input-wrapper">
              <div className="filter-input-icon">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-input"
              />
            </div>
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
              <th>Product</th>
              <th>Available Stock</th>
              <th>Sold</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length ? inventory.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.available_quantity?.toLocaleString("en-IN") || "-"}</td>
                <td>{row.sold_quantity?.toLocaleString("en-IN") || "0"}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: "32px 16px", color: "var(--muted)" }}>No records found</td>
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
    </>
  );
}
