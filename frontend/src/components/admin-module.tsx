"use client";

import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { RefreshCw, Save } from "lucide-react";
import { apiRequest } from "@/lib/api";

type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "searchable-select" | "textarea";
  options?: { label: string; value: string | number }[];
  valueType?: "string" | "number";
  placeholder?: string;
};

type AdminModuleProps = {
  eyebrow: string;
  title: string;
  listPath: string;
  submitPath?: string;
  submitMethod?: "POST" | "PATCH";
  submitLabel?: string;
  fields?: Field[];
  columns: { key: string; label: string }[];
  initialValues?: Record<string, string | number>;
  values?: Record<string, string | number>;
  onValuesChange?: (values: Record<string, string | number>) => void;
  transformSubmit?: (values: Record<string, string | number>) => unknown;
  onSuccess?: () => void;
};

function formatCell(value: unknown) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number") return value.toLocaleString("en-IN");
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);
  return String(value);
}

export function AdminModule({
  eyebrow,
  title,
  listPath,
  submitPath,
  submitMethod = "POST",
  submitLabel = "Save",
  fields = [],
  columns,
  initialValues = {},
  values: externalValues,
  onValuesChange,
  transformSubmit,
  onSuccess
}: AdminModuleProps) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [internalValues, setInternalValues] = useState<Record<string, string | number>>(initialValues);
  const [status, setStatus] = useState("Loading...");
  const [busy, setBusy] = useState(false);

  const values = externalValues !== undefined ? externalValues : internalValues;

  const updateValues = (nextValues: Record<string, string | number> | ((current: Record<string, string | number>) => Record<string, string | number>)) => {
    if (onValuesChange) {
      onValuesChange(typeof nextValues === "function" ? nextValues(values) : nextValues);
    } else {
      setInternalValues(nextValues);
    }
  };

  const canSubmit = Boolean(submitPath && fields.length);
  const normalizedFields = useMemo(() => fields, [fields]);

  async function loadRows() {
    setBusy(true);
    try {
      const data = await apiRequest<Record<string, unknown>[]>(listPath);
      setRows(Array.isArray(data) ? data : []);
      setStatus(`Loaded ${Array.isArray(data) ? data.length : 0} records`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load records");
      setRows([]);
    } finally {
      setBusy(false);
    }
  }

  async function submitForm() {
    if (!submitPath) return;

    setBusy(true);
    try {
      await apiRequest(submitPath, {
        method: submitMethod,
        body: JSON.stringify(transformSubmit ? transformSubmit(values) : values)
      });
      setStatus("Saved successfully");
      await loadRows();
      if (!externalValues) setInternalValues(initialValues);
      if (onSuccess) onSuccess();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, [listPath]);

  return (
    <>
      <div className="section-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="meta">{status}</p>
        </div>
        <button className="button secondary" type="button" onClick={loadRows} disabled={busy}>
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {canSubmit ? (
        <form className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div className="form-grid">
              {normalizedFields.map((field) => (
                <label className="field" key={field.name}>
                  <span>{field.label}</span>
                  {field.type === "select" ? (
                    <select
                      value={values[field.name] ?? ""}
                      onChange={(event) => {
                        const nextValue = field.valueType === "number" ? Number(event.target.value) : event.target.value;
                        updateValues((current) => ({ ...current, [field.name]: nextValue }));
                      }}
                    >
                      <option value="">Select</option>
                      {(field.options || []).map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : field.type === "searchable-select" ? (
                    <Select 
                      options={field.options}
                      value={field.options?.find(o => String(o.value) === String(values[field.name])) || null}
                      onChange={(option: any) => {
                        const nextValue = option ? (field.valueType === "number" ? Number(option.value) : option.value) : "";
                        updateValues((current) => ({ ...current, [field.name]: nextValue }));
                      }}
                      isClearable
                      placeholder={field.placeholder || "Select"}
                      styles={{ 
                        container: (base) => ({ ...base, width: '100%' }),
                        control: (base, state) => ({
                          ...base,
                          minHeight: '50px',
                          height: '50px',
                          borderRadius: '8px',
                          borderColor: state.isFocused ? 'rgba(47, 107, 63, 0.65)' : 'var(--line)',
                          boxShadow: state.isFocused ? '0 0 0 1px rgba(47, 107, 63, 0.24)' : 'none',
                          '&:hover': {
                            borderColor: state.isFocused ? 'rgba(47, 107, 63, 0.65)' : 'var(--line)'
                          }
                        }),
                        valueContainer: (base) => ({
                          ...base,
                          height: '48px',
                          padding: '0 11px'
                        }),
                        indicatorsContainer: (base) => ({
                          ...base,
                          height: '48px'
                        }),
                        input: (base) => ({
                          ...base,
                          margin: 0,
                          padding: 0
                        })
                      }}
                    />
                  ) : field.type === "textarea" ? (
                    <textarea
                      rows={3}
                      placeholder={field.placeholder}
                      value={values[field.name] ?? ""}
                      onChange={(event) => updateValues((current) => ({ ...current, [field.name]: event.target.value }))}
                    />
                  ) : (
                    <input
                      type={field.type || "text"}
                      placeholder={field.placeholder}
                      value={values[field.name] ?? ""}
                      onChange={(event) => {
                        const nextValue = field.valueType === "number" ? Number(event.target.value) : event.target.value;
                        updateValues((current) => ({ ...current, [field.name]: nextValue }));
                      }}
                    />
                  )}
                </label>
              ))}
            </div>
            <button className="button" type="button" onClick={submitForm} disabled={busy} style={{ marginTop: 16 }}>
              <Save size={17} />
              {submitLabel}
            </button>
          </div>
        </form>
      ) : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => <th key={column.key}>{column.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row, index) => (
              <tr key={String(row.id ?? row.order_number ?? row.booking_number ?? index)}>
                {columns.map((column) => <td key={column.key}>{formatCell(row[column.key])}</td>)}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length}>No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
