import { AdminShell } from "@/components/admin-shell";
import { AdminModule } from "@/components/admin-module";

export default function DispatchPage() {
  return (
    <AdminShell>
      <AdminModule
        eyebrow="Dispatch Management"
        title="Bus and Courier Dispatch"
        listPath="/api/dispatch"
        submitPath="/api/dispatch"
        submitLabel="Save Dispatch"
        fields={[
          { name: "orderId", label: "Order ID", type: "number", valueType: "number" },
          { name: "dispatchType", label: "Dispatch Type", type: "select", options: [{ label: "Bus", value: "bus" }, { label: "Courier", value: "courier" }] },
          { name: "dispatchDate", label: "Dispatch Date", type: "date" },
          { name: "status", label: "Status", type: "select", options: [{ label: "Pending", value: "pending" }, { label: "Dispatched", value: "dispatched" }, { label: "Delivered", value: "delivered" }] },
          { name: "busNumber", label: "Bus Number" },
          { name: "driverName", label: "Driver Name" },
          { name: "driverMobile", label: "Driver Mobile" },
          { name: "busPhotoUrl", label: "Bus Photo URL" },
          { name: "courierCompany", label: "Courier Company" },
          { name: "docketNumber", label: "Docket Number" },
          { name: "remarks", label: "Remarks", type: "textarea" }
        ]}
        columns={[
          { key: "order_number", label: "Order" },
          { key: "dispatch_type", label: "Mode" },
          { key: "status", label: "Status" },
          { key: "dispatch_date", label: "Date" },
          { key: "bus_number", label: "Bus" },
          { key: "driver_name", label: "Driver" },
          { key: "courier_company", label: "Courier" },
          { key: "docket_number", label: "Docket" }
        ]}
      />
    </AdminShell>
  );
}
