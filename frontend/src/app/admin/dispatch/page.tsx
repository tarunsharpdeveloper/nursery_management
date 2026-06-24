"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { AdminModule } from "@/components/admin-module";
import { apiRequest } from "@/lib/api";

export default function DispatchPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [values, setValues] = useState<Record<string, any>>({
    referenceType: "online_order",
    dispatchType: "bus",
    status: "pending",
    dispatchDate: new Date().toISOString().slice(0, 10)
  });

  useEffect(() => {
    apiRequest<any[]>("/api/orders").then(setOrders).catch(console.error);
    apiRequest<any[]>("/api/advance-bookings").then(setBookings).catch(console.error);
  }, []);

  const referenceOptions = values.referenceType === "online_order" 
    ? orders.map(o => ({ label: `${o.order_number} - ${o.customer}`, value: o.id }))
    : bookings.map(b => ({ label: `${b.booking_number} - ${b.customer}`, value: b.id }));

  const fields: any[] = [
    { name: "referenceType", label: "Reference Type", type: "select", options: [{ label: "Online Order", value: "online_order" }, { label: "Advance Booking", value: "advance_booking" }] },
    { name: "referenceId", label: "Select Order/Booking", type: "searchable-select", valueType: "number", options: referenceOptions },
    { name: "dispatchType", label: "Dispatch Type", type: "select", options: [{ label: "Bus", value: "bus" }, { label: "Courier", value: "courier" }] },
    { name: "dispatchDate", label: "Dispatch Date", type: "date" },
    { name: "status", label: "Status", type: "select", options: [{ label: "Pending", value: "pending" }, { label: "Dispatched", value: "dispatched" }, { label: "Delivered", value: "delivered" }] }
  ];

  if (values.dispatchType === "bus") {
    fields.push(
      { name: "busNumber", label: "Bus Number" },
      { name: "driverName", label: "Driver Name" },
      { name: "driverMobile", label: "Driver Mobile" },
      { name: "busPhotoUrl", label: "Bus Photo URL" }
    );
  } else if (values.dispatchType === "courier") {
    fields.push(
      { name: "courierCompany", label: "Courier Company" },
      { name: "docketNumber", label: "Docket Number" }
    );
  }

  fields.push({ name: "remarks", label: "Remarks", type: "text" });

  return (
    <AdminShell>
      <AdminModule
        eyebrow="Dispatch Management"
        title="Bus and Courier Dispatch"
        listPath="/api/dispatch"
        submitPath="/api/dispatch"
        submitLabel="Save Dispatch"
        values={values}
        onValuesChange={setValues}
        onSuccess={() => setValues({
          referenceType: "online_order",
          dispatchType: "bus",
          status: "pending",
          dispatchDate: new Date().toISOString().slice(0, 10)
        })}
        fields={fields}
        transformSubmit={(submitted) => ({
          orderId: submitted.referenceType === "online_order" ? submitted.referenceId : null,
          advanceBookingId: submitted.referenceType === "advance_booking" ? submitted.referenceId : null,
          dispatchType: submitted.dispatchType,
          dispatchDate: submitted.dispatchDate,
          status: submitted.status,
          busNumber: submitted.busNumber || "",
          driverName: submitted.driverName || "",
          driverMobile: submitted.driverMobile || "",
          busPhotoUrl: submitted.busPhotoUrl || "",
          courierCompany: submitted.courierCompany || "",
          docketNumber: submitted.docketNumber || "",
          remarks: submitted.remarks || ""
        })}
        columns={[
          { key: "reference_type", label: "Type" },
          { key: "reference_number", label: "Ref No." },
          { key: "dispatch_type", label: "Mode" },
          { key: "status", label: "Status" },
          { key: "dispatch_date", label: "Date" },
          { key: "bus_number", label: "Bus" },
          { key: "courier_company", label: "Courier" },
          { key: "docket_number", label: "Docket" }
        ]}
      />
    </AdminShell>
  );
}
