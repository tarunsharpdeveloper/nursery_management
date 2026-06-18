"use client";

import { AdminShell } from "@/components/admin-shell";
import { AdminModule } from "@/components/admin-module";

export default function AdvanceBookingsPage() {
  return (
    <AdminShell>
      <AdminModule
        eyebrow="Advance Booking Module"
        title="Future Plant Delivery Bookings"
        listPath="/api/advance-bookings"
        submitPath="/api/advance-bookings"
        submitLabel="Save Booking"
        fields={[
          { name: "bookingNumber", label: "Booking Number", placeholder: "AB-1002" },
          { name: "name", label: "Customer Name" },
          { name: "phone", label: "Mobile" },
          { name: "productId", label: "Product ID", type: "number", valueType: "number" },
          { name: "quantity", label: "Quantity", type: "number", valueType: "number" },
          { name: "advanceAmount", label: "Advance Amount", type: "number", valueType: "number" },
          { name: "totalBillAmount", label: "Total Bill", type: "number", valueType: "number" },
          { name: "deliveryDate", label: "Delivery Date", type: "date" },
          { name: "remarks", label: "Remarks", type: "textarea" }
        ]}
        transformSubmit={(values) => ({
          bookingNumber: values.bookingNumber,
          customer: { name: values.name, phone: values.phone },
          productId: values.productId,
          quantity: values.quantity,
          advanceAmount: values.advanceAmount,
          totalBillAmount: values.totalBillAmount,
          deliveryDate: values.deliveryDate,
          remarks: values.remarks
        })}
        columns={[
          { key: "booking_number", label: "Booking" },
          { key: "customer", label: "Customer" },
          { key: "phone", label: "Mobile" },
          { key: "product", label: "Product" },
          { key: "quantity", label: "Qty" },
          { key: "advance_amount", label: "Advance" },
          { key: "balance_payable", label: "Balance" },
          { key: "status", label: "Status" }
        ]}
      />
    </AdminShell>
  );
}
