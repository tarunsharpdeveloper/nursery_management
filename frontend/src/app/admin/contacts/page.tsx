"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Mail, Trash2, Send, Clock, User, Phone, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: "new" | "read" | "replied" | "closed";
  admin_reply?: string;
  replied_by?: number;
  created_at: string;
  updated_at: string;
}

interface ContactStats {
  total: number;
  new_count: number;
  read_count: number;
  replied_count: number;
  closed_count: number;
}

interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  isDangerous?: boolean;
}

export default function ContactsAdminPage() {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isDangerous: false
  });

  const loadMessages = async (page = 1, status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20"
      });

      if (status && status !== "all") {
        params.append("status", status);
      }

      const response = await apiRequest(`/api/contact/messages?${params.toString()}`, {
        method: "GET"
      }) as { data?: ContactMessage[]; currentPage?: number; totalPages?: number };

      setMessages(response.data || []);
      setCurrentPage(response.currentPage || 1);
      setTotalPages(response.totalPages || 1);
    } catch (error: any) {
      showToast(error?.message || "Failed to load contact messages", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiRequest("/api/contact/stats", {
        method: "GET"
      }) as { data?: ContactStats };
      setStats(response.data || null);
    } catch (error: any) {
      console.error("Failed to load stats:", error);
    }
  };

  useEffect(() => {
    loadMessages(1, statusFilter);
    loadStats();
  }, []);

  useEffect(() => {
    loadMessages(1, statusFilter);
  }, [statusFilter]);

  const handleViewMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    try {
      const response = await apiRequest("/api/contact/message", {
        method: "POST",
        body: JSON.stringify({ messageId: message.id })
      }) as { data?: ContactMessage };
      setSelectedMessage(response.data || message);
    } catch (error: any) {
      console.error("Error fetching message:", error);
    }
  };

  const handleStatusChange = async (messageId: number, newStatus: string) => {
    try {
      await apiRequest("/api/contact/status", {
        method: "PATCH",
        body: JSON.stringify({ messageId, status: newStatus })
      });
      showToast("Status updated successfully", "success");
      loadMessages(currentPage, statusFilter);
      loadStats();
      if (selectedMessage?.id === messageId) {
        setSelectedMessage({ ...selectedMessage, status: newStatus as any });
      }
    } catch (error: any) {
      showToast(error?.message || "Failed to update status", "error");
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) {
      showToast("Please enter a reply message", "error");
      return;
    }

    setReplyLoading(true);
    try {
      await apiRequest("/api/contact/reply", {
        method: "POST",
        body: JSON.stringify({
          messageId: selectedMessage.id,
          reply: replyText
        })
      });
      showToast("Reply sent successfully", "success");
      setReplyText("");
      setShowReplyModal(false);
      loadMessages(currentPage, statusFilter);
      loadStats();
      
      const response = await apiRequest("/api/contact/message", {
        method: "POST",
        body: JSON.stringify({ messageId: selectedMessage.id })
      }) as { data?: ContactMessage };
      setSelectedMessage(response.data || selectedMessage);
    } catch (error: any) {
      showToast(error?.message || "Failed to send reply", "error");
    } finally {
      setReplyLoading(false);
    }
  };

  const handleDeleteMessage = (messageId: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Message",
      message: "Are you sure you want to delete this message? This action cannot be undone.",
      isDangerous: true,
      onConfirm: async () => {
        try {
          await apiRequest("/api/contact/delete", {
            method: "POST",
            body: JSON.stringify({ messageId })
          });
          showToast("Message deleted successfully", "success");
          loadMessages(currentPage, statusFilter);
          loadStats();
          setSelectedMessage(null);
        } catch (error: any) {
          showToast(error?.message || "Failed to delete message", "error");
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const filteredMessages = messages.filter(msg =>
    msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.phone.includes(searchTerm)
  );

  return (
    <div style={{ fontFamily: "var(--font-sans)", color: "var(--text)", padding: "20px 24px" }}>
      <style>{`
        .contacts-wrapper { max-width: 1440px; margin: 0 auto; }

        .page-header { margin-bottom: 28px; }
        .page-title { font-family: var(--font-heading); font-size: 32px; font-weight: 700; color: var(--text); margin: 0 0 8px; display: flex; align-items: center; gap: 14px; }
        .page-subtitle { color: var(--muted); margin: 0; font-size: 13px; font-weight: 500; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 28px; }
        .stat-card { background: var(--surface); border-radius: 8px; padding: 18px; box-shadow: 0 1px 3px rgba(26, 45, 31, 0.06); border-left: 4px solid var(--brand); transition: all 0.2s ease; }
        .stat-card:hover { box-shadow: 0 2px 6px rgba(26, 45, 31, 0.1); }
        .stat-label { font-size: 10px; color: var(--muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px; }
        .stat-value { font-family: var(--font-heading); font-size: 26px; font-weight: 700; margin: 0; color: var(--brand); }

        .controls-bar { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; align-items: center; }
        .search-box { flex: 1; min-width: 220px; }
        .search-input { width: 100%; padding: 10px 13px; border: 1px solid var(--line); border-radius: 6px; font-size: 13px; background: var(--surface); color: var(--text); font-family: var(--font-sans); }
        .search-input::placeholder { color: var(--muted); }
        .search-input:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 2px rgba(47, 107, 63, 0.08); }

        .status-filter { padding: 10px 13px; border: 1px solid var(--line); border-radius: 6px; background: var(--surface); font-size: 13px; cursor: pointer; color: var(--text); font-family: var(--font-sans); }
        .status-filter:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 2px rgba(47, 107, 63, 0.08); }

        .main-layout { display: grid; grid-template-columns: 1fr 1.3fr; gap: 20px; }
        @media (max-width: 1000px) { .main-layout { grid-template-columns: 1fr; } }

        .panel { background: var(--surface); border-radius: 8px; box-shadow: 0 1px 3px rgba(26, 45, 31, 0.06); display: flex; flex-direction: column; height: 650px; overflow: hidden; border: 1px solid var(--line); }

        .panel-header { padding: 16px 18px; border-bottom: 1px solid var(--line); background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%); color: white; font-size: 14px; font-weight: 700; font-family: var(--font-heading); }

        .list-container { flex: 1; overflow-y: auto; }
        .list-container::-webkit-scrollbar { width: 6px; }
        .list-container::-webkit-scrollbar-track { background: transparent; }
        .list-container::-webkit-scrollbar-thumb { background: var(--brand); border-radius: 3px; opacity: 0.4; }

        .message-item { padding: 14px 16px; border-bottom: 1px solid var(--line); cursor: pointer; transition: background-color 0.15s; border-left: 3px solid transparent; }
        .message-item:hover { background-color: var(--surface-muted); }
        .message-item.active { background-color: #f0f8f5; border-left-color: var(--brand); }

        .item-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; gap: 10px; }
        .item-name { font-weight: 700; color: var(--text); margin: 0; flex: 1; font-size: 13px; font-family: var(--font-heading); }
        .item-badge { display: inline-block; padding: 3px 9px; border-radius: 3px; font-size: 9px; font-weight: 700; color: white; text-transform: uppercase; white-space: nowrap; letter-spacing: 0.3px; }
        .item-email { font-size: 11px; color: var(--muted); margin: 3px 0 0; font-weight: 500; }
        .item-preview { font-size: 12px; color: var(--muted); margin: 5px 0 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4; }

        .empty-state { padding: 50px 20px; text-align: center; color: var(--muted); font-size: 13px; }

        .detail-panel { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; }
        .detail-panel::-webkit-scrollbar { width: 6px; }
        .detail-panel::-webkit-scrollbar-track { background: transparent; }
        .detail-panel::-webkit-scrollbar-thumb { background: var(--brand); border-radius: 3px; opacity: 0.4; }

        .detail-section { margin-bottom: 20px; }
        .detail-label { font-size: 10px; color: var(--muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
        .detail-value { font-size: 13px; color: var(--text); line-height: 1.6; }
        .detail-value a { color: var(--brand); text-decoration: none; font-weight: 600; }
        .detail-value a:hover { text-decoration: underline; }

        .message-content { background: var(--surface-muted); padding: 12px; border-radius: 6px; border-left: 3px solid var(--brand); font-size: 12px; color: var(--text); white-space: pre-wrap; word-break: break-word; max-height: 110px; overflow-y: auto; line-height: 1.5; }
        .reply-content { background: #f0f8f5; padding: 12px; border-radius: 6px; border-left: 3px solid #2f6b3f; font-size: 12px; color: var(--text); white-space: pre-wrap; word-break: break-word; max-height: 110px; overflow-y: auto; line-height: 1.5; }

        .status-dropdown { width: 100%; padding: 9px 11px; border: 1px solid var(--line); border-radius: 6px; font-size: 13px; background: var(--surface); color: var(--text); cursor: pointer; font-family: var(--font-sans); }
        .status-dropdown:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 2px rgba(47, 107, 63, 0.08); }

        .reply-box { width: 100%; min-height: 75px; padding: 11px; border: 1px solid var(--line); border-radius: 6px; font-size: 12px; resize: vertical; color: var(--text); background: var(--surface); font-family: var(--font-sans); margin-bottom: 10px; }
        .reply-box:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 2px rgba(47, 107, 63, 0.08); }

        .btn-group { display: flex; gap: 10px; margin-top: auto; }
        .btn { padding: 9px 14px; border: none; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px; font-family: var(--font-sans); }
        .btn-primary { background: var(--brand); color: white; flex: 1; }
        .btn-primary:hover:not(:disabled) { background: var(--brand-dark); }
        .btn-danger { background: var(--danger); color: white; }
        .btn-danger:hover:not(:disabled) { background: #8a1a12; }
        .btn-secondary { background: var(--surface); color: var(--text); border: 1px solid var(--line); flex: 1; }
        .btn-secondary:hover:not(:disabled) { background: var(--surface-muted); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .footer-actions { padding: 14px 16px; border-top: 1px solid var(--line); display: flex; gap: 10px; }

        .pagination { padding: 12px; border-top: 1px solid var(--line); display: flex; justify-content: center; align-items: center; gap: 8px; }
        .pag-btn { padding: 7px 11px; border: 1px solid var(--line); background: var(--surface); border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.15s; color: var(--text); font-family: var(--font-sans); font-weight: 600; }
        .pag-btn:hover:not(:disabled) { border-color: var(--brand); background: #f0f8f5; color: var(--brand); }
        .pag-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pag-info { font-size: 12px; color: var(--muted); min-width: 90px; text-align: center; font-weight: 600; }

        .no-selection { padding: 60px 20px; text-align: center; color: var(--muted); }
        .no-selection svg { opacity: 0.2; margin-bottom: 14px; }
        .no-selection p { margin: 0; font-size: 13px; }
      `}</style>

      <div className="contacts-wrapper">
        <div className="page-header">
          <h1 className="page-title">
            <Mail size={28} />
            Contact Messages
          </h1>
          <p className="page-subtitle">Manage and respond to customer inquiries</p>
        </div>

        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total</div>
              <p className="stat-value">{stats.total}</p>
            </div>
            <div className="stat-card" style={{ borderLeftColor: "#b42318" }}>
              <div className="stat-label">New</div>
              <p className="stat-value" style={{ color: "#b42318" }}>{stats.new_count}</p>
            </div>
            <div className="stat-card" style={{ borderLeftColor: "#2daaa3" }}>
              <div className="stat-label">Read</div>
              <p className="stat-value" style={{ color: "#2daaa3" }}>{stats.read_count}</p>
            </div>
            <div className="stat-card" style={{ borderLeftColor: "#3b7ab7" }}>
              <div className="stat-label">Replied</div>
              <p className="stat-value" style={{ color: "#3b7ab7" }}>{stats.replied_count}</p>
            </div>
            <div className="stat-card" style={{ borderLeftColor: "#209662" }}>
              <div className="stat-label">Closed</div>
              <p className="stat-value" style={{ color: "#209662" }}>{stats.closed_count}</p>
            </div>
          </div>
        )}

        <div className="controls-bar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search name, email, phone..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="status-filter">
            <option value="all">All Messages</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="main-layout">
          <div className="panel">
            <div className="panel-header">Messages ({messages.length})</div>
            {loading ? (
              <div className="empty-state">Loading messages...</div>
            ) : filteredMessages.length === 0 ? (
              <div className="empty-state">No messages found</div>
            ) : (
              <>
                <div className="list-container">
                  {filteredMessages.map((msg) => (
                    <div key={msg.id} className={`message-item ${selectedMessage?.id === msg.id ? "active" : ""}`} onClick={() => handleViewMessage(msg)}>
                      <div className="item-header">
                        <h3 className="item-name">{msg.name}</h3>
                        <div
                          className="item-badge"
                          style={{
                            backgroundColor:
                              msg.status === "new"
                                ? "#b42318"
                                : msg.status === "read"
                                ? "#2daaa3"
                                : msg.status === "replied"
                                ? "#3b7ab7"
                                : "#209662"
                          }}
                        >
                          {msg.status}
                        </div>
                      </div>
                      <div className="item-email">{msg.email}</div>
                      <p className="item-preview">{msg.message}</p>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="pagination">
                    <button className="pag-btn" onClick={() => loadMessages(currentPage - 1, statusFilter)} disabled={currentPage === 1}>
                      <ChevronLeft size={14} />
                    </button>
                    <div className="pag-info">Page {currentPage} / {totalPages}</div>
                    <button className="pag-btn" onClick={() => loadMessages(currentPage + 1, statusFilter)} disabled={currentPage === totalPages}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {selectedMessage ? (
            <div className="panel">
              <div className="panel-header">Message Details</div>
              <div className="detail-panel">
                <div className="detail-section">
                  <div className="detail-label"><User size={12} /> Name</div>
                  <div className="detail-value">{selectedMessage.name}</div>
                </div>
                <div className="detail-section">
                  <div className="detail-label"><Mail size={12} /> Email</div>
                  <div className="detail-value"><a href={`mailto:${selectedMessage.email}`}>{selectedMessage.email}</a></div>
                </div>
                <div className="detail-section">
                  <div className="detail-label"><Phone size={12} /> Phone</div>
                  <div className="detail-value"><a href={`tel:${selectedMessage.phone}`}>{selectedMessage.phone}</a></div>
                </div>
                <div className="detail-section">
                  <div className="detail-label"><Clock size={12} /> Submitted</div>
                  <div className="detail-value">{formatDate(selectedMessage.created_at)}</div>
                </div>
                <div className="detail-section">
                  <div className="detail-label"><MessageSquare size={12} /> Message</div>
                  <div className="message-content">{selectedMessage.message}</div>
                </div>
                <div className="detail-section">
                  <div className="detail-label">Status</div>
                  <select value={selectedMessage.status} onChange={(e) => handleStatusChange(selectedMessage.id, e.target.value)} className="status-dropdown">
                    <option value="new">New</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                {selectedMessage.admin_reply && (
                  <div className="detail-section">
                    <div className="detail-label"><Send size={12} /> Reply</div>
                    <div className="reply-content">{selectedMessage.admin_reply}</div>
                  </div>
                )}
                {!showReplyModal && !selectedMessage.admin_reply && (
                  <button onClick={() => setShowReplyModal(true)} className="btn btn-primary" style={{ marginTop: "auto" }}>
                    <Send size={13} /> Send Reply
                  </button>
                )}
                {showReplyModal && (
                  <div className="detail-section">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      className="reply-box"
                    />
                    <div className="btn-group">
                      <button onClick={handleSendReply} disabled={replyLoading || !replyText.trim()} className="btn btn-primary">
                        {replyLoading ? "Sending..." : "Send"}
                      </button>
                      <button
                        onClick={() => {
                          setShowReplyModal(false);
                          setReplyText("");
                        }}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="footer-actions">
                <button onClick={() => handleDeleteMessage(selectedMessage.id)} className="btn btn-danger">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="panel">
              <div className="no-selection">
                <Mail size={56} />
                <p>Select a message to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmModal.isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(23, 35, 27, 0.4)", backdropFilter: "blur(2px)" }} onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} />
          <div style={{ position: "relative", zIndex: 10, backgroundColor: "var(--surface)", borderRadius: "8px", boxShadow: "0 20px 48px rgba(26, 45, 31, 0.15)", padding: "28px 24px", maxWidth: "420px", width: "90vw" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--text)", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", backgroundColor: confirmModal.isDangerous ? "#fef2f2" : "#f0f8f5" }}>
                {confirmModal.isDangerous ? "⚠️" : "❓"}
              </span>
              {confirmModal.title}
            </h3>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 24px", lineHeight: "1.6" }}>
              {confirmModal.message}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                style={{ padding: "9px 18px", border: "1px solid var(--line)", backgroundColor: "var(--surface)", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans)", color: "var(--text)", transition: "all 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-muted)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--surface)")}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                style={{ padding: "9px 18px", backgroundColor: confirmModal.isDangerous ? "var(--danger)" : "var(--brand)", color: "white", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {confirmModal.isDangerous ? "Delete" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
