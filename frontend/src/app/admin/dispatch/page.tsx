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
    { name: "referenceId", label: "Select Order/Booking", type: "searchable-select", valueType: "number", options: referenceOptions, required: true },
    { name: "dispatchType", label: "Dispatch Type", type: "select", options: [{ label: "Bus", value: "bus" }, { label: "Courier", value: "courier" }] },
    { name: "dispatchDate", label: "Dispatch Date", type: "date", required: true },
    { name: "status", label: "Status", type: "select", options: [{ label: "Pending", value: "pending" }, { label: "Dispatched", value: "dispatched" }, { label: "Delivered", value: "delivered" }] }
  ];

  if (values.dispatchType === "bus") {
    fields.push(
      { name: "busNumber", label: "Bus Number", required: true },
      { name: "driverName", label: "Driver Name", required: true },
      { name: "driverMobile", label: "Driver Mobile" },
      { name: "busPhotoUrl", label: "Bus Photo URL" }
    );
  } else if (values.dispatchType === "courier") {
    fields.push(
      { name: "courierCompany", label: "Courier Company", required: true },
      { name: "docketNumber", label: "Docket Number", required: true }
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
        validate={(v) => {
          const errors: Record<string, string> = {};
          if (!v.referenceId) errors.referenceId = "Please select an Order or Advance Booking.";
          if (!v.dispatchDate) errors.dispatchDate = "Dispatch Date is required.";
          
          if (v.dispatchType === "bus") {
            if (!v.busNumber) errors.busNumber = "Bus Number is required.";
            if (!v.driverName) errors.driverName = "Driver Name is required.";
          } else if (v.dispatchType === "courier") {
            if (!v.courierCompany) errors.courierCompany = "Courier Company is required.";
            if (!v.docketNumber) errors.docketNumber = "Docket Number is required.";
          }
          
          return Object.keys(errors).length > 0 ? errors : null;
        }}
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
        renderCell={(row, column, reload) => {
          if (column.key === "status") {
            return (
              <select
                value={row.status}
                onChange={async (e) => {
                  try {
                    await apiRequest("/api/dispatch/status", {
                      method: "PATCH",
                      body: JSON.stringify({ dispatchId: row.id, status: e.target.value })
                    });
                    await reload();
                  } catch (err) {
                    alert("Failed to update status");
                  }
                }}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  background: "var(--bg)",
                  color: "var(--text)",
                  outline: "none",
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                <option value="pending">Pending</option>
                <option value="dispatched">Dispatched</option>
                <option value="delivered">Delivered</option>
              </select>
            );
          }
          return undefined;
        }}
      />
    </AdminShell>
  );
}
