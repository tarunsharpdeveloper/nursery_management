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
  required?: boolean;
  isMulti?: boolean;
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
  initialValues?: Record<string, any>;
  values?: Record<string, any>;
  onValuesChange?: (values: Record<string, any>) => void;
  transformSubmit?: (values: Record<string, any>) => unknown;
  validate?: (values: Record<string, any>) => Record<string, string> | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  headerActions?: React.ReactNode;
  rowActions?: (row: any, reload: () => Promise<void>) => React.ReactNode;
  filterContent?: React.ReactNode;
  filterRows?: (rows: any[]) => any[];
  renderCell?: (row: any, column: { key: string; label: string }, reload: () => Promise<void>) => React.ReactNode;
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
  validate,
  onSuccess,
  onCancel,
  headerActions,
  rowActions,
  filterContent,
  filterRows,
  renderCell
}: AdminModuleProps) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [internalValues, setInternalValues] = useState<Record<string, any>>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("Loading...");
  const [busy, setBusy] = useState(false);

  const values = externalValues !== undefined ? externalValues : internalValues;
  const displayedRows = filterRows ? filterRows(rows) : rows;

  const updateValues = (nextValues: Record<string, any> | ((current: Record<string, any>) => Record<string, any>)) => {
    if (onValuesChange) {
      onValuesChange(typeof nextValues === "function" ? nextValues(values) : nextValues);
    } else {
      setInternalValues(nextValues);
    }
  };

  const handleChange = (name: string, value: any) => {
    updateValues((current) => ({ ...current, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
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

    setFieldErrors({});
    if (validate) {
      const errors = validate(values);
      if (errors && Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setStatus("Validation Error: Please check the highlighted fields.");
        return;
      }
    }

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
          {/* <p className="meta">{status}</p> */}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {headerActions}
          <button className="button secondary" type="button" onClick={loadRows} disabled={busy}>
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </div>

      {canSubmit ? (
        <form className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div className="form-grid">
              {normalizedFields.map((field) => (
                <label className="field" key={field.name} style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>
                    {field.label}
                    {field.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                  </span>
                  {field.type === "select" ? (
                    <select
                      value={values[field.name] ?? ""}
                      onChange={(e) => handleChange(field.name, field.valueType === "number" ? Number(e.target.value) : e.target.value)}
                    >
                      <option value="">Select</option>
                      {(field.options || []).map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : field.type === "searchable-select" ? (
                    <Select
                      options={field.options}
                      isMulti={field.isMulti}
                      value={field.isMulti ? field.options?.filter(o => Array.isArray(values[field.name]) ? values[field.name].includes(String(o.value)) : false) : (field.options?.find(o => String(o.value) === String(values[field.name])) || null)}
                      onChange={(option: any) => {
                        if (field.isMulti) {
                          handleChange(field.name, option ? option.map((o: any) => o.value) : []);
                        } else {
                          handleChange(field.name, option ? (field.valueType === "number" ? Number(option.value) : option.value) : "");
                        }
                      }}
                      isClearable
                      placeholder={field.placeholder || "Select"}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      menuPosition="fixed"
                      styles={{
                        container: (base) => ({ ...base, width: '100%' }),
                        control: (base, state) => ({
                          ...base,
                          minHeight: '50px',
                          borderRadius: '8px',
                          borderColor: fieldErrors[field.name] ? '#ef4444' : (state.isFocused ? 'rgba(47, 107, 63, 0.65)' : 'var(--line)'),
                          boxShadow: state.isFocused ? '0 0 0 1px rgba(47, 107, 63, 0.24)' : 'none',
                          '&:hover': {
                            borderColor: fieldErrors[field.name] ? '#ef4444' : (state.isFocused ? 'rgba(47, 107, 63, 0.65)' : 'var(--line)')
                          }
                        }),
                        valueContainer: (base) => ({
                          ...base,
                          minHeight: '48px',
                          padding: '0 11px'
                        }),
                        indicatorsContainer: (base) => ({
                          ...base,
                          minHeight: '48px'
                        }),
                        input: (base) => ({
                          ...base,
                          margin: 0,
                          padding: 0
                        }),
                        menuList: (base) => ({
                          ...base,
                          maxHeight: '180px'
                        }),
                        menu: (base) => ({
                          ...base,
                          zIndex: 9999
                        }),
                        menuPortal: (base) => ({
                          ...base,
                          zIndex: 9999
                        })
                      }}
                    />
                  ) : field.type === "textarea" ? (
                    <textarea
                      rows={3}
                      placeholder={field.placeholder}
                      value={values[field.name] ?? ""}
                      style={fieldErrors[field.name] ? { borderColor: '#ef4444' } : {}}
                      onChange={(e) => handleChange(field.name, field.valueType === "number" ? Number(e.target.value) : e.target.value)}
                    />
                  ) : (
                    <input
                      type={field.type || "text"}
                      placeholder={field.placeholder}
                      value={values[field.name] ?? ""}
                      style={fieldErrors[field.name] ? { borderColor: '#ef4444' } : {}}
                      onChange={(e) => handleChange(field.name, field.valueType === "number" ? Number(e.target.value) : e.target.value)}
                    />
                  )}
                  {fieldErrors[field.name] && (
                    <span style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px', fontWeight: 500 }}>
                      {fieldErrors[field.name]}
                    </span>
                  )}
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: 16 }}>
              <button className="button" type="button" onClick={submitForm} disabled={busy}>
                <Save size={17} />
                {submitLabel}
              </button>
              {onCancel && (
                <button className="button secondary" type="button" onClick={onCancel} disabled={busy}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      ) : null}

      {filterContent && (
        <div style={{ marginBottom: '20px' }}>
          {filterContent}
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => <th key={column.key}>{column.label}</th>)}
              {rowActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {displayedRows.length ? displayedRows.map((row, index) => (
              <tr key={String(row.id ?? row.order_number ?? row.booking_number ?? index)}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {renderCell ? (renderCell(row, column, loadRows) ?? formatCell(row[column.key])) : formatCell(row[column.key])}
                  </td>
                ))}
                {rowActions && <td>{rowActions(row, loadRows)}</td>}
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
