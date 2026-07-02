"use client";

import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { AdminModule } from "@/components/admin-module";
import { Edit2, Trash2, MoreVertical } from "lucide-react";
import { ConfirmModal } from "@/components/confirm-modal";
import { apiRequest } from "@/lib/api";

const ALL_PERMISSIONS = [
  "dashboard:read",
  "products:read",
  "products:write",
  "productcategory:read",
  "productcategory:write",
  "production:read",
  "production:write",
  "orders:read",
  "orders:write",
  "attendance:read",
  "attendance:write",
  "employees:read",
  "employees:write",
  "payments:read",
  "payments:write",
  "billing:read",
  "billing:write",
  "ledger:read",
  "bookings:read",
  "bookings:write",
  "dispatch:read",
  "dispatch:write",
  "wages:read",
  "reports:read",
  "users:read",
  "users:write",
  "roles:read",
  "roles:write",
  "*"
];

export default function RolesPage() {
  const [values, setValues] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);
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

  function validateForm(vals: Record<string, any>) {
    const errors: Record<string, string> = {};
    if (!vals.name) errors.name = "Role Name is required";
    return Object.keys(errors).length ? errors : null;
  }

  async function handleDelete(row: any, reload: () => Promise<void>) {
    setConfirmState({
      isOpen: true,
      title: "Delete Role",
      message: `Are you sure you want to delete the role ${row.name}?`,
      confirmText: "Delete",
      isDestructive: true,
      action: async () => {
        setBusy(true);
        try {
          await apiRequest("/api/roles/delete", {
            method: "POST",
            body: JSON.stringify({ roleId: row.id })
          });
          await reload();
        } catch (error) {
          alert(error instanceof Error ? error.message : "Failed to delete role");
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
      permissions: Array.isArray(row.permissions) ? row.permissions : []
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <AdminModule
        eyebrow="User Management"
        title="Roles"
        listPath="/api/roles"
        submitPath="/api/roles"
        submitMethod={values.id ? "PATCH" : "POST"}
        submitLabel={values.id ? "Update Role" : "Save Role"}
        values={values}
        onValuesChange={setValues}
        onSuccess={() => setValues({})}
        onCancel={values.id ? () => setValues({}) : undefined}
        validate={validateForm}
        fields={[
          { name: "name", label: "Role Name", required: true },
          {
            name: "permissions",
            label: "Permissions",
            type: "searchable-select",
            isMulti: true,
            options: ALL_PERMISSIONS.map(p => {
              if (p === "*") return { label: "All Permissions (*)", value: p };
              const [mod, act] = p.split(':');
              if (mod && act) {
                return {
                  label: `${mod.charAt(0).toUpperCase() + mod.slice(1)}: ${act.charAt(0).toUpperCase() + act.slice(1)}`,
                  value: p
                };
              }
              return { label: p, value: p };
            })
          }
        ]}
        columns={[
          { key: "id", label: "ID" },
          { key: "name", label: "Role Name" },
          { key: "permissions", label: "Permissions" }
        ]}
        renderCell={(row, column) => {
          if (column.key === "name") {
            const labelMap: Record<string, string> = {
              "super_admin": "Super Admin",
              "staff_user": "Staff User",
              "billing_user": "Billing User",
              "customer": "Customer"
            };
            return labelMap[row.name] || <span style={{ textTransform: "capitalize" }}>{typeof row.name === 'string' ? row.name.replace(/_/g, ' ') : row.name}</span>;
          }
          if (column.key === "permissions") {
            const perms = Array.isArray(row.permissions) ? row.permissions : [];
            if (perms.includes("*")) {
              return <span className="status-badge status-paid">All Permissions (*)</span>;
            }

            const groupedPerms: Record<string, string[]> = {};
            perms.forEach((p: string) => {
              const [module, action] = p.split(':');
              if (module && action) {
                if (!groupedPerms[module]) groupedPerms[module] = [];
                groupedPerms[module].push(action);
              } else {
                if (!groupedPerms[p]) groupedPerms[p] = [];
              }
            });

            const formattedPerms = Object.entries(groupedPerms).map(([module, actions]) => {
              if (actions.length === 0) return module;
              const sortedActions = actions.sort((a, b) => (a === 'read' ? -1 : 1));
              return `${module}: ${sortedActions.join('/')}`;
            });

            return (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {formattedPerms.length === 0 ? <span style={{ color: "var(--meta)" }}>None</span> : null}
                {formattedPerms.map((p: string) => (
                  <span key={p} style={{ background: "rgba(47, 107, 63, 0.1)", padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem", border: "1px solid rgba(47, 107, 63, 0.2)" }}>
                    {p}
                  </span>
                ))}
              </div>
            );
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
