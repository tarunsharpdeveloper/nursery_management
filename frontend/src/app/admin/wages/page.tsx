import { AdminShell } from "@/components/admin-shell";
import { AdminModule } from "@/components/admin-module";

export default function WagesPage() {
  return (
    <AdminShell>
      <AdminModule
        eyebrow="Wage Calculation"
        title="Monthly and Daily Wage Summary"
        listPath="/api/wages/summary"
        columns={[
          { key: "name", label: "Employee" },
          { key: "employee_type", label: "Type" },
          { key: "gender", label: "Gender" },
          { key: "days_worked", label: "Days Worked" },
          { key: "absent_days", label: "Absent" },
          { key: "payable_amount", label: "Payable Amount" }
        ]}
      />
    </AdminShell>
  );
}
