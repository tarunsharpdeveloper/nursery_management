"use client";

import { useState, useEffect } from "react";
import { AdminModule } from "@/components/admin-module";
import { apiRequest } from "@/lib/api";

export default function PaymentsPage() {
  const [values, setValues] = useState<Record<string, any>>({
    orderId: "",
    amount: "",
    paymentMethod: "cash",
    transactionId: ""
  });
  const [orderIdError, setOrderIdError] = useState<string>("");

  useEffect(() => {
    const rawId = values.orderId ? String(values.orderId).trim() : "";
    if (!rawId) {
      setOrderIdError("");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await apiRequest<any>("/api/orders/get", {
          method: "POST",
          body: JSON.stringify({ orderId: rawId })
        });

        if (data && (data.total_amount !== undefined || data.amount !== undefined)) {
          const fetchedAmount = data.total_amount !== undefined ? data.total_amount : data.amount;
          setValues((prev) => ({ ...prev, amount: Number(fetchedAmount) }));
          setOrderIdError("");
        } else {
          setOrderIdError("Order ID does not exist");
          setValues((prev) => ({ ...prev, amount: "" }));
        }
      } catch (err: any) {
        setOrderIdError("Order ID does not exist");
        setValues((prev) => ({ ...prev, amount: "" }));
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [values.orderId]);

  const fields: any[] = [
    {
      name: "orderId",
      label: "Order ID",
      type: "text",
      valueType: "string",
      required: true,
      placeholder: "Enter Order ID (e.g. 1785396820792 or ORD-1785396820792)",
      error: orderIdError
    },
    {
      name: "amount",
      label: "Amount",
      type: "number",
      valueType: "number",
      required: true,
      placeholder: "Amount will auto-fill from order"
    },
    {
      name: "paymentMethod",
      label: "Payment Method",
      type: "select",
      required: true,
      options: [
        { label: "Cash", value: "cash" },
        { label: "UPI", value: "upi" },
        { label: "Credit Card", value: "credit_card" },
        { label: "Debit Card", value: "debit_card" },
        { label: "Net Banking", value: "net_banking" }
      ]
    },
    ...(values.paymentMethod === "upi" ? [{
      name: "transactionId",
      label: "UPI Transaction ID",
      type: "text",
      valueType: "string",
      required: true,
      placeholder: "Enter UPI transaction reference number"
    }] : [])
  ];

  const handleReset = () => {
    setValues({
      orderId: "",
      amount: "",
      paymentMethod: "cash",
      transactionId: ""
    });
    setOrderIdError("");
  };

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
        values={values}
        onValuesChange={setValues}
        onCancel={handleReset}
        onSuccess={handleReset}
        isSubmitDisabled={(v) => !v.orderId || Boolean(orderIdError) || !v.amount}
        validate={(v) => {
          const errors: Record<string, string> = {};
          if (!v.orderId) {
            errors.orderId = "Order ID is required";
          } else if (orderIdError) {
            errors.orderId = orderIdError;
          }
          if (!v.amount || Number(v.amount) <= 0) {
            errors.amount = "Valid amount is required";
          }
          if (!v.paymentMethod) {
            errors.paymentMethod = "Payment method is required";
          }
          if (v.paymentMethod === "upi" && !v.transactionId?.trim()) {
            errors.transactionId = "UPI Transaction ID is required";
          }
          return Object.keys(errors).length > 0 ? errors : null;
        }}
        fields={fields}
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
