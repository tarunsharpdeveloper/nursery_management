"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin-shell";
import { AdminModule } from "@/components/admin-module";
import { Edit2, Power, PowerOff, Trash2 } from "lucide-react";
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
    }
  }

  async function handleDelete(row: any, reload: () => Promise<void>) {
    if (!confirm(`Are you sure you want to delete ${row.name}?`)) return;
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
    }
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
    <AdminShell>
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
        rowActions={(row, reload) => (
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            <button className="button secondary" type="button" title="Edit" onClick={() => handleEdit(row)} disabled={busy} style={{ padding: "6px" }}>
              <Edit2 size={16} />
            </button>
            <button className="button secondary" type="button" title="Delete" onClick={() => handleDelete(row, reload)} disabled={busy} style={{ padding: "6px" }}>
              <Trash2 size={16} color="#ef4444" />
            </button>
            <button className="button secondary" type="button" title={row.is_active ? "Disable" : "Enable"} onClick={() => handleToggle(row, reload)} disabled={busy} style={{ padding: "6px" }}>
              {row.is_active ? <PowerOff size={16} /> : <Power size={16} />}
            </button>
          </div>
        )}
      />
    </AdminShell>
  );
}
