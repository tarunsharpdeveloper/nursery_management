"use client";

import { useState, useEffect } from "react";
// import { AdminShell } from "@/components/admin-shell";
import { apiRequest } from "@/lib/api";
import { Save, RefreshCw } from "lucide-react";

type Status = "present" | "absent" | "half_day" | "leave" | "sunday_off" | null;
type AttendanceData = Record<string, Status>;

type EmployeeWithAttendance = {
  id: number;
  name: string;
  employee_type: string;
  attendance: AttendanceData;
};

const STATUS_LABELS: Record<NonNullable<Status>, string> = {
  present: "P",
  absent: "A",
  half_day: "H",
  leave: "L",
  sunday_off: "S"
};

const STATUS_COLORS: Record<NonNullable<Status>, string> = {
  present: "#10b981", // green
  absent: "#ef4444",  // red
  half_day: "#f59e0b", // yellow
  leave: "#3b82f6",    // blue
  sunday_off: "#8b5cf6" // purple
};

export default function AttendancePage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [employees, setEmployees] = useState<EmployeeWithAttendance[]>([]);
  const [drafts, setDrafts] = useState<Record<number, AttendanceData>>({});
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [month]);

  async function loadData() {
    setBusy(true);
    try {
      const data: EmployeeWithAttendance[] = await apiRequest(`/api/attendance/monthly?month=${month}`);
      setEmployees(data);
      
      const [yearStr, monthStr] = month.split("-");
      const yearNum = parseInt(yearStr, 10);
      const monthNum = parseInt(monthStr, 10);
      const daysInMo = new Date(yearNum, monthNum, 0).getDate();
      
      const newDrafts: Record<number, AttendanceData> = {};
      
      data.forEach(emp => {
        for (let d = 1; d <= daysInMo; d++) {
          const dateObj = new Date(yearNum, monthNum - 1, d);
          if (dateObj.getDay() === 0) {
            const dateStr = `${yearStr}-${monthStr}-${String(d).padStart(2, "0")}`;
            if (!emp.attendance[dateStr]) {
              if (!newDrafts[emp.id]) newDrafts[emp.id] = {};
              newDrafts[emp.id][dateStr] = "sunday_off";
            }
          }
        }
      });
      
      setDrafts(newDrafts);
    } catch (error) {
      alert("Failed to load attendance data");
    } finally {
      setBusy(false);
    }
  }

  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function getStatus(empId: number, dateStr: string): Status {
    if (drafts[empId] && drafts[empId][dateStr] !== undefined) {
      return drafts[empId][dateStr];
    }
    const emp = employees.find((e) => e.id === empId);
    return emp?.attendance[dateStr] ?? null;
  }

  function handleCellClick(empId: number, dateStr: string) {
    const current = getStatus(empId, dateStr);
    let next: Status = null;
    
    if (current === null) next = "present";
    else if (current === "present") next = "absent";
    else if (current === "absent") next = "half_day";
    else if (current === "half_day") next = "leave";
    else if (current === "leave") next = "sunday_off";
    else next = null;

    setDrafts((prev) => ({
      ...prev,
      [empId]: {
        ...(prev[empId] || {}),
        [dateStr]: next
      }
    }));
  }

  async function handleSave() {
    const recordsToSave: any[] = [];
    
    for (const [empIdStr, data] of Object.entries(drafts)) {
      const empId = Number(empIdStr);
      for (const [dateStr, status] of Object.entries(data)) {
        if (status !== null) {
          recordsToSave.push({
            employeeId: empId,
            attendanceDate: dateStr,
            status: status
          });
        }
      }
    }

    if (recordsToSave.length === 0) {
      alert("No changes to save!");
      return;
    }

    setSaving(true);
    try {
      await apiRequest("/api/attendance/bulk", {
        method: "POST",
        body: JSON.stringify({ records: recordsToSave })
      });
      await loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  }

  function calculateTotals(empId: number) {
    const totals = { present: 0, absent: 0, half_day: 0, leave: 0, sunday_off: 0 };
    daysArray.forEach((d) => {
      const dateStr = `${yearStr}-${monthStr}-${String(d).padStart(2, "0")}`;
      const st = getStatus(empId, dateStr);
      if (st) totals[st]++;
    });
    return totals;
  }

  const hasDrafts = Object.keys(drafts).length > 0;

  return (
    // <AdminShell>
      <div style={{ padding: "20px", maxWidth: "100%", overflowX: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            {/* <span style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "#6b7280", fontWeight: 600 }}>Attendance Management</span> */}
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1f2937", margin: 0 }}>Monthly Grid</h1>
          </div>
          
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input 
              type="month" 
              value={month} 
              onChange={(e) => setMonth(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                outline: "none"
              }}
            />
            {/* <button className="button secondary" onClick={loadData} disabled={busy}>
              <RefreshCw size={16} /> Refresh
            </button> */}
            <button className="button" style={{ width: "250px" }} onClick={handleSave} disabled={saving || !hasDrafts}>
              <Save size={16} /> Save Changes
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: "#fff", borderRadius: "10px", border: "1px solid #f3f4f6", overflowX: "auto", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
          <table className="admin-table" style={{ minWidth: "1200px", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ width: "200px", position: "sticky", left: 0, backgroundColor: "#f9fafb", zIndex: 10, borderRight: "1px solid #e5e7eb" }}>Employee</th>
                {daysArray.map((day) => (
                  <th key={day} style={{ width: "40px", textAlign: "center", padding: "8px 4px", fontSize: "0.8rem" }}>
                    {day}
                  </th>
                ))}
                <th style={{ width: "160px", textAlign: "center", borderLeft: "1px solid #e5e7eb", position: "sticky", right: 0, backgroundColor: "#f9fafb", zIndex: 10 }}>Summary</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth + 2} style={{ textAlign: "center", padding: "40px" }}>
                    {busy ? "Loading..." : "No active employees found"}
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const totals = calculateTotals(emp.id);
                  return (
                    <tr key={emp.id}>
                      <td style={{ position: "sticky", left: 0, backgroundColor: "#fff", zIndex: 9, borderRight: "1px solid #e5e7eb", fontWeight: 500 }}>
                        {emp.name}
                        <div style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 400 }}>
                          {emp.employee_type === "monthly_salary" ? "Monthly" : "Daily"}
                        </div>
                      </td>
                      {daysArray.map((day) => {
                        const dateStr = `${yearStr}-${monthStr}-${String(day).padStart(2, "0")}`;
                        const status = getStatus(emp.id, dateStr);
                        
                        return (
                          <td 
                            key={day} 
                            onClick={() => handleCellClick(emp.id, dateStr)}
                            style={{ 
                              padding: "4px", 
                              textAlign: "center", 
                              cursor: "pointer",
                              userSelect: "none"
                            }}
                          >
                            <div style={{ 
                              width: "28px", 
                              height: "28px", 
                              margin: "0 auto", 
                              borderRadius: "4px", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              backgroundColor: status ? `${STATUS_COLORS[status]}20` : "transparent",
                              color: status ? STATUS_COLORS[status] : "#d1d5db",
                              border: status ? `1px solid ${STATUS_COLORS[status]}50` : "1px dashed #e5e7eb",
                              transition: "all 0.1s"
                            }}>
                              {status ? STATUS_LABELS[status] : "-"}
                            </div>
                          </td>
                        );
                      })}
                      <td style={{ borderLeft: "1px solid #e5e7eb", padding: "8px", position: "sticky", right: 0, backgroundColor: "#fff", zIndex: 9 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", fontSize: "0.75rem" }}>
                          <span title="Present" style={{ background: `${STATUS_COLORS.present}20`, color: STATUS_COLORS.present, padding: "2px 6px", borderRadius: "12px", fontWeight: 600 }}>P: {totals.present}</span>
                          <span title="Absent" style={{ background: `${STATUS_COLORS.absent}20`, color: STATUS_COLORS.absent, padding: "2px 6px", borderRadius: "12px", fontWeight: 600 }}>A: {totals.absent}</span>
                          <span title="Half Day" style={{ background: `${STATUS_COLORS.half_day}20`, color: STATUS_COLORS.half_day, padding: "2px 6px", borderRadius: "12px", fontWeight: 600 }}>H: {totals.half_day}</span>
                          <span title="Leave" style={{ background: `${STATUS_COLORS.leave}20`, color: STATUS_COLORS.leave, padding: "2px 6px", borderRadius: "12px", fontWeight: 600 }}>L: {totals.leave}</span>
                          <span title="Sunday Off" style={{ background: `${STATUS_COLORS.sunday_off}20`, color: STATUS_COLORS.sunday_off, padding: "2px 6px", borderRadius: "12px", fontWeight: 600 }}>S: {totals.sunday_off}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: "16px", display: "flex", gap: "16px", fontSize: "0.85rem", color: "#6b7280" }}>
          <strong>Legend:</strong>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: 12, height: 12, borderRadius: 2, background: STATUS_COLORS.present }}></div> Present</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: 12, height: 12, borderRadius: 2, background: STATUS_COLORS.absent }}></div> Absent</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: 12, height: 12, borderRadius: 2, background: STATUS_COLORS.half_day }}></div> Half Day</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: 12, height: 12, borderRadius: 2, background: STATUS_COLORS.leave }}></div> Leave</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><div style={{ width: 12, height: 12, borderRadius: 2, background: STATUS_COLORS.sunday_off }}></div> Sunday Off</span>
        </div>
      </div>
    // </AdminShell>
  );
}
