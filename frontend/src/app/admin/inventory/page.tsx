import { AdminShell } from "@/components/admin-shell";
import { AdminModule } from "@/components/admin-module";

export default function InventoryPage() {
  return (
    <AdminShell>
      <AdminModule
        eyebrow="Inventory Management"
        title="Single Store Stock Report"
        listPath="/api/inventory"
        columns={[
          { key: "name", label: "Product" },
          { key: "available_quantity", label: "Available Stock" },
          { key: "sold_quantity", label: "Sold Quantity" },
          { key: "current_balance", label: "Current Balance" }
        ]}
      />
    </AdminShell>
  );
}
