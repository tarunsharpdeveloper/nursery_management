"use client";

import { useEffect, useState } from "react";
import { AdminModule } from "@/components/admin-module";
import { apiRequest } from "@/lib/api";
import { Plus, Trash2, X } from "lucide-react";

interface BookingItem {
  productId: number;
  variantId: number | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export default function AdvanceBookingsPage() {
  const [customers, setCustomers] = useState<{ id: number; name: string; phone: string }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [values, setValues] = useState<Record<string, any>>({
    customerId: null,
    deliveryDate: "",
    remarks: "",
    advanceAmount: 0,
    totalBillAmount: 0
  });
  
  const [bookingItems, setBookingItems] = useState<BookingItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Current item being added
  const [currentItem, setCurrentItem] = useState({
    productId: null as number | null,
    variantId: null as number | null,
    quantity: 1
  });

  useEffect(() => {
    apiRequest<{ id: number; name: string; phone: string }[]>("/api/customers")
      .then((data) => setCustomers(data))
      .catch(console.error);
    apiRequest<any[]>("/api/products")
      .then((data) => setProducts(data))
      .catch(console.error);
  }, []);

  // Calculate totals whenever booking items change
  useEffect(() => {
    const total = bookingItems.reduce((sum, item) => sum + item.lineTotal, 0);
    setValues(prev => ({
      ...prev,
      totalBillAmount: total,
      advanceAmount: Math.min(prev.advanceAmount || 0, total) // Can't advance more than total
    }));
  }, [bookingItems]);

  const selectedProduct = products?.find(p => p.id === currentItem.productId);
  const variants = selectedProduct?.variants || [];
  const hasVariants = variants.length > 0;

  const addItemToBooking = () => {
    if (!currentItem.productId || currentItem.quantity <= 0) {
      alert("Please select a product and enter quantity");
      return;
    }

    let unitPrice = 0;
    const product = products.find(p => p.id === currentItem.productId);
    
    if (!product) return;

    if (hasVariants && currentItem.variantId) {
      const variant = variants.find((v: any) => v.id === currentItem.variantId);
      if (variant) unitPrice = Number(variant.selling_price) || 0;
    } else if (!hasVariants) {
      unitPrice = Number(product.selling_price) || 0;
    } else {
      alert("Please select a variant");
      return;
    }

    const lineTotal = unitPrice * currentItem.quantity;

    const newItem: BookingItem = {
      productId: currentItem.productId,
      variantId: currentItem.variantId,
      quantity: currentItem.quantity,
      unitPrice,
      lineTotal
    };

    setBookingItems(prev => [...prev, newItem]);
    
    // Reset current item
    setCurrentItem({
      productId: null,
      variantId: null,
      quantity: 1
    });
  };

  const removeItem = (index: number) => {
    setBookingItems(prev => prev.filter((_, i) => i !== index));
  };

  const getProductName = (productId: number, variantId: number | null) => {
    const product = products.find(p => p.id === productId);
    if (!product) return "Unknown Product";
    
    if (variantId) {
      const variant = product.variants?.find((v: any) => v.id === variantId);
      if (variant) return `${product.name} (${variant.unit_value} ${variant.unit})`;
    }
    
    return product.name;
  };

  const handleSubmit = async () => {
    if (!values.customerId) {
      alert("Please select a customer");
      return;
    }

    if (bookingItems.length === 0) {
      alert("Please add at least one product to the booking");
      return;
    }

    if (!values.deliveryDate) {
      alert("Please select a delivery date");
      return;
    }

    const bookingData = {
      bookingNumber: `AB-${Date.now()}`,
      customerId: values.customerId,
      items: bookingItems,
      advanceAmount: Number(values.advanceAmount) || 0,
      totalBillAmount: values.totalBillAmount,
      deliveryDate: values.deliveryDate,
      remarks: values.remarks || ""
    };

    try {
      await apiRequest("/api/advance-bookings", {
        method: "POST",
        body: JSON.stringify(bookingData)
      });
      
      // Reset form
      setValues({
        customerId: null,
        deliveryDate: "",
        remarks: "",
        advanceAmount: 0,
        totalBillAmount: 0
      });
      setBookingItems([]);
      setIsModalOpen(false);
      
      // Trigger a re-render by using a key change or state update
      // Force the AdminModule to reload its data
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create booking");
    }
  };

  return (
    <>
      <AdminModule
        key={refreshKey}
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
        headerActions={
          <button 
            className="button" 
            onClick={() => setIsModalOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Plus size={17} />
            Add Booking
          </button>
        }
      />

      {/* Custom Modal for Multiple Products */}
      {isModalOpen && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            style={{
              background: "white",
              borderRadius: "12px",
              maxWidth: "900px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ 
              padding: "20px 24px", 
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>Create Advance Booking</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex"
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "24px" }}>
              {/* Customer Selection */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                  Customer <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={values.customerId || ""}
                  onChange={(e) => setValues(prev => ({ ...prev, customerId: Number(e.target.value) || null }))}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              {/* Add Products Section */}
              <div style={{ 
                padding: "20px", 
                background: "#f8fafc", 
                borderRadius: "8px", 
                marginBottom: "20px" 
              }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 600 }}>Add Products</h3>
                
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "12px", alignItems: "end" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>Product</label>
                    <select
                      value={currentItem.productId || ""}
                      onChange={(e) => setCurrentItem(prev => ({ 
                        ...prev, 
                        productId: Number(e.target.value) || null,
                        variantId: null 
                      }))}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    >
                      <option value="">Select Product</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {hasVariants && (
                    <div>
                      <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>Variant</label>
                      <select
                        value={currentItem.variantId || ""}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, variantId: Number(e.target.value) || null }))}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                      >
                        <option value="">Select Variant</option>
                        {variants.map((v: any) => (
                          <option key={v.id} value={v.id}>{v.unit_value} {v.unit} - ₹{v.selling_price}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={currentItem.quantity}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: Number(e.target.value) || 1 }))}
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    />
                  </div>

                  <button
                    onClick={addItemToBooking}
                    className="button"
                    style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>
              </div>

              {/* Booking Items List */}
              {bookingItems.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: 600 }}>Booking Items</h3>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                        <th style={{ padding: "10px", textAlign: "left", fontSize: "13px", fontWeight: 600 }}>Product</th>
                        <th style={{ padding: "10px", textAlign: "center", fontSize: "13px", fontWeight: 600 }}>Qty</th>
                        <th style={{ padding: "10px", textAlign: "right", fontSize: "13px", fontWeight: 600 }}>Price</th>
                        <th style={{ padding: "10px", textAlign: "right", fontSize: "13px", fontWeight: 600 }}>Total</th>
                        <th style={{ padding: "10px", textAlign: "center", fontSize: "13px", fontWeight: 600 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingItems.map((item, index) => (
                        <tr key={index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px" }}>{getProductName(item.productId, item.variantId)}</td>
                          <td style={{ padding: "10px", textAlign: "center" }}>{item.quantity}</td>
                          <td style={{ padding: "10px", textAlign: "right" }}>₹{item.unitPrice.toFixed(2)}</td>
                          <td style={{ padding: "10px", textAlign: "right", fontWeight: 600 }}>₹{item.lineTotal.toFixed(2)}</td>
                          <td style={{ padding: "10px", textAlign: "center" }}>
                            <button
                              onClick={() => removeItem(index)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#ef4444",
                                cursor: "pointer",
                                padding: "4px",
                                display: "inline-flex"
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: "#f8fafc", fontWeight: 600 }}>
                        <td colSpan={3} style={{ padding: "12px", textAlign: "right" }}>TOTAL:</td>
                        <td style={{ padding: "12px", textAlign: "right", fontSize: "16px", color: "#2f6b3f" }}>
                          ₹{values.totalBillAmount.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Booking Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                    Delivery Date <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={values.deliveryDate}
                    onChange={(e) => setValues(prev => ({ ...prev, deliveryDate: e.target.value }))}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Advance Amount</label>
                  <input
                    type="number"
                    min="0"
                    max={values.totalBillAmount}
                    value={values.advanceAmount}
                    onChange={(e) => setValues(prev => ({ ...prev, advanceAmount: Number(e.target.value) || 0 }))}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>Remarks</label>
                <textarea
                  value={values.remarks}
                  onChange={(e) => setValues(prev => ({ ...prev, remarks: e.target.value }))}
                  rows={3}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  placeholder="Additional notes..."
                />
              </div>

              {/* Summary */}
              {bookingItems.length > 0 && (
                <div style={{ 
                  background: "#f0fdf4", 
                  padding: "16px", 
                  borderRadius: "8px",
                  border: "1px solid #bbf7d0",
                  marginBottom: "20px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span>Total Bill Amount:</span>
                    <span style={{ fontWeight: 600 }}>₹{values.totalBillAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span>Advance Payment:</span>
                    <span style={{ fontWeight: 600 }}>₹{values.advanceAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "2px solid #86efac" }}>
                    <span style={{ fontWeight: 600 }}>Balance Payable:</span>
                    <span style={{ fontWeight: 700, fontSize: "18px", color: "#16a34a" }}>
                      ₹{(values.totalBillAmount - values.advanceAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ 
              padding: "16px 24px", 
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px"
            }}>
              <button
                onClick={() => setIsModalOpen(false)}
                className="button secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="button"
                disabled={bookingItems.length === 0}
              >
                Create Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
