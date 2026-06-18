"use client";

import { AdminShell } from "@/components/admin-shell";
import { AdminModule } from "@/components/admin-module";

export default function OrdersPage() {
  return (
    <AdminShell>
      <AdminModule
        eyebrow="Online Order Management"
        title="Received to Delivered"
        listPath="/api/orders"
        submitPath="/api/orders"
        submitLabel="Create Order"
        fields={[
          { name: "name", label: "Customer Name" },
          { name: "phone", label: "Mobile" },
          { name: "email", label: "Email" },
          { name: "address", label: "Address", type: "textarea" },
          { name: "productId", label: "Product ID", type: "number", valueType: "number" },
          { name: "quantity", label: "Quantity", type: "number", valueType: "number" },
          { name: "unitPrice", label: "Unit Price", type: "number", valueType: "number" }
        ]}
        transformSubmit={(values) => ({
          customer: { name: values.name, phone: values.phone, email: values.email, address: values.address },
          items: [{ productId: values.productId, quantity: values.quantity, unitPrice: values.unitPrice }]
        })}
        columns={[
          { key: "order_number", label: "Order" },
          { key: "customer", label: "Customer" },
          { key: "status", label: "Status" },
          { key: "payment_status", label: "Payment" },
          { key: "total_amount", label: "Amount" },
          { key: "created_at", label: "Created" }
        ]}
      />
    </AdminShell>
  );
}
