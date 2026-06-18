import { AdminShell } from "@/components/admin-shell";
import { AdminModule } from "@/components/admin-module";

export default function PaymentsPage() {
  return (
    <AdminShell>
      <AdminModule
        eyebrow="Payment Gateway Integration"
        title="Online Payment Methods and Status"
        listPath="/api/payments"
        submitPath="/api/payments/initiate"
        submitLabel="Initiate Payment"
        fields={[
          { name: "orderId", label: "Order ID", type: "number", valueType: "number" },
          { name: "amount", label: "Amount", type: "number", valueType: "number" },
          { name: "paymentMethod", label: "Payment Method", type: "select", options: [
            { label: "UPI", value: "upi" },
            { label: "Credit Card", value: "credit_card" },
            { label: "Debit Card", value: "debit_card" },
            { label: "Net Banking", value: "net_banking" }
          ] }
        ]}
        columns={[
          { key: "id", label: "Payment ID" },
          { key: "order_number", label: "Order" },
          { key: "payment_gateway", label: "Gateway" },
          { key: "payment_method", label: "Method" },
          { key: "payment_status", label: "Status" },
          { key: "amount", label: "Amount" }
        ]}
      />
    </AdminShell>
  );
}
