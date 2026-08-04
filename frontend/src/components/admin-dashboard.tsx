"use client";

import { useEffect, useState } from "react";
import { 
  RefreshCw, 
  Calendar, 
  TrendingUp, 
  ShoppingBag, 
  IndianRupee, 
  BarChart3
} from "lucide-react";
import { apiRequest } from "@/lib/api";

type DashboardStats = {
  total_products: number;
  total_stock: number;
  total_orders: number;
  order_value: number;
  total_bookings: number;
  total_employees: number;
};

type GraphItem = {
  date: string;
  label: string;
  orders: number;
  revenue: number;
};

type GraphResponse = {
  preset: string;
  startDate: string;
  endDate: string;
  period_orders: number;
  period_revenue: number;
  average_order_value: number;
  data: GraphItem[];
};

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Graph state & filter controls
  const [preset, setPreset] = useState<string>("7days");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [loadingGraph, setLoadingGraph] = useState(true);
  const [metricView, setMetricView] = useState<"orders" | "revenue">("revenue");
  const [hoveredPoint, setHoveredPoint] = useState<GraphItem | null>(null);

  async function loadStats() {
    setLoadingStats(true);
    try {
      const data = await apiRequest<DashboardStats>("/api/dashboard");
      setStats(data);
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    } finally {
      setLoadingStats(false);
    }
  }

  async function loadGraphData() {
    setLoadingGraph(true);
    try {
      let url = `/api/admin/orders-graph?preset=${preset}`;
      if (preset === "custom" && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }
      const data = await apiRequest<GraphResponse>(url);
      setGraphData(data);
    } catch (error) {
      console.error("Failed to load orders graph data:", error);
    } finally {
      setLoadingGraph(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (preset === "custom" && (!customStart || !customEnd)) return;
    loadGraphData();
  }, [preset, customStart, customEnd]);

  // Calculations for graph height rendering
  const items = graphData?.data || [];
  const maxVal = Math.max(
    ...items.map((i) => (metricView === "revenue" ? i.revenue : i.orders)),
    1
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Header */}
      <div className="section-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "var(--text)" }}>Admin Dashboard</h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: "4px 0 0 0" }}>
            Overview of nursery operations, stock, and orders performance analytics
          </p>
        </div>
        <button
          className="button secondary"
          type="button"
          onClick={() => {
            loadStats();
            loadGraphData();
          }}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <RefreshCw size={16} className={loadingStats || loadingGraph ? "spin" : ""} />
          Refresh Data
        </button>
      </div>

      {/* Main KPI Stat Cards */}
      <div className="stat-grid">
        <div className="stat">
          <span className="meta">Products</span>
          <strong>{stats?.total_products ?? 0}</strong>
        </div>
        <div className="stat">
          <span className="meta">Available Stock</span>
          <strong>{stats?.total_stock ?? 0}</strong>
        </div>
        <div className="stat">
          <span className="meta">Total Orders</span>
          <strong>{stats?.total_orders ?? 0}</strong>
        </div>
        <div className="stat">
          <span className="meta">Total Order Value</span>
          <strong>Rs. {Number(stats?.order_value ?? 0).toLocaleString("en-IN")}</strong>
        </div>
        <div className="stat">
          <span className="meta">Advance Bookings</span>
          <strong>{stats?.total_bookings ?? 0}</strong>
        </div>
        <div className="stat">
          <span className="meta">Total Employees</span>
          <strong>{stats?.total_employees ?? 0}</strong>
        </div>
      </div>

      {/* Orders Analytics Graph Section */}
      <div className="dashboard-analytics-card">
        {/* Header & Filter Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <BarChart3 size={22} color="#2f6b3f" />
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "var(--text)" }}>Orders & Revenue Analytics</h2>
            </div>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: "4px 0 0 0" }}>
              Filter order performance trends by custom dates or presets
            </p>
          </div>

          <style jsx global>{`
            .dashboard-analytics-card {
              background: white;
              border-radius: 16px;
              border: 1px solid #e2e8f0;
              box-shadow: 0 4px 20px rgba(0,0,0,0.04);
              padding: 24px;
              display: flex;
              flex-direction: column;
              gap: 20px;
            }
            .dashboard-filter-container {
              display: flex;
              align-items: center;
              gap: 10px;
              flex-wrap: wrap;
            }
            .dashboard-filter-buttons {
              display: flex;
              background: #f1f5f9;
              padding: 3px;
              border-radius: 10px;
              gap: 2px;
              overflow-x: auto;
              max-width: 100%;
              -webkit-overflow-scrolling: touch;
              scrollbar-width: none;
            }
            .dashboard-filter-buttons::-webkit-scrollbar {
              display: none;
            }
            .filter-btn {
              padding: 6px 14px;
              border-radius: 8px;
              border: none;
              background: transparent;
              color: #64748b;
              font-weight: 500;
              font-size: 13px;
              cursor: pointer;
              white-space: nowrap;
              transition: all 0.2s;
            }
            .filter-btn.active {
              background: white;
              color: #2f6b3f;
              font-weight: 700;
              box-shadow: 0 2px 5px rgba(0,0,0,0.06);
            }
            .custom-date-box {
              display: flex;
              align-items: center;
              gap: 8px;
              background: #f8fafc;
              padding: 4px 10px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
            }
            .custom-date-input {
              border: none;
              background: transparent;
              font-size: 12px;
              color: var(--text);
            }
            .dashboard-kpi-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
              gap: 16px;
              background: #f8fafc;
              padding: 16px;
              border-radius: 12px;
              border: 1px solid #f1f5f9;
            }

            @media (max-width: 640px) {
              .dashboard-analytics-card {
                padding: 14px 12px;
                border-radius: 12px;
                gap: 14px;
              }
              .dashboard-filter-container {
                width: 100%;
                flex-direction: column;
                align-items: stretch;
              }
              .dashboard-filter-buttons {
                width: 100%;
              }
              .custom-date-box {
                width: 100%;
                justify-content: space-between;
              }
              .custom-date-input {
                width: 42%;
              }
              .dashboard-kpi-grid {
                grid-template-columns: 1fr;
                padding: 12px;
                gap: 12px;
              }
            }
          `}</style>

          {/* Date Range Filter Controls */}
          <div className="dashboard-filter-container">
            <div className="dashboard-filter-buttons">
              {[
                { key: "today", label: "Today" },
                { key: "7days", label: "Last 7 Days" },
                { key: "30days", label: "Last 30 Days" },
                { key: "this_month", label: "This Month" },
                { key: "custom", label: "Custom Range" }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setPreset(tab.key)}
                  className={`filter-btn ${preset === tab.key ? "active" : ""}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Custom Date Range Inputs */}
            {preset === "custom" && (
              <div className="custom-date-box">
                <Calendar size={15} color="#64748b" />
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="custom-date-input"
                />
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="custom-date-input"
                />
              </div>
            )}
          </div>
        </div>

        {/* Selected Period Key Summary Badges */}
        <div className="dashboard-kpi-grid">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a", flexShrink: 0 }}>
              <ShoppingBag size={20} />
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>Period Orders</span>
              <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "var(--text)" }}>{graphData?.period_orders ?? 0}</h3>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", flexShrink: 0 }}>
              <IndianRupee size={20} />
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>Period Revenue</span>
              <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "var(--text)" }}>
                Rs. {Number(graphData?.period_revenue ?? 0).toLocaleString("en-IN")}
              </h3>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706", flexShrink: 0 }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>Avg. Order Value</span>
              <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "var(--text)" }}>
                Rs. {Number(graphData?.average_order_value ?? 0).toLocaleString("en-IN")}
              </h3>
            </div>
          </div>

          {/* Metric View Toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <div style={{ display: "flex", background: "#e2e8f0", padding: "2px", borderRadius: "8px" }}>
              <button
                onClick={() => setMetricView("revenue")}
                style={{
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "none",
                  background: metricView === "revenue" ? "#2f6b3f" : "transparent",
                  color: metricView === "revenue" ? "white" : "#475569",
                  cursor: "pointer"
                }}
              >
                Revenue (₹)
              </button>
              <button
                onClick={() => setMetricView("orders")}
                style={{
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "none",
                  background: metricView === "orders" ? "#2563eb" : "transparent",
                  color: metricView === "orders" ? "white" : "#475569",
                  cursor: "pointer"
                }}
              >
                Orders Count
              </button>
            </div>
          </div>
        </div>

        {/* Graph Visual Area - Mobile Smooth Scroll */}
        {loadingGraph ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
            Loading graph data...
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
            No order data available for the selected date range.
          </div>
        ) : (
          <div style={{ position: "relative", width: "100%", marginTop: "10px" }}>
            {/* Tooltip Popup */}
            {hoveredPoint && (
              <div
                style={{
                  position: "absolute",
                  top: "-45px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#0f172a",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  pointerEvents: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  whiteSpace: "nowrap",
                  zIndex: 10
                }}
              >
                {hoveredPoint.label}: {metricView === "revenue" ? `Rs. ${hoveredPoint.revenue.toLocaleString("en-IN")}` : `${hoveredPoint.orders} Orders`}
              </div>
            )}

            {/* Scrollable Bar Chart Area */}
            <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: "24px" }}>
              <div
                style={{
                  minWidth: items.length > 7 ? `${items.length * 46}px` : "100%",
                  display: "flex",
                  alignItems: "flex-end",
                  height: "230px",
                  gap: "12px",
                  paddingBottom: "30px",
                  borderBottom: "2px solid #e2e8f0",
                  position: "relative"
                }}
              >
                {items.map((item, idx) => {
                  const val = metricView === "revenue" ? item.revenue : item.orders;
                  const heightPct = Math.max(Math.round((val / maxVal) * 100), val > 0 ? 6 : 2);
                  const isHovered = hoveredPoint?.date === item.date;

                  return (
                    <div
                      key={item.date || idx}
                      onMouseEnter={() => setHoveredPoint(item)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        height: "100%",
                        justifyContent: "flex-end",
                        cursor: "pointer",
                        position: "relative"
                      }}
                    >
                      {/* Bar */}
                      <div
                        style={{
                          width: "100%",
                          maxWidth: "36px",
                          height: `${heightPct}%`,
                          background: isHovered
                            ? metricView === "revenue" ? "linear-gradient(180deg, #15803d 0%, #166534 100%)" : "linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)"
                            : metricView === "revenue" ? "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)" : "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
                          borderRadius: "6px 6px 0 0",
                          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                          boxShadow: isHovered ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
                          transform: isHovered ? "scaleY(1.03)" : "scaleY(1)"
                        }}
                      />

                      {/* Date X-Axis Label */}
                      <span
                        style={{
                          position: "absolute",
                          bottom: "-24px",
                          fontSize: "11px",
                          color: isHovered ? "var(--text)" : "var(--muted)",
                          fontWeight: isHovered ? 700 : 500,
                          whiteSpace: "nowrap"
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
