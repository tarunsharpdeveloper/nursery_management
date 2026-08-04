"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { AdminModule } from "@/components/admin-module";
import { FormModal } from "@/components/form-modal";
import { apiRequest, getMediaUrl } from "@/lib/api";
import { Image as ImageIcon, Video as VideoIcon, Film, UploadCloud, Save, X, Plus, Trash2, Power, PowerOff, CheckCircle, RefreshCw, MoreVertical, Edit2, AlertTriangle } from "lucide-react";

export default function AdminGalleryPage() {
  const [reloadKey, setReloadKey] = useState(0);

  // Custom Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // 3-Dots Dropdown State
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Confirmation Modals State
  const [toggleModalItem, setToggleModalItem] = useState<any | null>(null);
  const [deleteModalItem, setDeleteModalItem] = useState<any | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openAddModal = () => {
    setEditingItem(null);
    setMediaType("image");
    setTitle("");
    setCategory("General");
    setDescription("");
    setMediaUrl("");
    setThumbnailUrl("");
    setIsActive(true);
    setModalError("");
    setModalSuccess("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setMediaType(item.media_type || "image");
    setTitle(item.title || "");
    setCategory(item.category || "General");
    setDescription(item.description || "");
    setMediaUrl(item.media_url || "");
    setThumbnailUrl(item.thumbnail_url || "");
    setIsActive(item.is_active === 1 || item.is_active === true);
    setModalError("");
    setModalSuccess("");
    setIsModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isImageFile = file.type.startsWith("image/");
    const isVideoFile = file.type.startsWith("video/");

    if (mediaType === "image" && !isImageFile) {
      setModalError("Invalid File Type! Please select an Image file (.jpg, .png, .webp) for Image Gallery.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (mediaType === "video" && !isVideoFile) {
      setModalError("Invalid File Type! Please select a Video file (.mp4, .webm, .mov) for Video Gallery.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    setModalError("");

    try {
      const formData = new FormData();
      formData.append("files", file);

      const res = await apiRequest<{ urls: string[] }>("/api/upload", {
        method: "POST",
        body: formData
      });

      if (res.urls && res.urls.length > 0) {
        const uploadedPath = `/uploads/${res.urls[0]}`;
        setMediaUrl(uploadedPath);
        if (!thumbnailUrl && mediaType === "image") {
          setThumbnailUrl(uploadedPath);
        }
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setModalError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setModalError("Please enter a title for the media item");
      return;
    }
    if (!mediaUrl.trim()) {
      setModalError("Please upload an image or video file");
      return;
    }

    setBusy(true);
    setModalError("");
    setModalSuccess("");

    try {
      if (editingItem) {
        await apiRequest("/api/gallery", {
          method: "PATCH",
          body: JSON.stringify({
            id: editingItem.id,
            mediaType,
            title,
            category,
            description,
            mediaUrl,
            thumbnailUrl: thumbnailUrl || mediaUrl,
            isActive
          })
        });
        setModalSuccess("Gallery item updated successfully!");
      } else {
        await apiRequest("/api/gallery", {
          method: "POST",
          body: JSON.stringify({
            mediaType,
            title,
            category,
            description,
            mediaUrl,
            thumbnailUrl: thumbnailUrl || mediaUrl,
            isActive
          })
        });
        setModalSuccess("New gallery item created successfully!");
      }

      setReloadKey((prev) => prev + 1);
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1000);
    } catch (err: any) {
      setModalError(err.message || "Failed to save gallery item");
    } finally {
      setBusy(false);
    }
  };

  // Confirm Toggle Status (Enable/Disable)
  const confirmToggleStatus = async () => {
    if (!toggleModalItem) return;
    setActionBusy(true);
    try {
      await apiRequest("/api/gallery/toggle", {
        method: "PATCH",
        body: JSON.stringify({ id: toggleModalItem.id })
      });
      setReloadKey((prev) => prev + 1);
      setToggleModalItem(null);
    } catch (err) {
      console.error("Failed to toggle status:", err);
    } finally {
      setActionBusy(false);
    }
  };

  // Confirm Delete Item
  const confirmDelete = async () => {
    if (!deleteModalItem) return;
    setActionBusy(true);
    try {
      await apiRequest("/api/gallery/delete", {
        method: "POST",
        body: JSON.stringify({ id: deleteModalItem.id })
      });
      setReloadKey((prev) => prev + 1);
      setDeleteModalItem(null);
    } catch (err) {
      console.error("Failed to delete gallery item:", err);
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <>
      <AdminModule
        eyebrow="Photo & Video Gallery"
        title="Gallery Management"
        listPath={`/api/gallery?t=${reloadKey}`}
        searchPlaceholder="Search title, category, description..."
        headerActions={
          <button className="button" type="button" onClick={openAddModal}>
            <Plus size={17} />
            Add New Media
          </button>
        }
        filterConfig={{
          key: "media_type",
          label: "Gallery Type",
          icon: <ImageIcon size={15} />,
          options: [
            { value: "image", label: "Image Gallery" },
            { value: "video", label: "Video Gallery" }
          ]
        }}
        columns={[
          { key: "preview", label: "Preview" },
          { key: "title", label: "Title" },
          { key: "media_type", label: "Type" },
          { key: "category", label: "Category" },
          { key: "created_at", label: "Date Added" },
          { key: "actions", label: "Actions" }
        ]}
        renderCell={(row, column) => {
          if (column.key === "preview") {
            const isVideo = row.media_type === "video";
            const mediaUrl = getMediaUrl(row.media_url);

            if (isVideo) {
              const ytMatch = row.media_url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
              if (ytMatch && ytMatch[1]) {
                return (
                  <div style={{ width: "65px", height: "48px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                    <img src={`https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                );
              }
              if (row.thumbnail_url && row.thumbnail_url !== row.media_url) {
                return (
                  <div style={{ width: "65px", height: "48px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                    <img src={getMediaUrl(row.thumbnail_url)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                );
              }
              return (
                <div style={{ width: "65px", height: "48px", borderRadius: "8px", overflow: "hidden", background: "#0f172a", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <video src={mediaUrl} preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              );
            }

            return (
              <div style={{ width: "65px", height: "48px", borderRadius: "8px", overflow: "hidden", background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img
                  src={mediaUrl}
                  alt={row.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            );
          }

          if (column.key === "media_type") {
            return row.media_type === "video" ? (
              <span style={{ background: "#dbeafe", color: "#1e40af", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>
                Video Gallery
              </span>
            ) : (
              <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>
                Image Gallery
              </span>
            );
          }

          if (column.key === "category") {
            return (
              <span style={{ background: "#f1f5f9", color: "var(--text)", padding: "3px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 600 }}>
                {row.category || "General"}
              </span>
            );
          }

          if (column.key === "actions") {
            return (
              <div style={{ position: "relative" }}>
                <button
                  className="button secondary icon-only"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (openActionId === row.id) {
                      setOpenActionId(null);
                    } else {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const dropdownWidth = 160;
                      let left = rect.right - dropdownWidth;
                      let top = rect.bottom + 4;

                      if (top + 150 > window.innerHeight) {
                        top = rect.top - 140;
                      }

                      if (left < 10) left = 10;
                      if (left + dropdownWidth > window.innerWidth) left = window.innerWidth - dropdownWidth - 10;

                      setDropdownPosition({ top, left });
                      setOpenActionId(row.id);
                    }
                  }}
                  style={{ padding: "6px" }}
                  title="Actions"
                >
                  <MoreVertical size={16} />
                </button>

                {openActionId === row.id &&
                  typeof document !== "undefined" &&
                  createPortal(
                    <>
                      <div
                        className="actions-dropdown-overlay"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionId(null);
                        }}
                      />
                      <div
                        className="actions-dropdown-menu direction-down"
                        style={{
                          position: "fixed",
                          top: dropdownPosition.top + "px",
                          left: dropdownPosition.left + "px",
                          minWidth: "160px",
                          width: "max-content",
                          zIndex: 10001
                        }}
                      >
                        <button
                          className="button secondary actions-dropdown-item"
                          type="button"
                          onClick={() => {
                            setOpenActionId(null);
                            openEditModal(row);
                          }}
                          style={{ whiteSpace: "nowrap" }}
                        >
                          <Edit2 size={15} style={{ marginRight: 8, flexShrink: 0 }} />
                          Edit Item
                        </button>

                        <button
                          className="button secondary actions-dropdown-item"
                          type="button"
                          onClick={() => {
                            setOpenActionId(null);
                            setToggleModalItem(row);
                          }}
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {row.is_active ? (
                            <PowerOff size={15} style={{ marginRight: 8, color: "#eab308", flexShrink: 0 }} />
                          ) : (
                            <Power size={15} style={{ marginRight: 8, color: "#16a34a", flexShrink: 0 }} />
                          )}
                          {row.is_active ? "Disable Item" : "Enable Item"}
                        </button>

                        <button
                          className="button secondary actions-dropdown-item danger"
                          type="button"
                          onClick={() => {
                            setOpenActionId(null);
                            setDeleteModalItem(row);
                          }}
                          style={{ whiteSpace: "nowrap" }}
                        >
                          <Trash2 size={15} style={{ marginRight: 8, color: "#ef4444", flexShrink: 0 }} />
                          Delete Item
                        </button>
                      </div>
                    </>,
                    document.body
                  )}
              </div>
            );
          }

          return null;
        }}
      />

      {/* Add / Edit Gallery Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Edit Gallery Item" : "Add New Media to Gallery"}
        maxWidth={650}
        footer={
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", width: "100%" }}>
            <button className="button secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button
              className="button"
              type="button"
              onClick={handleSubmit}
              disabled={busy || uploading || !mediaUrl || !title}
            >
              <Save size={17} />
              {busy ? "Saving..." : editingItem ? "Update Item" : "Upload & Save"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="card-body" style={{ padding: 0 }}>
          {modalError && (
            <div style={{ padding: "10px 14px", background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: "6px", fontSize: "14px", marginBottom: "16px" }}>
              {modalError}
            </div>
          )}
          {modalSuccess && (
            <div style={{ padding: "10px 14px", background: "#dcfce7", border: "1px solid #86efac", color: "#15803d", borderRadius: "6px", fontSize: "14px", marginBottom: "16px" }}>
              {modalSuccess}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Type Switcher */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label className="field" style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600, marginBottom: "4px" }}>
                  Gallery Type <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <select
                  value={mediaType}
                  onChange={(e) => {
                    const newType = e.target.value as "image" | "video";
                    setMediaType(newType);
                    setMediaUrl("");
                    setThumbnailUrl("");
                    setModalError("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--line)" }}
                >
                  <option value="image">Image Gallery</option>
                  <option value="video">Video Gallery</option>
                </select>
              </label>

              <label className="field" style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600, marginBottom: "4px" }}>Category Tag</span>
                <input
                  type="text"
                  placeholder="e.g. Plants, Nursery Tour, Events"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </label>
            </div>

            {/* Title / Caption */}
            <label className="field" style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 600, marginBottom: "4px" }}>
                Title / Caption <span style={{ color: "#ef4444" }}>*</span>
              </span>
              <input
                type="text"
                placeholder="e.g. Rose Garden Special Tour"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            {/* Direct File Upload Area */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontWeight: 600 }}>
                Upload {mediaType === "video" ? "Video File" : "Image File"} <span style={{ color: "#ef4444" }}>*</span>
              </span>

              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed #cbd5e1",
                  borderRadius: "12px",
                  padding: "24px",
                  textAlign: "center",
                  background: "#f8fafc",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#2f6b3f";
                  e.currentTarget.style.background = "#f0fdf4";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.background = "#f8fafc";
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={mediaType === "video" ? "video/mp4,video/webm,video/ogg,video/quicktime,video/*" : "image/jpeg,image/png,image/webp,image/gif,image/*"}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

                {uploading ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "var(--muted)" }}>
                    <RefreshCw size={28} className="spin" color="#2f6b3f" />
                    <span>Uploading media file to server...</span>
                  </div>
                ) : mediaUrl ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                    {mediaType === "image" ? (
                      <img
                        src={getMediaUrl(mediaUrl)}
                        alt="Uploaded Preview"
                        style={{ maxHeight: "140px", borderRadius: "8px", objectFit: "contain", border: "1px solid #e2e8f0" }}
                      />
                    ) : (
                      <div style={{ padding: "12px 20px", background: "#dbeafe", color: "#1e40af", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
                        <Film size={22} />
                        <span>Video file uploaded ({mediaUrl})</span>
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#16a34a", fontSize: "13px", fontWeight: 600 }}>
                      <CheckCircle size={16} /> File Uploaded Successfully! Click to change.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "var(--muted)" }}>
                    <UploadCloud size={36} color="#2f6b3f" />
                    <span style={{ fontWeight: 600, fontSize: "15px", color: "var(--text)" }}>
                      Click to choose {mediaType === "video" ? "Video File" : "Image File"} from computer
                    </span>
                    <span style={{ fontSize: "12px" }}>
                      Supports {mediaType === "video" ? ".mp4, .webm" : ".jpg, .jpeg, .png, .webp"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Optional YouTube / Link Input */}
            {mediaType === "video" && (
              <label className="field" style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 500, fontSize: "13px", color: "var(--muted)", marginBottom: "4px" }}>
                  Or paste YouTube / External Video Link (Optional)
                </span>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={mediaUrl.startsWith("http") ? mediaUrl : ""}
                  onChange={(e) => setMediaUrl(e.target.value)}
                />
              </label>
            )}

            {/* Description */}
            <label className="field" style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 600, marginBottom: "4px" }}>Description / Details</span>
              <textarea
                rows={3}
                placeholder="Enter details about this photo or video..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--line)" }}
              />
            </label>
          </div>
        </form>
      </FormModal>

      {/* Enable / Disable Confirmation Modal */}
      {toggleModalItem && (
        <FormModal
          isOpen={true}
          onClose={() => setToggleModalItem(null)}
          title={toggleModalItem.is_active ? "Disable Gallery Item" : "Enable Gallery Item"}
          maxWidth={450}
          footer={
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", width: "100%" }}>
              <button className="button secondary" type="button" onClick={() => setToggleModalItem(null)} disabled={actionBusy}>
                Cancel
              </button>
              <button
                className="button"
                type="button"
                onClick={confirmToggleStatus}
                disabled={actionBusy}
                style={{
                  background: toggleModalItem.is_active ? "#eab308" : "#16a34a",
                  borderColor: toggleModalItem.is_active ? "#ca8a04" : "#15803d",
                  color: "white"
                }}
              >
                {actionBusy ? "Updating..." : toggleModalItem.is_active ? "Disable Item" : "Enable Item"}
              </button>
            </div>
          }
        >
          <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", padding: "10px 0" }}>
            <div style={{ background: toggleModalItem.is_active ? "#fef9c3" : "#dcfce7", color: toggleModalItem.is_active ? "#854d0e" : "#166534", padding: "12px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <p style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>
                Are you sure you want to {toggleModalItem.is_active ? "disable" : "enable"} &quot;{toggleModalItem.title}&quot;?
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
                {toggleModalItem.is_active
                  ? "This item will be hidden from the website gallery until enabled again."
                  : "This item will be visible to all visitors on the public website gallery."}
              </p>
            </div>
          </div>
        </FormModal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalItem && (
        <FormModal
          isOpen={true}
          onClose={() => setDeleteModalItem(null)}
          title="Delete Gallery Item"
          maxWidth={450}
          footer={
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", width: "100%" }}>
              <button className="button secondary" type="button" onClick={() => setDeleteModalItem(null)} disabled={actionBusy}>
                Cancel
              </button>
              <button
                className="button danger"
                type="button"
                onClick={confirmDelete}
                disabled={actionBusy}
                style={{ background: "#dc2626", borderColor: "#b91c1c", color: "white" }}
              >
                <Trash2 size={16} />
                {actionBusy ? "Deleting..." : "Delete Item"}
              </button>
            </div>
          }
        >
          <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", padding: "10px 0" }}>
            <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <p style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>
                Are you sure you want to delete &quot;{deleteModalItem.title}&quot;?
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
                This action cannot be undone. The photo/video item will be permanently removed from the gallery.
              </p>
            </div>
          </div>
        </FormModal>
      )}
    </>
  );
}
