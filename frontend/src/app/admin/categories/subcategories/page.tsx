"use client";

import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit2, Plus, Power, PowerOff, RefreshCw, Tags, Trash2, ListTree } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { apiRequest } from "@/lib/api";

type Category = {
  id: number;
  parent_id: number | null;
  name: string;
  description: string | null;
  photo_urls: string | null;
  is_active: number | boolean;
  product_count: number;
};

function isActive(c: Category) {
  return Boolean(c.is_active);
}

function SubCategoriesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const parentId = Number(searchParams.get("id"));

  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState("Loading...");
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({ name: "", description: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });

  const parentCategory = useMemo(
    () => categories.find(c => c.id === parentId),
    [categories, parentId]
  );

  const subCategories = useMemo(
    () => categories.filter(c => c.parent_id === parentId).sort((a, b) => a.name.localeCompare(b.name)),
    [categories, parentId]
  );

  async function loadCategories() {
    setBusy(true);
    try {
      const data = await apiRequest<Category[]>("/api/categories");
      setCategories(Array.isArray(data) ? data : []);
      setStatus(`Loaded successfully`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load categories");
      setCategories([]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (parentId) loadCategories();
  }, [parentId]);

  async function handleCreate() {
    if (!form.name || !parentId) return;
    setBusy(true);
    try {
      await apiRequest("/api/categories", {
        method: "POST",
        body: JSON.stringify({
          parentId,
          name: form.name,
          description: form.description
        })
      });
      setForm({ name: "", description: "" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      setStatus("Sub-category saved");
      await loadCategories();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to create");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdit() {
    if (!editing || !editForm.name) return;
    setBusy(true);
    try {
      await apiRequest("/api/categories", {
        method: "PATCH",
        body: JSON.stringify({
          categoryId: editing.id,
          name: editForm.name,
          description: editForm.description
        })
      });
      setEditing(null);
      setStatus("Sub-category updated");
      await loadCategories();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setBusy(false);
    }
  }

  async function toggleCategory(category: Category) {
    setBusy(true);
    try {
      await apiRequest("/api/categories/toggle", {
        method: "PATCH",
        body: JSON.stringify({ categoryId: category.id, isActive: !isActive(category) })
      });
      setStatus(`${category.name} ${isActive(category) ? "deactivated" : "activated"}`);
      await loadCategories();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to toggle");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCategory(category: Category) {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return;
    setBusy(true);
    try {
      await apiRequest("/api/categories/delete", {
        method: "POST",
        body: JSON.stringify({ categoryId: category.id })
      });
      setStatus(`${category.name} deleted`);
      await loadCategories();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to delete";
      if (msg.includes("Cannot delete category")) {
        alert("Do not delete this category; it is in use.");
      }
      setStatus(msg);
    } finally {
      setBusy(false);
    }
  }

  function startEdit(c: Category) {
    setEditing(c);
    setEditForm({
      name: c.name,
      description: c.description || ""
    });
  }

  if (!parentId) {
    return (
      <AdminShell>
        <div className="section-header">
          <div>
            <p className="eyebrow">Error</p>
            <h1>Invalid Category ID</h1>
          </div>
          <button className="button secondary" onClick={() => router.push("/admin/categories")}>Go Back</button>
        </div>
      </AdminShell>
    );
  }

  if (!parentCategory && !busy && categories.length > 0) {
    return (
      <AdminShell>
        <div className="section-header">
          <div>
            <p className="eyebrow">Error</p>
            <h1>Category not found</h1>
          </div>
          <button className="button secondary" onClick={() => router.push("/admin/categories")}>Go Back</button>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="section-header">
        <div>
          <p className="eyebrow">
            <button
              onClick={() => router.push("/admin/categories")}
              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, padding: 0 }}
            >
              <ArrowLeft size={14} /> Back to Categories
            </button>
          </p>
          <h1>{parentCategory ? `Subcategories of ${parentCategory.name}` : "Loading..."}</h1>
          <p className="meta">{status}</p>
        </div>
        <button className="button secondary" type="button" onClick={loadCategories} disabled={busy}>
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* CREATE FORM */}
      <div className="card" style={{ marginBottom: 30 }}>
        <div className="card-body">
          <div className="form-grid">
            <label className="field">
              <span>Sub-Category Name <span style={{ color: "red" }}>*</span></span>
              <input value={form.name} onChange={e => setForm(c => ({ ...c, name: e.target.value }))} placeholder="E.g. Indoor Plants" />
            </label>
            <label className="field">
              <span>Description</span>
              <input value={form.description} onChange={e => setForm(c => ({ ...c, description: e.target.value }))} placeholder="Optional details" />
            </label>
            <label className="field">
              <span>Images (Multiple)</span>
              <input type="file" accept="image/*" multiple ref={fileInputRef} />
            </label>
          </div>
          <button className="button" type="button" onClick={handleCreate} disabled={busy || !form.name} style={{ marginTop: 16 }}>
            <Plus size={17} />
            Add Sub-Category
          </button>
        </div>
      </div>

      {/* EDIT MODAL/INLINE FORM */}
      {editing && (
        <div className="card" style={{ marginBottom: 30, border: "2px solid #3b82f6" }}>
          <div className="card-header" style={{padding: 10, background: "rgba(59, 130, 246, 0.1)" }}>
            <strong>Editing: {editing.name}</strong>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <label className="field">
                <span>Name</span>
                <input value={editForm.name} onChange={e => setEditForm(c => ({ ...c, name: e.target.value }))} />
              </label>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <span>Description</span>
                <input value={editForm.description} onChange={e => setEditForm(c => ({ ...c, description: e.target.value }))} />
              </label>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button className="button" type="button" onClick={handleSaveEdit} disabled={busy || !editForm.name}>Save Changes</button>
              <button className="button secondary" type="button" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* LIST */}
      <div className="card">
        {/* <div className="card-header">
          <Tags size={18} />
          <strong>{parentCategory ? `${parentCategory.name} Sub-Categories` : "Sub-Categories"}</strong>
        </div> */}
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>S.No.</th>
                <th>Name</th>
                <th>Products</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20 }} className="meta">No sub-categories found</td>
                </tr>
              ) : null}
              {subCategories.map((c, index) => (
                <tr key={c.id}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{c.name}</strong>
                    {c.description ? <p className="meta" style={{ margin: "4px 0 0" }}>{c.description}</p> : null}
                  </td>
                  <td>
                    <span className="meta">{c.product_count} products</span>
                  </td>
                  <td>
                    <span className={`status-badge ${isActive(c) ? "status-paid" : "status-failed"}`}>
                      {isActive(c) ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="button secondary" type="button" onClick={() => router.push(`/admin/categories/subcategories?id=${c.id}`)} disabled={busy} style={{ padding: "4px 8px", fontSize: 13, marginRight: 8, borderColor: "#3b82f6", color: "#3b82f6" }}>
                      <ListTree size={14} />
                      Subcategories
                    </button>
                    <button className="button secondary" type="button" onClick={() => startEdit(c)} disabled={busy} style={{ padding: "4px 8px", fontSize: 13, marginRight: 8 }}>
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button className="button secondary" type="button" onClick={() => deleteCategory(c)} disabled={busy} style={{ padding: "4px 8px", fontSize: 13, marginRight: 8, color: "#ef4444" }}>
                      <Trash2 size={14} />
                      Delete
                    </button>
                    <button className="button secondary" type="button" onClick={() => toggleCategory(c)} disabled={busy} style={{ padding: "4px 8px", fontSize: 13 }}>
                      {isActive(c) ? <PowerOff size={14} /> : <Power size={14} />}
                      {isActive(c) ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

export default function AdminSubCategoriesPage() {
  return (
    <Suspense fallback={<AdminShell><div className="section-header"><h1>Loading...</h1></div></AdminShell>}>
      <SubCategoriesContent />
    </Suspense>
  );
}
