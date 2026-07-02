"use client";

import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, Plus, Power, PowerOff, RefreshCw, Tags, Trash2, ListTree, MoreVertical, ChevronDown, X } from "lucide-react";
import { FormModal } from "@/components/form-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { apiRequest } from "@/lib/api";

type Category = {
  id: number;
  parent_id: number | null;
  category_type: string | null;
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
          categoryType: form.categoryType || undefined,
          photoUrls
        })
      });
      setForm({ name: "", description: "", categoryType: "" });
      setCreatePreview([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsModalOpen(false);
      setStatus("Sub-category saved");
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
      setEditing(null);
      setForm({ name: "", description: "", categoryType: "" });
      setCreatePreview([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsModalOpen(false);
      setStatus("Sub-category updated");
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
      title: active ? "Disable Sub-Category" : "Enable Sub-Category",
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
      title: "Delete Sub-Category",
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

  if (!parentId) {
    return (
      <>
        <div className="section-header">
          <div>
            <p className="eyebrow">Error</p>
            <h1>Invalid Category ID</h1>
          </div>
          <button className="button secondary" onClick={() => router.push("/admin/categories")}>Go Back</button>
        </div>
      </>
    );
  }

  if (!parentCategory && !busy && categories.length > 0) {
    return (
      <>
        <div className="section-header">
          <div>
            <p className="eyebrow">Error</p>
            <h1>Category not found</h1>
          </div>
          <button className="button secondary" onClick={() => router.push("/admin/categories")}>Go Back</button>
        </div>
      </>
    );
  }

  return (
    <>
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
        <button className="button" type="button" onClick={() => { setEditing(null); setForm({ name: "", description: "", categoryType: "" }); setCreatePreview([]); setIsModalOpen(true); }} disabled={busy}>
          <Plus size={17} />
          Add Sub-Category
        </button>
      </div>

      {/* CREATE / EDIT MODAL */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeForm}
        title={editing ? `Editing: ${editing.name}` : "Add Sub-Category"}
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
              Save Sub-Category
            </button>
          )
        }
      >
        <div className="card-body" style={{ padding: 0 }}>
          <div className="form-grid">
            <label className="field">
              <span>Sub-Category Name <span style={{ color: "red" }}>*</span></span>
              <input value={form.name} onChange={e => setForm(c => ({ ...c, name: e.target.value }))} placeholder="E.g. Indoor Plants" />
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
              <span>{editing ? "Update Images (Replaces existing)" : "Images (Multiple)"}</span>
              <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleCreateFileChange} />
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
                <div style={{ width: "100%" }}><span className="meta">Current Images:</span></div>
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

export default function AdminSubCategoriesPage() {
  return (
    <Suspense fallback={<><div className="section-header"><h1>Loading...</h1></div></>}>
      <SubCategoriesContent />
    </Suspense>
  );
}
