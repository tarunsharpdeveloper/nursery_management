import { AdminShell } from "@/components/admin-shell";
import { AdminModule } from "@/components/admin-module";

export default function ProductionPage() {
  return (
    <AdminShell>
      <AdminModule
        eyebrow="Production Management"
        title="Plant and Seed Production Entry"
        listPath="/api/inventory"
        submitPath="/api/production"
        submitLabel="Save and Increase Stock"
        fields={[
          { name: "productionDate", label: "Date", type: "date" },
          { name: "productId", label: "Product ID", type: "number", valueType: "number", placeholder: "1" },
          { name: "productionType", label: "Production Type", type: "select", options: [{ label: "Plant", value: "plant" }, { label: "Seed", value: "seed" }] },
          { name: "quantityProduced", label: "Quantity Produced", type: "number", valueType: "number" },
          { name: "remarks", label: "Remarks", type: "textarea" }
        ]}
        columns={[
          { key: "name", label: "Product" },
          { key: "available_quantity", label: "Available Stock" },
          { key: "sold_quantity", label: "Sold" }
        ]}
      />
    </AdminShell>
  );
}
