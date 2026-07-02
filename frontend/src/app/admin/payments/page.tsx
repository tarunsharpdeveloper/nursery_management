import { AdminModule } from "@/components/admin-module";

export default function PaymentsPage() {
  return (
    <>
      <AdminModule
        eyebrow=""
        title="Online Payment Methods and Status"
        listPath="/api/admin/data-list?model=payments"
        searchPlaceholder="Search order number, gateway..."
        filterConfig={{
          key: "payment_status",
          label: "Payment Status",
          options: [
            { value: "pending", label: "Pending" },
            { value: "paid", label: "Paid" },
            { value: "failed", label: "Failed" },
            { value: "refunded", label: "Refunded" }
          ]
        }}
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
    </>
  );
}
