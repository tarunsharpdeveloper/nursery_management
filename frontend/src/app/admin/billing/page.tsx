"use client";

import { AdminShell } from "@/components/admin-shell";
import { AdminModule } from "@/components/admin-module";

export default function BillingPage() {
  return (
    <AdminShell>
      <AdminModule
        eyebrow="Offline Billing"
        title="Cash Sale and Credit Sale"
        listPath="/api/bills"
        submitPath="/api/billing"
        submitLabel="Generate Bill"
        fields={[
          { name: "name", label: "Customer Name" },
          { name: "phone", label: "Mobile" },
          { name: "billType", label: "Sale Type", type: "select", options: [{ label: "Cash Sale", value: "cash_sale" }, { label: "Credit Sale", value: "credit_sale" }] },
          { name: "paymentType", label: "Payment Type", type: "select", options: [{ label: "Cash", value: "cash" }, { label: "UPI", value: "upi" }, { label: "Credit", value: "credit" }] },
          { name: "productId", label: "Product ID", type: "number", valueType: "number" },
          { name: "quantity", label: "Quantity", type: "number", valueType: "number" },
          { name: "unitPrice", label: "Unit Price", type: "number", valueType: "number" }
        ]}
        transformSubmit={(values) => ({
          customer: { name: values.name, phone: values.phone },
          billType: values.billType,
          paymentType: values.paymentType,
          items: [{ productId: values.productId, quantity: values.quantity, unitPrice: values.unitPrice }]
        })}
        columns={[
          { key: "bill_number", label: "Bill" },
          { key: "customer", label: "Customer" },
          { key: "bill_type", label: "Type" },
          { key: "payment_type", label: "Payment" },
          { key: "total_amount", label: "Total" },
          { key: "paid_amount", label: "Paid" },
          { key: "balance_amount", label: "Balance" }
        ]}
      />
    </AdminShell>
  );
}
