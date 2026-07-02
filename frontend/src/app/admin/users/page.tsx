"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin-shell";
import { AdminModule } from "@/components/admin-module";
import { Edit2, Power, PowerOff, Trash2, MoreVertical } from "lucide-react";
import { ConfirmModal } from "@/components/confirm-modal";
import { apiRequest } from "@/lib/api";

type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "searchable-select" | "textarea" | "email" | "password";
  options?: { label: string; value: string | number }[];
  valueType?: "string" | "number";
  placeholder?: string;
  required?: boolean;
};

export default function UsersPage() {
  const [values, setValues] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
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

  useEffect(() => {
    apiRequest("/api/roles").then((data: any) => setRoles(data || [])).catch(() => {});
  }, []);

  const fields: Field[] = [
    { name: "name", label: "Name", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { 
      name: "role", 
      label: "Role", 
      type: "select", 
      options: roles.map(r => ({ label: r.name, value: r.name })), 
      required: true 
    }
  ];

  if (!values.id) {
    fields.push({
      name: "password",
      label: "Password",
      type: "password", // This uses "text" on actual form but handles password format nicely, if input type isn't password it's okay because AdminModule defaults to text if type is unknown. Wait, AdminModule handles type={field.type || "text"} so type="password" will correctly render an <input type="password" />!
      required: true
    });
  }

  function validateForm(vals: Record<string, any>) {
    const errors: Record<string, string> = {};
    if (!vals.name) errors.name = "Name is required";
    if (!vals.email) errors.email = "Email is required";
    if (!vals.role) errors.role = "Role is required";
    if (!vals.id && !vals.password) errors.password = "Password is required for new users";
    return Object.keys(errors).length ? errors : null;
  }

  async function handleToggle(row: any, reload: () => Promise<void>) {
    setConfirmState({
      isOpen: true,
      title: `${row.is_active ? "Disable" : "Enable"} User`,
      message: `Are you sure you want to ${row.is_active ? "disable" : "enable"} ${row.name}?`,
      confirmText: row.is_active ? "Disable" : "Enable",
      isDestructive: row.is_active,
      action: async () => {
        setBusy(true);
        try {
          await apiRequest("/api/users/toggle", {
            method: "PATCH",
            body: JSON.stringify({ userId: row.id, isActive: !row.is_active })
          });
          await reload();
        } catch (error) {
          alert(error instanceof Error ? error.message : "Failed to toggle status");
        } finally {
          setBusy(false);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  }

  async function handleDelete(row: any, reload: () => Promise<void>) {
    setConfirmState({
      isOpen: true,
      title: "Delete User",
      message: `Are you sure you want to delete ${row.name}?`,
      confirmText: "Delete",
      isDestructive: true,
      action: async () => {
        setBusy(true);
        try {
          await apiRequest("/api/users/delete", {
            method: "POST",
            body: JSON.stringify({ userId: row.id })
          });
          await reload();
        } catch (error) {
          alert(error instanceof Error ? error.message : "Failed to delete user");
        } finally {
          setBusy(false);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  }

  function handleEdit(row: any) {
    setValues({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <AdminModule
        eyebrow="User Management"
        title="Users"
        listPath="/api/users"
        submitPath="/api/users"
        submitMethod={values.id ? "PATCH" : "POST"}
        submitLabel={values.id ? "Update User" : "Save User"}
        values={values}
        onValuesChange={setValues}
        onSuccess={() => setValues({})}
        onCancel={values.id ? () => setValues({}) : undefined}
        validate={validateForm}
        fields={fields as any} // Cast because AdminModule type might not strictly accept "email"|"password"
        columns={[
          { key: "id", label: "ID" },
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "is_active", label: "Status" }
        ]}
        renderCell={(row, column) => {
          if (column.key === "is_active") {
            return (
              <span className={`status-badge ${row.is_active ? "status-paid" : "status-failed"}`}>
                {row.is_active ? "Active" : "Inactive"}
              </span>
            );
          }
          if (column.key === "role") {
            const labelMap: Record<string, string> = {
              "super_admin": "Super Admin",
              "staff_user": "Staff User",
              "billing_user": "Billing User",
              "customer": "Customer"
            };
            return labelMap[row.role] || <span style={{ textTransform: "capitalize" }}>{typeof row.role === 'string' ? row.role.replace(/_/g, ' ') : row.role}</span>;
          }
          return undefined;
        }}
        rowActions={(row, reload, openModal) => (
          <div className="actions-cell" style={{ position: "relative" }}>
            <button 
              className="button secondary" 
              type="button" 
              onClick={(e) => {
                if (openActionId === row.id) {
                  setOpenActionId(null);
                } else {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const spaceBelow = window.innerHeight - rect.bottom;
                  setDropdownDirection(spaceBelow < 200 ? "up" : "down");
                  setOpenActionId(row.id);
                }
              }}
              disabled={busy} 
              style={{ padding: "6px" }}
            >
              <MoreVertical size={16} />
            </button>
            
            {openActionId === row.id && (
              <>
                <div 
                  className="actions-dropdown-overlay" 
                  onClick={(e) => { e.stopPropagation(); setOpenActionId(null); }} 
                />
                <div className={`actions-dropdown-menu direction-${dropdownDirection}`}>
                  <button 
                    className="button secondary actions-dropdown-item" 
                    type="button" 
                    onClick={() => { setOpenActionId(null); handleEdit(row); openModal(); }} 
                    disabled={busy}
                  >
                    <Edit2 size={16} style={{ marginRight: 8 }} />
                    Edit
                  </button>
                  <button 
                    className="button secondary actions-dropdown-item" 
                    type="button" 
                    onClick={() => { setOpenActionId(null); handleToggle(row, reload); }} 
                    disabled={busy}
                  >
                    {row.is_active ? <PowerOff size={16} style={{ marginRight: 8 }} /> : <Power size={16} style={{ marginRight: 8 }} />}
                    {row.is_active ? "Disable" : "Enable"}
                  </button>
                  <button 
                    className="button secondary actions-dropdown-item danger" 
                    type="button" 
                    onClick={() => { setOpenActionId(null); handleDelete(row, reload); }} 
                    disabled={busy}
                  >
                    <Trash2 size={16} color="#ef4444" style={{ marginRight: 8 }} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      />
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
