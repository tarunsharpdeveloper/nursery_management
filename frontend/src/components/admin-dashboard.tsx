"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/api";

type DashboardStats = {
  total_products: number;
  total_stock: number;
  total_orders: number;
  order_value: number;
  total_bookings: number;
  total_employees: number;
};

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [status, setStatus] = useState("Loading...");

  async function loadStats() {
    try {
      const data = await apiRequest<DashboardStats>("/api/dashboard");
      setStats(data);
      setStatus("Live data loaded from Node backend");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load dashboard");
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <>
      <div className="section-header">
        <div>
          <p className="eyebrow">Super Admin</p>
          <h1>Nursery Operations Dashboard</h1>
          <p className="meta">{status}</p>
        </div>
        <button className="button secondary" type="button" onClick={loadStats}>
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>
      <div className="stat-grid">
        <div className="stat"><span className="meta">Products</span><strong>{stats?.total_products ?? 0}</strong></div>
        <div className="stat"><span className="meta">Available Stock</span><strong>{stats?.total_stock ?? 0}</strong></div>
        <div className="stat"><span className="meta">Orders</span><strong>{stats?.total_orders ?? 0}</strong></div>
        <div className="stat"><span className="meta">Order Value</span><strong>Rs. {Number(stats?.order_value ?? 0).toLocaleString("en-IN")}</strong></div>
        <div className="stat"><span className="meta">Bookings</span><strong>{stats?.total_bookings ?? 0}</strong></div>
        <div className="stat"><span className="meta">Employees</span><strong>{stats?.total_employees ?? 0}</strong></div>
      </div>
      <div className="grid modules">
        {["Products", "Inventory", "Production", "Orders", "Payments", "Billing", "Ledger", "Bookings", "Dispatch", "Employees", "Attendance", "Wages", "Reports"].map((module) => (
          <div className="card" key={module}>
            <div className="card-body">
              <h3>{module}</h3>
              <p className="meta">Connected to Node backend APIs.</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
