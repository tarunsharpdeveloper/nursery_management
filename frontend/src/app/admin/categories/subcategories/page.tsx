"use client";

import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, Plus, Power, PowerOff, RefreshCw, Tags, Trash2, ListTree, MoreVertical, ChevronDown } from "lucide-react";
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

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

function SubCategoriesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const parentId = Number(searchParams.get("id"));

  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState("Loading...");
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({ name: "", description: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [createPreview, setCreatePreview] = useState<string[]>([]);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [editPreview, setEditPreview] = useState<string[]>([]);
  const [openActionId, setOpenActionId] = useState<number | null>(null);

  const handleCreateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const urls = Array.from(e.target.files).map(f => URL.createObjectURL(f));
      setCreatePreview(urls);
    } else {
      setCreatePreview([]);
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const urls = Array.from(e.target.files).map(f => URL.createObjectURL(f));
      setEditPreview(urls);
    } else {
      setEditPreview([]);
    }
  };

  const parentCategory = useMemo(
    () => categories.find(c => c.id === parentId),
    [categories, parentId]
  );

  const subCategories = useMemo(
    () => categories.filter(c => c.parent_id === parentId).sort((a, b) => a.name.localeCompare(b.name)),
    [categories, parentId]
  );

  const breadcrumbs = useMemo(() => {
    const crumbs = [];
    let currentId: number | null = parentId;
    while (currentId) {
      const cat = categories.find(c => c.id === currentId);
      if (cat) {
        crumbs.unshift(cat);
        currentId = cat.parent_id;
      } else {
        break;
      }
    }
    return crumbs;
  }, [categories, parentId]);

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
      let photoUrls = null;
      if (fileInputRef.current?.files?.length) {
        const files = Array.from(fileInputRef.current.files);
        const base64s = await Promise.all(files.map(fileToBase64));
        photoUrls = JSON.stringify(base64s);
      }

      await apiRequest("/api/categories", {
        method: "POST",
        body: JSON.stringify({
          parentId,
          name: form.name,
          description: form.description,
          photoUrls
        })
      });
      setForm({ name: "", description: "" });
      setCreatePreview([]);
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
      let photoUrls = editing.photo_urls;
      if (editFileInputRef.current?.files?.length) {
        const files = Array.from(editFileInputRef.current.files);
        const base64s = await Promise.all(files.map(fileToBase64));
        photoUrls = JSON.stringify(base64s);
      }

      await apiRequest("/api/categories", {
        method: "PATCH",
        body: JSON.stringify({
          categoryId: editing.id,
          name: editForm.name,
          description: editForm.description,
          photoUrls
        })
      });
      setEditing(null);
      setEditPreview([]);
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
    setEditPreview([]);
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
          <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <Link href="/admin/categories" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#3b82f6", textDecoration: "none" }}>
              <ArrowLeft size={14} /> Product Categories
            </Link>
            {breadcrumbs.map(crumb => (
              <span key={crumb.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#94a3b8" }}>/</span>
                <Link href={`/admin/categories/subcategories?id=${crumb.id}`} style={{ color: crumb.id === parentId ? "inherit" : "#3b82f6", textDecoration: "none", pointerEvents: crumb.id === parentId ? "none" : "auto", fontWeight: crumb.id === parentId ? 600 : 400 }}>
                  {crumb.name}
                </Link>
              </span>
            ))}
          </div>
          <h1 style={{ marginTop: 0 }}>{parentCategory ? `Subcategories of ${parentCategory.name}` : "Loading..."}</h1>

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
              <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleCreateFileChange} />
            </label>
            {createPreview.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", gridColumn: "1 / -1" }}>
                {createPreview.map((url, i) => (
                  <img key={i} src={url} alt="preview" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)" }} />
                ))}
              </div>
            )}
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
          <div className="card-header" style={{ padding: 10, background: "rgba(59, 130, 246, 0.1)" }}>
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
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <span>Update Images (Replaces existing)</span>
                <input type="file" accept="image/*" multiple ref={editFileInputRef} onChange={handleEditFileChange} />
              </label>
            </div>
            {editPreview.length > 0 ? (
              <div style={{ marginTop: 16 }}>
                <span className="meta">New Image Preview:</span>
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  {editPreview.map((url, i) => (
                    <img key={i} src={url} alt="preview" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)" }} />
                  ))}
                </div>
              </div>
            ) : editing.photo_urls ? (
              <div style={{ marginTop: 16 }}>
                <span className="meta">Current Images:</span>
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  {(() => {
                    try {
                      const urls = JSON.parse(editing.photo_urls);
                      return (Array.isArray(urls) ? urls : [urls]).map((url, i) => (
                        <img key={i} src={url} alt="category" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)" }} />
                      ));
                    } catch {
                      return <img src={editing.photo_urls} alt="category" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)" }} />;
                    }
                  })()}
                </div>
              </div>
            ) : null}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button className="button" type="button" onClick={handleSaveEdit} disabled={busy || !editForm.name}>Save Changes</button>
              <button className="button secondary" type="button" onClick={() => { setEditing(null); setEditPreview([]); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* LIST */}
      <div className="card" style={{ overflow: "visible" }}>
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
                    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                      <button className="button secondary" type="button" title="Subcategories" onClick={() => router.push(`/admin/categories/subcategories?id=${c.id}`)} disabled={busy} style={{ padding: "6px" }}>
                        <ListTree size={16} color="#3b82f6" />
                      </button>
                      <button className="button secondary" type="button" title="Edit" onClick={() => startEdit(c)} disabled={busy} style={{ padding: "6px" }}>
                        <Edit2 size={16} />
                      </button>
                      <button className="button secondary" type="button" title="Delete" onClick={() => deleteCategory(c)} disabled={busy} style={{ padding: "6px" }}>
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                      <button className="button secondary" type="button" title={isActive(c) ? "Disable" : "Enable"} onClick={() => toggleCategory(c)} disabled={busy} style={{ padding: "6px" }}>
                        {isActive(c) ? <PowerOff size={16} /> : <Power size={16} />}
                      </button>
                    </div>
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
