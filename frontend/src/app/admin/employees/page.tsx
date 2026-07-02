"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin-shell";
import { AdminModule } from "@/components/admin-module";
import { Edit2, Power, PowerOff, Trash2, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useRouter } from "next/navigation";

type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "searchable-select" | "textarea";
  options?: { label: string; value: string | number }[];
  valueType?: "string" | "number";
  placeholder?: string;
  required?: boolean;
};

export default function EmployeesPage() {
  const [values, setValues] = useState<Record<string, string | number>>({});
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const baseFields: Field[] = [
    { name: "name", label: "Employee Name", required: true },
    { name: "mobile", label: "Mobile", required: true },
    { name: "gender", label: "Gender", type: "select", options: [{ label: "Male", value: "male" }, { label: "Female", value: "female" }, { label: "Other", value: "other" }], required: true },
    { name: "joiningDate", label: "Joining Date", type: "date", required: true },
    { name: "employeeType", label: "Employee Type", type: "select", options: [{ label: "Monthly Salary", value: "monthly_salary" }, { label: "Daily Wage", value: "daily_wage" }], required: true },
  ];

  const fields = [...baseFields];
  
  if (values.employeeType === "monthly_salary") {
    fields.push({ name: "monthlySalary", label: "Monthly Salary", type: "number", valueType: "number", required: true });
  } else if (values.employeeType === "daily_wage") {
    fields.push({ name: "dailyWage", label: "Daily Wage", type: "number", valueType: "number", required: true });
  }

  function validateForm(vals: Record<string, string | number>) {
    const errors: Record<string, string> = {};
    if (!vals.name) errors.name = "Name is required";
    if (!vals.mobile) errors.mobile = "Mobile is required";
    if (!vals.gender) errors.gender = "Gender is required";
    if (!vals.joiningDate) errors.joiningDate = "Joining Date is required";
    if (!vals.employeeType) errors.employeeType = "Employee Type is required";
    
    if (vals.employeeType === "monthly_salary" && !vals.monthlySalary) {
      errors.monthlySalary = "Monthly Salary is required";
    }
    if (vals.employeeType === "daily_wage" && !vals.dailyWage) {
      errors.dailyWage = "Daily Wage is required";
    }
    return errors;
  }

  async function handleToggle(row: any, reload: () => Promise<void>) {
    setBusy(true);
    try {
      await apiRequest("/api/employees/toggle", {
        method: "PATCH",
        body: JSON.stringify({ employeeId: row.id, isActive: !row.is_active })
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
      await apiRequest("/api/employees/delete", {
        method: "POST",
        body: JSON.stringify({ employeeId: row.id })
      });
      await reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete employee");
    } finally {
      setBusy(false);
    }
  }

  function handleEdit(row: any) {
    setValues({
      id: row.id,
      name: row.name,
      mobile: row.mobile,
      gender: row.gender,
      joiningDate: row.joining_date ? new Date(row.joining_date).toISOString().slice(0, 10) : "",
      employeeType: row.employee_type,
      monthlySalary: row.monthly_salary || "",
      dailyWage: row.daily_wage || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <AdminShell>
      <AdminModule
        eyebrow="Employee Master"
        title="Monthly Salary and Daily Wage Employees"
        listPath="/api/employees"
        submitPath="/api/employees"
        submitMethod={values.id ? "PATCH" : "POST"}
        submitLabel={values.id ? "Update Employee" : "Save Employee"}
        values={values}
        onValuesChange={setValues}
        onSuccess={() => setValues({})}
        onCancel={values.id ? () => setValues({}) : undefined}
        validate={validateForm}
        transformSubmit={(v) => ({
          ...v,
          monthlySalary: v.monthlySalary ? Number(v.monthlySalary) : undefined,
          dailyWage: v.dailyWage ? Number(v.dailyWage) : undefined
        })}
        fields={fields}
        columns={[
          { key: "id", label: "ID" },
          { key: "name", label: "Employee" },
          { key: "mobile", label: "Mobile" },
          { key: "gender", label: "Gender" },
          { key: "employee_type", label: "Type" },
          { key: "monthly_salary", label: "Salary" },
          { key: "daily_wage", label: "Wage" },
          { key: "is_active", label: "Status" }
        ]}
        renderCell={(row, column, reload) => {
          if (column.key === "is_active") {
            return (
              <span className={`status-badge ${row.is_active ? "status-paid" : "status-failed"}`}>
                {row.is_active ? "Active" : "Inactive"}
              </span>
            );
          }
          if (column.key === "employee_type") {
            return row.employee_type === "monthly_salary" ? "Monthly Salary" : (row.employee_type === "daily_wage" ? "Daily Wage" : row.employee_type);
          }
          return undefined;
        }}
        rowActions={(row, reload) => (
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            <button className="button secondary" type="button" title="View Attendance" onClick={() => router.push(`/admin/attendance-details?id=${row.id}`)} disabled={busy} style={{ padding: "6px" }}>
              <Calendar size={16} color="#3b82f6" />
            </button>
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
