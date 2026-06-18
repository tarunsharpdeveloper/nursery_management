import type { AdvanceBooking, CustomerLedger, Employee, Order, Product } from "./types";

export const products: Product[] = [
  {
    id: 1,
    name: "Alphonso Mango Plant",
    type: "plant",
    category: "Fruit Plants",
    description: "Healthy grafted mango plant ready for farm plantation.",
    price: 220,
    stock: 140,
    sold: 86,
    image: "https://images.unsplash.com/photo-1598512752271-33f913a5af13?auto=format&fit=crop&w=900&q=80",
    active: true
  },
  {
    id: 2,
    name: "Marigold Plant",
    type: "plant",
    category: "Flower Plants",
    description: "Bright flowering plant suitable for gardens and borders.",
    price: 35,
    stock: 520,
    sold: 410,
    image: "https://images.unsplash.com/photo-1471899236350-e3016bf1e69e?auto=format&fit=crop&w=900&q=80",
    active: true
  },
  {
    id: 3,
    name: "Tomato Seeds",
    type: "seed",
    category: "Vegetable Seeds",
    description: "High germination tomato seed packet for vegetable growers.",
    price: 80,
    stock: 300,
    sold: 190,
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=900&q=80",
    active: true
  },
  {
    id: 4,
    name: "Areca Palm",
    type: "plant",
    category: "Ornamental Plants",
    description: "Popular ornamental palm for indoor and outdoor use.",
    price: 180,
    stock: 95,
    sold: 68,
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80",
    active: true
  }
];

export const orders: Order[] = [
  { id: "ORD-1008", customer: "Ramesh Farms", amount: 12400, items: 4, status: "Received", payment: "Pending" },
  { id: "ORD-1007", customer: "Green City Garden", amount: 8750, items: 2, status: "Approved", payment: "Paid" },
  { id: "ORD-1006", customer: "Online Customer", amount: 1680, items: 3, status: "Dispatch", payment: "Paid" },
  { id: "ORD-1005", customer: "Patel Nursery Buyer", amount: 4200, items: 1, status: "Delivered", payment: "Paid" }
];

export const categories = [
  "Fruit Plants",
  "Flower Plants",
  "Medicinal Plants",
  "Ornamental Plants",
  "Vegetable Seeds",
  "Flower Seeds"
];

export const paymentMethods = ["UPI", "Credit Card", "Debit Card", "Net Banking"];

export const ledger: CustomerLedger[] = [
  { customer: "Ramesh Farms", totalPurchase: 12400, amountPaid: 5000, outstanding: 7400 },
  { customer: "Green City Garden", totalPurchase: 8750, amountPaid: 8750, outstanding: 0 }
];

export const advanceBookings: AdvanceBooking[] = [
  {
    bookingNumber: "AB-1001",
    customer: "Ramesh Farms",
    mobile: "9876543210",
    product: "Alphonso Mango Plant",
    quantity: 100,
    advanceAmount: 5000,
    deliveryDate: "2026-08-15",
    status: "Booked",
    totalBill: 22000
  }
];

export const employees: Employee[] = [
  { id: 1, name: "Suresh Patel", mobile: "9432109876", gender: "Male", joiningDate: "2025-01-10", type: "Monthly Salary", salaryOrWage: 18000 },
  { id: 2, name: "Meena Ben", mobile: "9321098765", gender: "Female", joiningDate: "2025-03-15", type: "Daily Wage", salaryOrWage: 400 },
  { id: 3, name: "Raju Kumar", mobile: "9210987654", gender: "Male", joiningDate: "2025-05-20", type: "Daily Wage", salaryOrWage: 500 }
];
