import { AdminModule } from "@/components/admin-module";

export default function ReportsPage() {
  return (
    <>
      <AdminModule
        eyebrow="Reports"
        title="Sales, Stock and Outstanding Reports"
        listPath="/api/reports?report=sales"
        columns={[
          { key: "bill_date", label: "Date" },
          { key: "bill_number", label: "Bill" },
          { key: "customer", label: "Customer" },
          { key: "bill_type", label: "Bill Type" },
          { key: "total_amount", label: "Total" },
          { key: "paid_amount", label: "Paid" },
          { key: "balance_amount", label: "Balance" }
        ]}
        searchPlaceholder="Search bill number or customer..."
        filterConfig={{
          key: "bill_type",
          label: "Bill Type",
          options: [
            { value: "cash_sale", label: "Cash Sale" },
            { value: "credit_sale", label: "Credit Sale" }
          ]
        }}
      />
    </>
  );
}
