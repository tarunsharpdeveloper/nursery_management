"use client";

import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { AdminModule } from "@/components/admin-module";
import { Edit2, Trash2 } from "lucide-react";
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

  function validateForm(vals: Record<string, any>) {
    const errors: Record<string, string> = {};
    if (!vals.name) errors.name = "Role Name is required";
    return Object.keys(errors).length ? errors : null;
  }

  async function handleDelete(row: any, reload: () => Promise<void>) {
    if (!confirm(`Are you sure you want to delete the role ${row.name}?`)) return;
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
    }
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
    <AdminShell>
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
        rowActions={(row, reload) => (
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            <button className="button secondary" type="button" title="Edit" onClick={() => handleEdit(row)} disabled={busy} style={{ padding: "6px" }}>
              <Edit2 size={16} />
            </button>
            <button className="button secondary" type="button" title="Delete" onClick={() => handleDelete(row, reload)} disabled={busy} style={{ padding: "6px" }}>
              <Trash2 size={16} color="#ef4444" />
            </button>
          </div>
        )}
      />
    </AdminShell>
  );
}
