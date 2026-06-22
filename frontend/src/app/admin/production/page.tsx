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
};

type Product = {
  id: number;
  category_id: number;
  name: string;
};

export default function ProductionPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Loading...");

  const [form, setForm] = useState({
    categoryId: "",
    subCategoryId: "",
    subSubCategoryId: "",
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

  const topLevelCats = useMemo(() => categories.filter(c => !c.parent_id), [categories]);
  
  const subCats = useMemo(() => {
    if (!form.categoryId) return [];
    return categories.filter(c => c.parent_id === Number(form.categoryId));
  }, [categories, form.categoryId]);

  const subSubCats = useMemo(() => {
    if (!form.subCategoryId) return [];
    return categories.filter(c => c.parent_id === Number(form.subCategoryId));
  }, [categories, form.subCategoryId]);

  const filteredProducts = useMemo(() => {
    let targetCategoryId = form.subSubCategoryId || form.subCategoryId || form.categoryId;
    if (!targetCategoryId) return products;
    return products.filter(p => p.category_id === Number(targetCategoryId));
  }, [products, form.categoryId, form.subCategoryId, form.subSubCategoryId]);

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
          categoryId: form.categoryId ? Number(form.categoryId) : undefined,
          subCategoryId: form.subCategoryId ? Number(form.subCategoryId) : undefined,
          subSubCategoryId: form.subSubCategoryId ? Number(form.subSubCategoryId) : undefined,
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
          <p className="meta">{status}</p>
        </div>
        <button className="button secondary" type="button" onClick={loadData} disabled={busy}>
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <form className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div className="form-grid">
            <label className="field">
              <span>Category</span>
              <select 
                value={form.categoryId} 
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value, subCategoryId: "", subSubCategoryId: "", productId: "" }))}
              >
                <option value="">Select Category</option>
                {topLevelCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>

            <label className="field">
              <span>Subcategory</span>
              <select 
                value={form.subCategoryId} 
                onChange={e => setForm(f => ({ ...f, subCategoryId: e.target.value, subSubCategoryId: "", productId: "" }))}
                disabled={!form.categoryId || subCats.length === 0}
              >
                <option value="">Select Subcategory</option>
                {subCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>

            <label className="field">
              <span>Sub-Subcategory</span>
              <select 
                value={form.subSubCategoryId} 
                onChange={e => setForm(f => ({ ...f, subSubCategoryId: e.target.value, productId: "" }))}
                disabled={!form.subCategoryId || subSubCats.length === 0}
              >
                <option value="">Select Sub-Subcategory</option>
                {subSubCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>

            <label className="field">
              <span>Product</span>
              <Select 
                options={filteredProducts.map(p => ({ value: String(p.id), label: p.name }))}
                value={form.productId ? { value: form.productId, label: filteredProducts.find(p => String(p.id) === form.productId)?.name } : null}
                onChange={(option: any) => setForm(f => ({ ...f, productId: option ? option.value : "" }))}
                isClearable
                placeholder="Select Product"
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
              <span>Remarks</span>
              <textarea 
                rows={3}
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
