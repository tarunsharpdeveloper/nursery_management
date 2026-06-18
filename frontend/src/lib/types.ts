export type ProductType = "plant" | "seed";

export type Product = {
  id: number;
  name: string;
  type: ProductType;
  category: string;
  description: string;
  price: number;
  stock: number;
  sold: number;
  image: string;
  active: boolean;
};

export type OrderStatus = "Received" | "Approved" | "Dispatch" | "Delivered";

export type Order = {
  id: string;
  customer: string;
  amount: number;
  items: number;
  status: OrderStatus;
  payment: "Paid" | "Pending" | "Failed" | "Refunded";
};

export type Employee = {
  id: number;
  name: string;
  mobile: string;
  gender: "Male" | "Female" | "Other";
  joiningDate: string;
  type: "Monthly Salary" | "Daily Wage";
  salaryOrWage: number;
};

export type AdvanceBooking = {
  bookingNumber: string;
  customer: string;
  mobile: string;
  product: string;
  quantity: number;
  advanceAmount: number;
  deliveryDate: string;
  status: "Booked" | "Ready" | "Delivered" | "Cancelled";
  totalBill: number;
};

export type CustomerLedger = {
  customer: string;
  totalPurchase: number;
  amountPaid: number;
  outstanding: number;
};
