"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Plus, Power, PowerOff, RefreshCw, Tags, Trash2, ListTree, MoreVertical, ChevronDown, X, Search } from "lucide-react";
import { FormModal } from "@/components/form-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { apiRequest } from "@/lib/api";

type Category = {
  category_type: string;
  id: number;
  parent_id: number | null;
  name: string;
  description: string | null;
  photo_urls: string | null;
  is_active: number | boolean;
  child_count: number;
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

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState("Loading categories...");
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({ name: "", description: "", categoryType: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [createPreview, setCreatePreview] = useState<string[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [dropdownDirection, setDropdownDirection] = useState<"up" | "down">("down");
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    isDestructive: boolean;
    confirmText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: async () => {},
    isDestructive: false
  });

  const handleCreateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const urls = Array.from(e.target.files).map(f => URL.createObjectURL(f));
      setCreatePreview(urls);
    } else {
      setCreatePreview([]);
    }
  };



  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryTypeFilter, setCategoryTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryTypeFilter]);

  async function loadCategories() {
    setBusy(true);
    try {
      const searchParams = new URLSearchParams({ page: String(currentPage), limit: "10" });
      if (debouncedSearch) searchParams.set("search", debouncedSearch);
      if (categoryTypeFilter) searchParams.set("filterValue", categoryTypeFilter);

      const data = await apiRequest<any>(`/api/categories?${searchParams.toString()}`);
      const allCategories = data && data.data && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      
      // Only keep top-level categories
      const topLevel = allCategories.filter((c: any) => !c.parent_id).sort((a: any, b: any) => a.name.localeCompare(b.name));
      setCategories(topLevel);
      setTotalPages(data?.totalPages || 1);
      setStatus("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load categories");
      setCategories([]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, [currentPage, debouncedSearch, categoryTypeFilter]);

  async function handleCreate() {
    if (!form.name) return;
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
          name: form.name,
          description: form.description,
          categoryType: form.categoryType || undefined,
          photoUrls
        })
      });
      setForm({ name: "", description: "", categoryType: "" });
      setCreatePreview([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsModalOpen(false);
      setStatus("Category saved");
      await loadCategories();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to create");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdit() {
    if (!editing || !form.name) return;
    setBusy(true);
    try {
      let photoUrls = editing.photo_urls;
      if (fileInputRef.current?.files?.length) {
        const files = Array.from(fileInputRef.current.files);
        const base64s = await Promise.all(files.map(fileToBase64));
        photoUrls = JSON.stringify(base64s);
      }

      await apiRequest("/api/categories", {
        method: "PATCH",
        body: JSON.stringify({
          categoryId: editing.id,
          name: form.name,
          description: form.description,
          categoryType: form.categoryType || undefined,
          photoUrls
        })
      });
      setEditing(null);
      setForm({ name: "", description: "", categoryType: "" });
      setCreatePreview([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsModalOpen(false);
      setStatus("Category updated");
      await loadCategories();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setBusy(false);
    }
  }

  function requestToggle(category: Category) {
    const active = isActive(category);
    setConfirmState({
      isOpen: true,
      title: active ? "Disable Category" : "Enable Category",
      message: `Are you sure you want to ${active ? "disable" : "enable"} "${category.name}"?`,
      confirmText: active ? "Disable" : "Enable",
      isDestructive: active,
      action: async () => {
        setBusy(true);
        try {
          await apiRequest("/api/categories/toggle", {
            method: "PATCH",
            body: JSON.stringify({ categoryId: category.id, isActive: !active })
          });
          setStatus(`${category.name} ${active ? "deactivated" : "activated"}`);
          await loadCategories();
        } catch (error) {
          setStatus(error instanceof Error ? error.message : "Failed to toggle");
        } finally {
          setBusy(false);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  }

  function requestDelete(category: Category) {
    setConfirmState({
      isOpen: true,
      title: "Delete Category",
      message: `Are you sure you want to delete "${category.name}"?`,
      confirmText: "Delete",
      isDestructive: true,
      action: async () => {
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
            setStatus("Error: Do not delete this category; it is in use.");
          } else {
            setStatus(msg);
          }
        } finally {
          setBusy(false);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  }

  function startEdit(c: Category) {
    setEditing(c);
    setCreatePreview([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setForm({
      name: c.name,
      description: c.description || "",
      categoryType: c.category_type || ""
    });
    setIsModalOpen(true);
  }

  function closeForm() {
    setIsModalOpen(false);
    setEditing(null);
    setForm({ name: "", description: "", categoryType: "" });
    setCreatePreview([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <>
      <div className="section-header">
        <div>
          {/* <p className="eyebrow">Product Category Management</p> */}
          <h1>Product Categories</h1>
        </div>
        <button className="button" type="button" onClick={() => { setEditing(null); setForm({ name: "", description: "", categoryType: "" }); setCreatePreview([]); setIsModalOpen(true); }} disabled={busy}>
          <Plus size={17} />
          Add Category
        </button>
      </div>

      <div className="filter-bar-container" style={{ marginBottom: 20 }}>
        <div className="filter-bar-wrapper">
          <div className="filter-group">
            <label className="filter-label">Search</label>
            <div className="filter-input-wrapper">
              <div className="filter-input-icon">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search category name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-input"
              />
            </div>
          </div>
          
          <div className="filter-group-fixed">
            <label className="filter-label">Category Type</label>
            <select
              value={categoryTypeFilter}
              onChange={(e) => setCategoryTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="plant">Plant</option>
              <option value="seed">Seed</option>
            </select>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeForm}
        title={editing ? `Editing: ${editing.name}` : "Add Category"}
        maxWidth={800}
        footer={
          editing ? (
            <>
              <button className="button secondary" type="button" onClick={closeForm}>Cancel</button>
              <button className="button" type="button" onClick={handleSaveEdit} disabled={busy || !form.name}>Save Changes</button>
            </>
          ) : (
            <button className="button" type="button" onClick={handleCreate} disabled={busy || !form.name}>
              <Plus size={17} style={{ marginRight: 4 }} />
              Save Category
            </button>
          )
        }
      >
        <div className="card-body" style={{ padding: 0 }}>
          <div className="form-grid">
            <label className="field">
              <span>Category Name <span style={{ color: "red" }}>*</span></span>
              <input value={form.name} onChange={e => setForm(c => ({ ...c, name: e.target.value }))} placeholder="E.g. Plants" />
            </label>
            <label className="field">
              <span>Category Type</span>
              <select value={form.categoryType} onChange={e => setForm(c => ({ ...c, categoryType: e.target.value }))}>
                <option value="">None</option>
                <option value="plant">Plant</option>
                <option value="seed">Seed</option>
              </select>
            </label>
            <label className="field">
              <span>Description</span>
              <input value={form.description} onChange={e => setForm(c => ({ ...c, description: e.target.value }))} placeholder="Optional details" />
            </label>
            <label className="field">
              <span>{editing ? "Update Image (Replaces existing)" : "Image"}</span>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleCreateFileChange} />
            </label>
            
            {createPreview.length > 0 ? (
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", gridColumn: "1 / -1" }}>
                <div style={{ width: "100%" }}><span className="meta">{editing ? "New Image Preview:" : "Preview:"}</span></div>
                {createPreview.map((url, i) => (
                  <img key={i} src={url} alt="preview" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)" }} />
                ))}
              </div>
            ) : editing && editing.photo_urls ? (
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", gridColumn: "1 / -1" }}>
                <div style={{ width: "100%" }}><span className="meta">Current Image:</span></div>
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
            ) : null}
          </div>
        </div>
      </FormModal>

      {/* LIST */}
      <div className="card" style={{ overflow: "visible" }}>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>S.No.</th>
                <th>Name</th>
                <th>Stats</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20 }} className="meta">No categories found</td>
                </tr>
              ) : null}
              {categories.map((c, index) => (
                <tr key={c.id}>
                  <td>{index + 1}</td>
                  <td style={{ textTransform: "capitalize" }}>
                    <strong>{c.name}</strong>
                    {c.description ? <p className="meta" style={{ margin: "4px 0 0" }}>{c.description}</p> : null}
                  </td>
                  <td style={{ textTransform: "capitalize" }}>
                    <span className="meta">{c.product_count} products | {c.child_count} subcategories</span>
                  </td>
                  <td>
                    <span className={`status-badge ${isActive(c) ? "status-paid" : "status-failed"}`}>
                      {isActive(c) ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <div className="actions-dropdown-wrapper">
                      <button 
                        className="button secondary" 
                        type="button" 
                        title="Actions"
                        onClick={(e) => {
                          if (openActionId === c.id) {
                            setOpenActionId(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const spaceBelow = window.innerHeight - rect.bottom;
                            setDropdownDirection(spaceBelow < 200 ? "up" : "down");
                            setOpenActionId(c.id);
                          }
                        }}
                        disabled={busy} 
                        style={{ padding: "6px" }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {openActionId === c.id && (
                        <>
                          <div 
                            className="actions-dropdown-overlay" 
                            onClick={(e) => { e.stopPropagation(); setOpenActionId(null); }} 
                          />
                          <div className={`actions-dropdown-menu direction-${dropdownDirection}`}>
                            <button 
                              className="button secondary actions-dropdown-item" 
                              type="button" 
                              onClick={() => { setOpenActionId(null); router.push(`/admin/categories/subcategories?id=${c.id}`); }} 
                              disabled={busy}
                            >
                              <ListTree size={16} color="#3b82f6" style={{ marginRight: 8 }} />
                              Subcategories
                            </button>
                            <button 
                              className="button secondary actions-dropdown-item" 
                              type="button" 
                              onClick={() => { setOpenActionId(null); startEdit(c); }} 
                              disabled={busy}
                            >
                              <Edit2 size={16} style={{ marginRight: 8 }} />
                              Edit
                            </button>
                            <button type="button" className="button secondary actions-dropdown-item"
                              onClick={() => { setOpenActionId(null); requestToggle(c); }} 
                              title={isActive(c) ? "Disable" : "Enable"}>
                              {isActive(c) ? <PowerOff size={16} style={{ marginRight: 8 }} /> : <Power size={16} style={{ marginRight: 8 }} />}
                              {isActive(c) ? "Disable" : "Enable"}
                            </button>
                            <button type="button" className="button secondary actions-dropdown-item danger"
                              onClick={() => { setOpenActionId(null); requestDelete(c); }} 
                              title="Delete">
                              <Trash2 size={16} color="#ef4444" style={{ marginRight: 8 }} />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        confirmText={confirmState.confirmText}
        isDestructive={confirmState.isDestructive}
        isLoading={busy}
        onConfirm={confirmState.action}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}
