"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin-shell";
import { apiRequest } from "@/lib/api";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar as CalendarIcon, Search } from "lucide-react";

type Status = "present" | "absent" | "half_day" | "leave";

const STATUS_LABELS: Record<Status, string> = {
  present: "Present",
  absent: "Absent",
  half_day: "Half Day",
  leave: "Leave"
};

const STATUS_COLORS: Record<Status, string> = {
  present: "#10b981",
  absent: "#ef4444",
  half_day: "#f59e0b",
  leave: "#3b82f6"
};

export default function EmployeeAttendancePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  });

  const [employee, setEmployee] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadData();
  }, [params.id]);

  async function loadData() {
    setBusy(true);
    try {
      const qs = new URLSearchParams({
        employeeId: params.id,
        startDate: startDate,
        endDate: endDate
      });
      const data = await apiRequest(`/api/attendance/employee?${qs.toString()}`) as any;
      setEmployee(data.employee);
      setAttendance(data.attendance.filter((a: any) => a.status !== "sunday_off"));
    } catch (error) {
      alert("Failed to load attendance data");
    } finally {
      setBusy(false);
    }
  }

  const totals = {
    present: attendance.filter(a => a.status === "present").length,
    absent: attendance.filter(a => a.status === "absent").length,
    half_day: attendance.filter(a => a.status === "half_day").length,
    leave: attendance.filter(a => a.status === "leave").length,
  };

  return (
    // <AdminShell>
      <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
          <button 
            onClick={() => router.push("/admin/employees")}
            style={{ 
              background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", 
              padding: "8px", cursor: "pointer", display: "flex", alignItems: "center", 
              justifyContent: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" 
            }}
          >
            <ArrowLeft size={20} color="#4b5563" />
          </button>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, color: "#111827" }}>
              {employee ? employee.name : "Loading Employee..."}
            </h1>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "0.9rem" }}>
              Attendance Details
              {employee && ` • ${employee.employee_type === "monthly_salary" ? "Monthly Salary" : "Daily Wage"}`}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb", marginBottom: "24px", display: "flex", gap: "24px", alignItems: "flex-end", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>Start Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", minWidth: "160px" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>End Date</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", minWidth: "160px" }}
            />
          </div>
          <button 
            className="button" 
            onClick={loadData} 
            disabled={busy}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px" }}
          >
            <Search size={18} />
            Filter Records
          </button>
        </div>

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          {Object.entries(totals).map(([key, count]) => {
            const statusKey = key as Status;
            return (
              <div key={key} style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "12px", border: `1px solid ${STATUS_COLORS[statusKey]}30`, borderLeft: `4px solid ${STATUS_COLORS[statusKey]}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {STATUS_LABELS[statusKey]}
                </p>
                <p style={{ margin: "8px 0 0", fontSize: "2rem", fontWeight: 700, color: STATUS_COLORS[statusKey] }}>
                  {count}
                </p>
              </div>
            );
          })}
        </div>

        {/* Detailed Table */}
        <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <table className="admin-table" style={{ width: "100%", margin: 0 }}>
            <thead>
              <tr>
                <th style={{ backgroundColor: "#f9fafb", padding: "16px", textAlign: "left", width: "200px" }}>Date</th>
                <th style={{ backgroundColor: "#f9fafb", padding: "16px", textAlign: "left", width: "200px" }}>Status</th>
                <th style={{ backgroundColor: "#f9fafb", padding: "16px", textAlign: "left" }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {busy ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: "60px", color: "#6b7280" }}>Loading...</td>
                </tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: "60px", color: "#6b7280" }}>
                    <CalendarIcon size={48} color="#d1d5db" style={{ marginBottom: "16px" }} />
                    <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 500, color: "#4b5563" }}>No records found</p>
                    <p style={{ margin: "4px 0 0", fontSize: "0.9rem" }}>Try selecting a different date range.</p>
                  </td>
                </tr>
              ) : (
                attendance.map((record, idx) => {
                  const statusKey = record.status as Status;
                  return (
                    <tr key={idx} style={{ borderTop: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "16px", fontWeight: 500, color: "#374151" }}>
                        {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span style={{ 
                          display: "inline-flex", alignItems: "center", gap: "6px",
                          padding: "4px 10px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 600,
                          backgroundColor: `${STATUS_COLORS[statusKey]}15`,
                          color: STATUS_COLORS[statusKey],
                          border: `1px solid ${STATUS_COLORS[statusKey]}30`
                        }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: STATUS_COLORS[statusKey] }}></span>
                          {STATUS_LABELS[statusKey]}
                        </span>
                      </td>
                      <td style={{ padding: "16px", color: "#6b7280" }}>
                        {record.remarks || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>
    // </AdminShell>
  );
}
