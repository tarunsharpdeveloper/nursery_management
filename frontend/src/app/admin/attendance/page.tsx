import { AdminShell } from "@/components/admin-shell";
import { AdminModule } from "@/components/admin-module";

export default function AttendancePage() {
  return (
    <AdminShell>
      <AdminModule
        eyebrow="Attendance Management"
        title="Daily Attendance Entry"
        listPath="/api/attendance"
        submitPath="/api/attendance"
        submitLabel="Save Attendance"
        fields={[
          { name: "employeeId", label: "Employee ID", type: "number", valueType: "number" },
          { name: "attendanceDate", label: "Date", type: "date" },
          { name: "status", label: "Status", type: "select", options: [
            { label: "Present", value: "present" },
            { label: "Absent", value: "absent" },
            { label: "Half Day", value: "half_day" },
            { label: "Leave", value: "leave" }
          ] },
          { name: "remarks", label: "Remarks", type: "textarea" }
        ]}
        columns={[
          { key: "employee", label: "Employee" },
          { key: "attendance_date", label: "Date" },
          { key: "status", label: "Status" },
          { key: "remarks", label: "Remarks" }
        ]}
      />
    </AdminShell>
  );
}
