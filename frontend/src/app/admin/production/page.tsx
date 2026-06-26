"use client";

import { useEffect, useState, useMemo } from "react";
import Select from "react-select";
import { AdminShell } from "@/components/admin-shell";
import { RefreshCw, Save } from "lucide-react";
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

  const [categoryPath, setCategoryPath] = useState<number[]>([]);

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
      const [cats, prods, inv] = await Promise.all([
        apiRequest<Category[]>("/api/categories"),
        apiRequest<Product[]>("/api/products"),
        apiRequest<any[]>("/api/inventory")
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setProducts(Array.isArray(prods) ? prods : []);
      setInventory(Array.isArray(inv) ? inv : []);
      setStatus(`Loaded inventory records`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load records");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

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
      await loadData(); // refresh inventory table
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell>
      <div className="section-header">
        <div>
          <p className="eyebrow">Production Management</p>
          <h1>Plant and Seed Production Entry</h1>
        </div>
        <button className="button secondary" type="button" onClick={loadData} disabled={busy}>
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <form className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div className="form-grid">
            {dropdowns.map((options, idx) => (
              <label key={idx} className="field">
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

          <button className="button" type="button" onClick={submitForm} disabled={busy || !form.productId || !form.quantityProduced} style={{ marginTop: 16 }}>
            <Save size={17} />
            Save and Increase Stock
          </button>
        </div>
      </form>

      <div className="table-wrap">
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
                <td colSpan={3}>No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
