"use client";

import { useEffect, useState, useRef, useMemo, DragEvent } from "react";
import { apiRequest } from "@/lib/api";
import { Edit2, Plus, Power, PowerOff, RefreshCw, Box, Trash2, Eye, X, UploadCloud, MoreVertical, ChevronDown, Search } from "lucide-react";
import { FormModal } from "@/components/form-modal";
import { ConfirmModal } from "@/components/confirm-modal";

type Category = {
  id: number;
  parent_id: number | null;
  name: string;
  is_active: number | boolean;
};

type Variant = {
  id?: number;
  unit: string;
  unit_value: string;
  actual_price: string;
  selling_price: string;
  available_quantity: string;
};

type Product = {
  id: number;
  category_id: number;
  name: string;
  description: string;
  selling_price: string;
  actual_price: string;
  available_quantity: number;
  unit: string | null;
  media_urls: string | null;
  is_active: number | boolean;
  category: string;
  created_at: string;
  updated_at: string;
  variants: { id: number; unit: string; unit_value: string; actual_price: string; selling_price: string; available_quantity: number }[];
};

type MediaItem = {
  id: string;
  url: string; // Either a blob URL or base64
  file?: File; // Only for newly added files
  isExisting?: boolean; // True if it came from DB
};

function isActive(p: Product) {
  return Boolean(p.is_active);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState("Loading...");
  const [busy, setBusy] = useState(false);

  const [categoryPath, setCategoryPath] = useState<number[]>([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    sellingPrice: "",
    actualPrice: "",
    availableQuantity: "",
    unit: ""
  });

  const [variants, setVariants] = useState<Variant[]>([]);

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [editing, setEditing] = useState<Product | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [dropdownDirection, setDropdownDirection] = useState<"up" | "down">("down");
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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
  }, [stockFilter, statusFilter]);

  async function loadData() {
    setBusy(true);
    try {
      const cats = await apiRequest<Category[]>("/api/categories");
      setCategories(Array.isArray(cats) ? cats : []);

      const searchParams = new URLSearchParams({ page: String(currentPage), limit: "10" });
      if (debouncedSearch) searchParams.set("search", debouncedSearch);
      if (stockFilter) {
        searchParams.set("filterKey", "stock_status");
        searchParams.set("filterValue", stockFilter);
      } else if (statusFilter) {
        searchParams.set("filterKey", "status");
        searchParams.set("filterValue", statusFilter);
      }

      const prods = await apiRequest<any>(`/api/products?${searchParams.toString()}`);
      setProducts(prods && prods.data && Array.isArray(prods.data) ? prods.data : (Array.isArray(prods) ? prods : []));
      setTotalPages(prods?.totalPages || 1);

      setStatus("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [currentPage, debouncedSearch, stockFilter, statusFilter]);

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

  const targetCategoryId = categoryPath.length > 0 ? categoryPath[categoryPath.length - 1] : "";

  // Drag and drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addFiles = (files: File[]) => {
    const validFiles = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    const newItems: MediaItem[] = validFiles.map(f => ({
      id: generateId(),
      url: URL.createObjectURL(f),
      file: f
    }));
    setMediaItems(prev => [...prev, ...newItems]);
    setErrors(err => ({ ...err, media: "" }));
  };

  const removeMedia = (id: string) => {
    setMediaItems(prev => prev.filter(m => m.id !== id));
  };

  // Variant handlers
  const addVariant = () => {
    setVariants([...variants, { unit: "", unit_value: "", actual_price: "", selling_price: "", available_quantity: "0" }]);
  };
  const removeVariant = (index: number) => {
    const oldQty = Number(variants[index].available_quantity) || 0;
    if (oldQty > 0) {
      setForm(f => ({
        ...f,
        availableQuantity: String(Math.max(0, (Number(f.availableQuantity) || 0) - oldQty))
      }));
    }
    setVariants(variants.filter((_, i) => i !== index));
  };
  const updateVariant = (index: number, field: keyof Variant, value: string) => {
    if (field === "available_quantity") {
      const oldQty = Number(variants[index].available_quantity) || 0;
      const newQty = Number(value) || 0;
      const diff = newQty - oldQty;
      if (diff !== 0) {
        setForm(f => ({
          ...f,
          availableQuantity: String(Math.max(0, (Number(f.availableQuantity) || 0) + diff))
        }));
      }
    }
    const newV = [...variants];
    newV[index] = { ...newV[index], [field]: value };
    setVariants(newV);
  };

  async function handleCreate() {
    const newErrors: Record<string, string> = {};
    if (!targetCategoryId) newErrors.category = "Category is required";
    if (!form.name.trim()) newErrors.name = "Product name is required";
    if (!form.actualPrice) newErrors.actualPrice = "Actual price is required";
    if (!form.sellingPrice) newErrors.sellingPrice = "Selling price is required";
    if (!form.availableQuantity) newErrors.availableQuantity = "Stocks quantity is required";
    if (mediaItems.length === 0) newErrors.media = "At least one image/video is required";

    variants.forEach((v, i) => {
      if (!v.actual_price) newErrors[`variant_${i}_actualPrice`] = "Required";
      if (!v.selling_price) newErrors[`variant_${i}_sellingPrice`] = "Required";
      if (!v.available_quantity) newErrors[`variant_${i}_availableQuantity`] = "Required";
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setStatus("Please fix the validation errors");
      return;
    }

    setErrors({});
    setBusy(true);

    try {
      // Process media
      const base64Array = [];
      for (const item of mediaItems) {
        if (item.file) {
          base64Array.push(await fileToBase64(item.file));
        } else if (item.isExisting) {
          base64Array.push(item.url);
        }
      }
      const mediaUrlsJson = JSON.stringify(base64Array);

      // Process variants
      const payloadVariants = variants.map(v => ({
        unit: v.unit || null,
        unitValue: v.unit_value || null,
        actualPrice: Number(v.actual_price),
        sellingPrice: Number(v.selling_price),
        availableQuantity: Number(v.available_quantity)
      }));

      await apiRequest("/api/products", {
        method: "POST",
        body: JSON.stringify({
          categoryId: targetCategoryId,
          name: form.name,
          description: form.description,
          sellingPrice: Number(form.sellingPrice),
          actualPrice: Number(form.actualPrice),
          availableQuantity: Number(form.availableQuantity),
          unit: form.unit || undefined,
          mediaUrls: mediaUrlsJson,
          variants: payloadVariants
        })
      });

      resetForm();
      setStatus("Product saved");
      await loadData();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to create");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(p: Product) {
    setIsModalOpen(true);
    setEditing(p);

    let path = [];
    let curr = categories.find(c => c.id === p.category_id);
    while (curr) {
      path.unshift(curr.id);
      curr = categories.find(c => c.id === curr?.parent_id);
    }

    setCategoryPath(path);

    setForm({
      name: p.name,
      description: p.description || "",
      sellingPrice: String(p.selling_price),
      actualPrice: String(p.actual_price),
      availableQuantity: String(p.available_quantity),
      unit: p.unit || ""
    });

    // Load existing media
    try {
      const urls = JSON.parse(p.media_urls || "[]");
      setMediaItems(urls.map((u: string) => ({ id: generateId(), url: u, isExisting: true })));
    } catch {
      setMediaItems([]);
    }

    // Load variants
    if (p.variants && p.variants.length > 0) {
      setVariants(p.variants.map(v => ({
        id: v.id,
        unit: v.unit || "",
        unit_value: v.unit_value || "",
        actual_price: String(v.actual_price),
        selling_price: String(v.selling_price),
        available_quantity: String(v.available_quantity)
      })));
    } else {
      setVariants([]);
    }

    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSaveEdit() {
    if (!editing) return;

    const newErrors: Record<string, string> = {};
    if (!targetCategoryId) newErrors.category = "Category is required";
    if (!form.name.trim()) newErrors.name = "Product name is required";
    if (!form.actualPrice) newErrors.actualPrice = "Actual price is required";
    if (!form.sellingPrice) newErrors.sellingPrice = "Selling price is required";
    if (!form.availableQuantity) newErrors.availableQuantity = "Stocks quantity is required";
    if (mediaItems.length === 0) newErrors.media = "At least one image/video is required";

    variants.forEach((v, i) => {
      if (!v.actual_price) newErrors[`variant_${i}_actualPrice`] = "Required";
      if (!v.selling_price) newErrors[`variant_${i}_sellingPrice`] = "Required";
      if (!v.available_quantity) newErrors[`variant_${i}_availableQuantity`] = "Required";
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setStatus("Please fix the validation errors");
      return;
    }

    setErrors({});
    setBusy(true);

    try {
      const base64Array = [];
      for (const item of mediaItems) {
        if (item.file) {
          base64Array.push(await fileToBase64(item.file));
        } else if (item.isExisting) {
          base64Array.push(item.url); // original base64 or URL
        }
      }
      const mediaUrlsJson = JSON.stringify(base64Array);

      const payloadVariants = variants.map(v => ({
        unit: v.unit || null,
        unitValue: v.unit_value || null,
        actualPrice: Number(v.actual_price),
        sellingPrice: Number(v.selling_price),
        availableQuantity: Number(v.available_quantity)
      }));

      await apiRequest("/api/products", {
        method: "PATCH",
        body: JSON.stringify({
          productId: editing.id,
          categoryId: targetCategoryId,
          name: form.name,
          description: form.description,
          sellingPrice: Number(form.sellingPrice),
          actualPrice: Number(form.actualPrice),
          availableQuantity: Number(form.availableQuantity),
          unit: form.unit || undefined,
          mediaUrls: mediaUrlsJson,
          variants: payloadVariants
        })
      });

      resetForm();
      setStatus("Product updated");
      await loadData();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setBusy(false);
    }
  }

  function resetForm() {
    setIsModalOpen(false);
    setEditing(null);
    setForm({ name: "", description: "", sellingPrice: "", actualPrice: "", availableQuantity: "", unit: "" });
    setVariants([]);
    setCategoryPath([]);
    setMediaItems([]);
    setErrors({});
  }

  function requestDelete(p: Product) {
    setConfirmState({
      isOpen: true,
      title: "Delete Product",
      message: `Are you sure you want to delete "${p.name}"?`,
      confirmText: "Delete",
      isDestructive: true,
      action: async () => {
        setBusy(true);
        try {
          await apiRequest("/api/products/delete", {
            method: "POST",
            body: JSON.stringify({ productId: p.id })
          });
          setStatus(`${p.name} deleted`);
          await loadData();
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Failed to delete";
          if (msg.includes("foreign key constraint fails") || msg.includes("Cannot delete or update a parent row")) {
            setStatus("Error: Do not delete this product; it is added in an order item or is currently in use.");
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

  function requestToggle(p: Product) {
    const active = isActive(p);
    setConfirmState({
      isOpen: true,
      title: active ? "Disable Product" : "Enable Product",
      message: `Are you sure you want to ${active ? "disable" : "enable"} "${p.name}"?`,
      confirmText: active ? "Disable" : "Enable",
      isDestructive: active,
      action: async () => {
        setBusy(true);
        try {
          await apiRequest("/api/products/toggle", {
            method: "PATCH",
            body: JSON.stringify({ productId: p.id, isActive: !active })
          });
          setStatus(`${p.name} ${active ? "deactivated" : "activated"}`);
          await loadData();
        } catch (error) {
          setStatus(error instanceof Error ? error.message : "Failed to toggle");
        } finally {
          setBusy(false);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  }

  const filteredProducts = products;

  return (
    <>
      <div className="section-header">
        <div>
          <h1>Products</h1>
        </div>
        <button className="button" type="button" onClick={() => { resetForm(); setIsModalOpen(true); }} disabled={busy}>
          <Plus size={17} />
          Add Product
        </button>
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={resetForm}
        title={editing ? `Editing: ${editing.name}` : "Add Product"}
        maxWidth={1000}
        footer={
          editing ? (
            <>
              <button className="button secondary" type="button" onClick={resetForm}>Cancel</button>
              <button className="button" type="button" onClick={handleSaveEdit} disabled={busy}>Save Changes</button>
            </>
          ) : (
            <button className="button" type="button" onClick={handleCreate} disabled={busy}>
              <Plus size={17} style={{ marginRight: 4 }} />
              Add Product
            </button>
          )
        }
      >
        <div className="card-body" style={{ padding: 0 }}>
          {/* Row 1: Categories (Dynamic) */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
            {dropdowns.map((options, idx) => (
              <label key={idx} className="field" style={{ width: 230 }}>
                <span>
                  {idx === 0 ? "Category" : idx === 1 ? "Subcategory" : `Level ${idx + 1} Subcategory`}
                  {idx === 0 ? <span style={{ color: "#ef4444" }}> *</span> : null}
                </span>
                <select
                  value={categoryPath[idx] || ""}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setErrors(err => ({ ...err, category: "" }));
                    if (!val) {
                      setCategoryPath(categoryPath.slice(0, idx));
                    } else {
                      const newPath = categoryPath.slice(0, idx);
                      newPath.push(val);
                      setCategoryPath(newPath);
                    }
                  }}
                >
                  <option value="">{`-- Select ${idx === 0 ? "Category" : "Subcategory"} --`}</option>
                  {options.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {idx === 0 && errors.category && <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 500, lineHeight: 1 }}>{errors.category}</div>}
              </label>
            ))}
          </div>

          {/* Row 2: Product Name, Unit, Prices (4 columns) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 16 }}>
            <label className="field">
              <span>Product Name <span style={{ color: "#ef4444" }}>*</span></span>
              <input value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(err => ({ ...err, name: "" })); }} placeholder="E.g. Rose Plant" />
              {errors.name && <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 500, lineHeight: 1 }}>{errors.name}</div>}
            </label>

            <label className="field">
              <span>Unit (Optional)</span>
              <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                <option value="">-- Select Unit --</option>
                {["Piece", "Packet", "Kg", "Gram", "MiliLitre", "Litre", "Bag", "Bundle"].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </label>

            <label className="field">
              <span>Actual Price <span style={{ color: "#ef4444" }}>*</span></span>
              <input type="number" min="0" step="0.01" value={form.actualPrice} onChange={e => { setForm(f => ({ ...f, actualPrice: e.target.value })); setErrors(err => ({ ...err, actualPrice: "" })); }} />
              {errors.actualPrice && <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 500, lineHeight: 1 }}>{errors.actualPrice}</div>}
            </label>

            <label className="field">
              <span>Selling Price <span style={{ color: "#ef4444" }}>*</span></span>
              <input type="number" min="0" step="0.01" value={form.sellingPrice} onChange={e => { setForm(f => ({ ...f, sellingPrice: e.target.value })); setErrors(err => ({ ...err, sellingPrice: "" })); }} />
              {errors.sellingPrice && <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 500, lineHeight: 1 }}>{errors.sellingPrice}</div>}
            </label>
          </div>

          {/* Row 3: Stocks, Media Dropzone (Grid with diverse columns) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: 16, marginBottom: 16 }}>
            <label className="field">
              <span>Stocks Quantity <span style={{ color: "#ef4444" }}>*</span></span>
              <input type="number" min="0" value={form.availableQuantity} onChange={e => { setForm(f => ({ ...f, availableQuantity: e.target.value })); setErrors(err => ({ ...err, availableQuantity: "" })); }} />
              {errors.availableQuantity && <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 500, lineHeight: 1 }}>{errors.availableQuantity}</div>}
            </label>

            <div>
              <span style={{ color: "var(--muted)", fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>Images/Videos <span style={{ color: "#ef4444" }}>*</span></span>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? "#3b82f6" : "#cbd5e1"}`,
                  background: isDragging ? "rgba(59, 130, 246, 0.05)" : "#f8fafc",
                  borderRadius: 8,
                  padding: "16px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  minHeight: 42
                }}
              >
                <UploadCloud size={20} color={isDragging ? "#3b82f6" : "#94a3b8"} />
                <span style={{ color: "#475569", fontWeight: 500, fontSize: 14 }}>Drag and drop media, or click to browse</span>
                <input type="file" accept="image/*,video/*" multiple ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
              </div>
              {errors.media && <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 500, lineHeight: 1 }}>{errors.media}</div>}

              {mediaItems.length > 0 && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                  {mediaItems.map((item) => (
                    <div key={item.id} style={{ position: "relative", width: 60, height: 60, borderRadius: 6, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                      {(item.file?.type.startsWith('video/') || item.url.startsWith('data:video') || item.url.match(/\.(mp4|webm)$/)) ? (
                        <video src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <img src={item.url} alt="upload preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeMedia(item.id); }}
                        style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 4: Description (1 column) */}
          <div style={{ marginBottom: 30 }}>
            <label className="field">
              <span>Description (Optional)</span>
              <textarea rows={3} value={form.description} onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setErrors(err => ({ ...err, description: "" })); }} />
            </label>
          </div>

          <hr style={{ margin: "30px 0", border: "none", borderTop: "1px solid #e2e8f0" }} />

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
              <div>
                <h4 style={{ margin: 0 }}>Product Variants <span className="meta" style={{ fontWeight: "normal", fontSize: 13 }}>(Optional)</span></h4>
                <p className="meta" style={{ margin: "5px 0 0" }}>Add variants if you have multiple sizes or configurations. This base price/stock will still apply as the default.</p>
              </div>
              <button className="button secondary" type="button" onClick={addVariant} style={{ padding: "4px 10px", fontSize: 13 }}>
                <Plus size={14} style={{ marginRight: 4 }} /> Add Variant
              </button>
            </div>

            {variants.length === 0 ? (
              <div style={{ background: "#f8fafc", padding: 20, textAlign: "center", borderRadius: 8, border: "1px dashed #cbd5e1", color: "#64748b" }}>
                No variants configured. The base pricing and stock above will be used.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                {variants.map((v, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#f8fafc", padding: 15, borderRadius: 8, border: "1px solid #e2e8f0", flexWrap: "wrap" }}>
                    <label className="field" style={{ flex: "1 1 120px", margin: 0 }}>
                      <span style={{ fontSize: 12 }}>Value (e.g. 500)</span>
                      <input value={v.unit_value} onChange={e => updateVariant(i, "unit_value", e.target.value)} placeholder="Value" />
                    </label>
                    <label className="field" style={{ flex: "1 1 120px", margin: 0 }}>
                      <span style={{ fontSize: 12 }}>Unit</span>
                      <select value={v.unit} onChange={e => updateVariant(i, "unit", e.target.value)}>
                        <option value="">None</option>
                        {["Piece", "Packet", "Kg", "Gram", "MiliLitre", "Litre", "Bag", "Bundle"].map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </label>
                    <label className="field" style={{ flex: "1 1 120px", margin: 0 }}>
                      <span style={{ fontSize: 12 }}>Actual Price <span style={{ color: "#ef4444" }}>*</span></span>
                      <input type="number" min="0" step="0.01" value={v.actual_price} onChange={e => { updateVariant(i, "actual_price", e.target.value); setErrors(err => ({ ...err, [`variant_${i}_actualPrice`]: "" })); }} />
                      {errors[`variant_${i}_actualPrice`] && <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 500, lineHeight: 1 }}>{errors[`variant_${i}_actualPrice`]}</div>}
                    </label>
                    <label className="field" style={{ flex: "1 1 120px", margin: 0 }}>
                      <span style={{ fontSize: 12 }}>Selling Price <span style={{ color: "#ef4444" }}>*</span></span>
                      <input type="number" min="0" step="0.01" value={v.selling_price} onChange={e => { updateVariant(i, "selling_price", e.target.value); setErrors(err => ({ ...err, [`variant_${i}_sellingPrice`]: "" })); }} />
                      {errors[`variant_${i}_sellingPrice`] && <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 500, lineHeight: 1 }}>{errors[`variant_${i}_sellingPrice`]}</div>}
                    </label>
                    <label className="field" style={{ flex: "1 1 120px", margin: 0 }}>
                      <span style={{ fontSize: 12 }}>Stock <span style={{ color: "#ef4444" }}>*</span></span>
                      <input type="number" min="0" value={v.available_quantity} onChange={e => { updateVariant(i, "available_quantity", e.target.value); setErrors(err => ({ ...err, [`variant_${i}_availableQuantity`]: "" })); }} />
                      {errors[`variant_${i}_availableQuantity`] && <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 500, lineHeight: 1 }}>{errors[`variant_${i}_availableQuantity`]}</div>}
                    </label>
                    <button type="button" onClick={() => removeVariant(i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "10px 5px", marginTop: 17 }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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
                placeholder="Name, product code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-input"
              />
            </div>
          </div>

          <div className="filter-group-fixed">
            <label className="filter-label">
              <Box size={14} /> Stock Status
            </label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Any stock level</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          <div className="filter-group-fixed">
            <label className="filter-label">
              <Power size={14} /> Product Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Any status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ overflow: "visible" }}>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>S.No.</th>
                <th style={{ width: 80 }}>Media</th>
                <th>Product</th>
                <th>Category</th>
                <th>Pricing</th>
                <th>Stock & Variants</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 20 }} className="meta">No products found</td>
                </tr>
              ) : null}
              {filteredProducts.map((p, index) => (
                <tr key={p.id}>
                  <td>{index + 1}</td>
                  <td>
                    {(() => {
                      let imgSrc: string | null = null;
                      if (p.media_urls) {
                        try {
                          const parsed = JSON.parse(p.media_urls);
                          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
                            imgSrc = parsed[0];
                          }
                        } catch {
                          imgSrc = p.media_urls;
                        }
                      }
                      return imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={p.name}
                          style={{
                            width: 52,
                            height: 52,
                            objectFit: "cover",
                            borderRadius: 8,
                            border: "1px solid #e2e8f0",
                            display: "block"
                          }}
                        />
                      ) : (
                        <div style={{
                          width: 52,
                          height: 52,
                          borderRadius: 8,
                          border: "1px dashed #cbd5e1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#f8fafc",
                          color: "#94a3b8",
                          fontSize: 10
                        }}>
                          No img
                        </div>
                      );
                    })()}
                  </td>
                  <td>
                    <strong>{p.name}</strong>
                    {p.unit ? <span className="meta" style={{ marginLeft: 6 }}>({p.unit})</span> : null}
                  </td>
                  <td><span className="meta">{p.category}</span></td>
                  <td>
                    <div>₹{p.selling_price}</div>
                  </td>
                  <td>
                    <div>{p.available_quantity}</div>
                    <div className="meta" style={{ fontSize: 12, marginTop: 4 }}>
                      {p.variants && p.variants.length > 0 ? `${p.variants.length} Variant(s)` : "No variants"}
                    </div>
                  </td>
                  <td>
                    <div className="meta" style={{ fontSize: 13 }}>{formatDate(p.created_at)}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${isActive(p) ? "status-paid" : "status-failed"}`}>
                      {isActive(p) ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <div className="actions-dropdown-wrapper">
                      <button 
                        className="button secondary" 
                        type="button" 
                        title="Actions"
                        onClick={(e) => {
                          if (openActionId === p.id) {
                            setOpenActionId(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const spaceBelow = window.innerHeight - rect.bottom;
                            setDropdownDirection(spaceBelow < 200 ? "up" : "down");
                            setOpenActionId(p.id);
                          }
                        }}
                        disabled={busy} 
                        style={{ padding: "6px" }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {openActionId === p.id && (
                        <>
                          <div 
                            className="actions-dropdown-overlay" 
                            onClick={(e) => { e.stopPropagation(); setOpenActionId(null); }} 
                          />
                          <div className={`actions-dropdown-menu direction-${dropdownDirection}`}>
                            <a 
                              href={`/admin/products/view?id=${p.id}`}
                              className="button secondary actions-dropdown-item" 
                              title="View" 
                            >
                              <Eye size={16} color="#3b82f6" style={{ marginRight: 8 }} />
                              View
                            </a>
                            <button 
                              className="button secondary actions-dropdown-item" 
                              type="button" 
                              onClick={() => { setOpenActionId(null); startEdit(p); }} 
                              disabled={busy}
                            >
                              <Edit2 size={16} style={{ marginRight: 8 }} />
                              Edit
                            </button>
                            <button 
                              className="button secondary actions-dropdown-item" 
                              type="button" 
                              onClick={() => { setOpenActionId(null); requestToggle(p); }} 
                              disabled={busy}
                            >
                              {isActive(p) ? <PowerOff size={16} style={{ marginRight: 8 }} /> : <Power size={16} style={{ marginRight: 8 }} />}
                              {isActive(p) ? "Disable" : "Enable"}
                            </button>
                            <button 
                              className="button secondary actions-dropdown-item danger" 
                              type="button" 
                              onClick={() => { setOpenActionId(null); requestDelete(p); }} 
                              disabled={busy}
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
