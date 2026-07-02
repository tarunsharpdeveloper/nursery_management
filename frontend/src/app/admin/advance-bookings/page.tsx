"use client";

import { useEffect, useState, useMemo } from "react";
import { AdminModule } from "@/components/admin-module";
import { apiRequest } from "@/lib/api";

export default function AdvanceBookingsPage() {
  const [customers, setCustomers] = useState<{ id: number; name: string; phone: string }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [values, setValues] = useState<Record<string, any>>({});

  useEffect(() => {
    apiRequest<{ id: number; name: string; phone: string }[]>("/api/customers")
      .then((data) => setCustomers(data))
      .catch(console.error);
    apiRequest<any[]>("/api/products")
      .then((data) => setProducts(data))
      .catch(console.error);
  }, []);

  const selectedProduct = products?.find(p => p.id === values.productId);
  const variants = selectedProduct?.variants || [];
  const hasVariants = variants.length > 0;

  useEffect(() => {
    let price = 0;
    if (selectedProduct) {
      if (hasVariants) {
        const variant = variants.find((v: any) => v.id === values.variantId);
        if (variant) price = Number(variant.selling_price) || 0;
      } else {
        price = Number(selectedProduct.selling_price) || 0;
      }
    }
    const quantity = Number(values.quantity) || 0;
    const newTotal = price * quantity;
    
    if (values.totalBillAmount !== newTotal) {
      setValues(prev => ({ ...prev, totalBillAmount: newTotal, advanceAmount: newTotal }));
    }
  }, [values.productId, values.variantId, values.quantity, selectedProduct, hasVariants, variants]);

  const fields: any[] = [
    { 
      name: "customerId", 
      label: "Customer Name", 
      type: "searchable-select", 
      valueType: "number",
      options: customers.map((c) => ({ label: `${c.name} (${c.phone || 'N/A'})`, value: c.id }))
    },
    { 
      name: "productId", 
      label: "Product", 
      type: "searchable-select", 
      valueType: "number",
      options: products.map((p) => ({ label: p.name, value: p.id }))
    }
  ];

  if (hasVariants) {
    fields.push({
      name: "variantId",
      label: "Select Variant",
      type: "select",
      valueType: "number",
      options: variants.map((v: any) => ({ label: `${v.unit_value} ${v.unit} - ₹${v.selling_price}`, value: v.id }))
    });
  }

  fields.push(
    { name: "quantity", label: "Quantity", type: "number", valueType: "number" },
    { name: "advanceAmount", label: "Advance Amount", type: "number", valueType: "number" },
    { name: "totalBillAmount", label: "Total Bill (Auto)", type: "number", valueType: "number" },
    { name: "deliveryDate", label: "Delivery Date", type: "date" },
    { name: "remarks", label: "Remarks", type: "text" }
  );

  return (
    <>
      <AdminModule
        eyebrow="Advance Booking Module"
        title="Future Plant Delivery Bookings"
        listPath="/api/admin/data-list?model=advance_bookings"
        searchPlaceholder="Search booking number, customer..."
        filterConfig={{
          key: "status",
          label: "Booking Status",
          options: [
            { value: "booked", label: "Booked" },
            { value: "ready", label: "Ready" },
            { value: "delivered", label: "Delivered" },
            { value: "cancelled", label: "Cancelled" }
          ]
        }}
        submitPath="/api/advance-bookings"
        submitLabel="Save Booking"
        values={values}
        onValuesChange={setValues}
        onSuccess={() => setValues({})}
        fields={fields}
        transformSubmit={(submittedValues) => ({
          bookingNumber: submittedValues.bookingNumber || `AB-${Date.now()}`,
          customerId: submittedValues.customerId || null,
          productId: submittedValues.productId,
          variantId: submittedValues.variantId || null,
          quantity: submittedValues.quantity,
          advanceAmount: submittedValues.advanceAmount,
          totalBillAmount: submittedValues.totalBillAmount,
          deliveryDate: submittedValues.deliveryDate || "",
          remarks: submittedValues.remarks || ""
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
    </>
  );
}
