import { AdminShell } from "@/components/admin-shell";
import { AdminModule } from "@/components/admin-module";

export default function LedgerPage() {
  return (
    <AdminShell>
      <AdminModule
        eyebrow="Customer Ledger"
        title="Credit Customer Outstanding"
        listPath="/api/customer-ledger"
        columns={[
          { key: "customer", label: "Customer" },
          { key: "total_purchase", label: "Total Purchase" },
          { key: "amount_paid", label: "Amount Paid" },
          { key: "outstanding_amount", label: "Outstanding" }
        ]}
      />
    </AdminShell>
  );
}
