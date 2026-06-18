import { AdminShell } from "@/components/admin-shell";
import { AdminModule } from "@/components/admin-module";

export default function ReportsPage() {
  return (
    <AdminShell>
      <AdminModule
        eyebrow="Reports"
        title="Sales, Stock and Outstanding Reports"
        listPath="/api/reports?report=sales"
        columns={[
          { key: "bill_date", label: "Date" },
          { key: "bill_number", label: "Bill" },
          { key: "customer", label: "Customer" },
          { key: "total_amount", label: "Total" },
          { key: "paid_amount", label: "Paid" },
          { key: "balance_amount", label: "Balance" }
        ]}
      />
    </AdminShell>
  );
}
