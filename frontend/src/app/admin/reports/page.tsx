"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AdminModule } from "@/components/admin-module";
import { Download, Search } from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("sales");
  
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  const currentMonth = today.toISOString().slice(0, 7);

  const [fromDate, setFromDate] = useState(firstDay);
  const [toDate, setToDate] = useState(lastDay);
  const [month, setMonth] = useState(currentMonth);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterValue, setFilterValue] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setSearchQuery("");
    setFilterValue("");
  }, [reportType]);

  const reportConfig = useMemo(() => {
    const buildPath = (base: string) => {
      const url = new URL(base, typeof window !== "undefined" ? window.location.origin : "http://localhost");
      if (debouncedSearch) url.searchParams.set("search", debouncedSearch);
      if (filterValue) {
        if (reportType === "sales") url.searchParams.set("filterKey", "bill_type");
        url.searchParams.set("filterValue", filterValue);
      }
      return url.pathname + url.search;
    };

    switch (reportType) {
      case "sales":
        return {
          title: "Sales Report",
          listPath: buildPath(`/api/reports?report=sales&fromDate=${fromDate}&toDate=${toDate}`),
          columns: [
            { key: "bill_date", label: "Date" },
            { key: "bill_number", label: "Bill" },
            { key: "customer", label: "Customer" },
            { key: "bill_type", label: "Bill Type" },
            { key: "total_amount", label: "Total" },
            { key: "paid_amount", label: "Paid" },
            { key: "balance_amount", label: "Balance" }
          ],
          localSearchPlaceholder: "Search bill or customer...",
          localFilterConfig: {
            label: "Bill Type",
            options: [
              { value: "cash_sale", label: "Cash Sale" },
              { value: "credit_sale", label: "Credit Sale" }
            ]
          }
        };
      case "product_wise_sales":
        return {
          title: "Product Wise Sales",
          listPath: buildPath(`/api/reports?report=product_wise_sales&fromDate=${fromDate}&toDate=${toDate}`),
          columns: [
            { key: "product_name", label: "Product" },
            { key: "total_quantity", label: "Quantity Sold" },
            { key: "total_revenue", label: "Revenue" }
          ],
        };
      case "stock":
        return {
          title: "Stock Report",
          listPath: buildPath("/api/reports?report=stock"),
          columns: [
            { key: "name", label: "Product Name" },
            { key: "available_quantity", label: "Available Quantity" }
          ],
        };
      case "advance_bookings":
        return {
          title: "Advance Booking Report",
          listPath: buildPath(`/api/reports?report=advance_bookings&fromDate=${fromDate}&toDate=${toDate}`),
          columns: [
            { key: "delivery_date", label: "Delivery Date" },
            { key: "booking_number", label: "Booking No." },
            { key: "customer", label: "Customer" },
            { key: "product", label: "Product" },
            { key: "quantity", label: "Quantity" },
            { key: "advance_amount", label: "Advance" },
            { key: "total_bill_amount", label: "Total Bill" },
            { key: "status", label: "Status" }
          ]
        };
      case "outstanding":
        return {
          title: "Outstanding Report",
          listPath: buildPath("/api/reports?report=outstanding"),
          columns: [
            { key: "name", label: "Customer" },
            { key: "total_purchase", label: "Total Purchase" },
            { key: "amount_paid", label: "Amount Paid" },
            { key: "outstanding_amount", label: "Outstanding" }
          ]
        };
      case "attendance":
        return {
          title: "Attendance Report",
          listPath: buildPath(`/api/reports?report=attendance&fromDate=${fromDate}&toDate=${toDate}`),
          columns: [
            { key: "attendance_date", label: "Date" },
            { key: "employee", label: "Employee" },
            { key: "status", label: "Status" },
            { key: "remarks", label: "Remarks" }
          ]
        };
      case "wage_summary":
        return {
          title: "Wage Summary Report",
          listPath: buildPath(`/api/wages/summary?month=${month}`),
          columns: [
            { key: "name", label: "Employee" },
            { key: "employee_type", label: "Type" },
            { key: "days_worked", label: "Days Worked" },
            { key: "absent_days", label: "Absent Days" },
            { key: "monthly_salary", label: "Monthly Salary" },
            { key: "daily_wage", label: "Daily Wage" },
            { key: "payable_amount", label: "Payable Amount" }
          ]
        };
      default:
        return null;
    }
  }, [reportType, fromDate, toDate, month, debouncedSearch, filterValue]);

  const exportToCsv = async () => {
    if (!reportConfig) return;
    try {
      const url = new URL(reportConfig.listPath, window.location.origin);
      const res = await apiRequest<any>(url.pathname + url.search);
      let data = [];
      if (res && typeof res === 'object' && !Array.isArray(res) && 'data' in res) {
        data = res.data || [];
      } else {
        data = Array.isArray(res) ? res : [];
      }

      if (!data.length) {
        alert("No data to export");
        return;
      }

      const columns = reportConfig.columns;
      const headers = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
      const csvRows = data.map((row: any) => 
        columns.map(c => {
          let val = row[c.key];
          if (val === null || val === undefined) val = "";
          if (typeof val === 'string') {
             if (/^\d{4}-\d{2}-\d{2}T/.test(val)) val = val.slice(0, 10);
             val = val.replace(/"/g, '""');
          }
          return `"${val}"`;
        }).join(',')
      );

      const csvString = [headers, ...csvRows].join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `${reportConfig.title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export data");
    }
  };

  if (!reportConfig) return null;

  const filterContent = (
    <div className="filter-bar-container" style={{ margin: "0 0 20px 0" }}>
      <div className="filter-bar-wrapper" style={{ flexWrap: "nowrap", overflowX: "auto", paddingBottom: "4px" }}>
        
        <div className="filter-group-fixed" style={{ minWidth: "160px" }}>
          <label className="filter-label">Report Type</label>
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            className="filter-select"
          >
            <option value="sales">Sales Report</option>
            <option value="product_wise_sales">Product Wise Sales</option>
            <option value="stock">Stock Report</option>
            <option value="advance_bookings">Advance Bookings</option>
            <option value="outstanding">Outstanding</option>
            <option value="attendance">Attendance</option>
            <option value="wage_summary">Wage Summary</option>
          </select>
        </div>

        {reportType !== "stock" && reportType !== "outstanding" && reportType !== "wage_summary" && (
          <>
            <div className="filter-group-fixed" style={{ minWidth: "130px" }}>
              <label className="filter-label">From Date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="filter-input" />
            </div>
            <div className="filter-group-fixed" style={{ minWidth: "130px" }}>
              <label className="filter-label">To Date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="filter-input" />
            </div>
          </>
        )}

        {reportType === "wage_summary" && (
          <div className="filter-group-fixed" style={{ minWidth: "130px" }}>
            <label className="filter-label">Month</label>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="filter-input" />
          </div>
        )}

        {reportConfig.localSearchPlaceholder && (
          <div className="filter-group" style={{ minWidth: "200px", flex: 1 }}>
            <label className="filter-label">Search</label>
            <div className="filter-input-wrapper">
              <div className="filter-input-icon"><Search size={16} /></div>
              <input type="text" placeholder={reportConfig.localSearchPlaceholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="filter-input" />
            </div>
          </div>
        )}

        {reportConfig.localFilterConfig && (
          <div className="filter-group-fixed" style={{ minWidth: "140px" }}>
            <label className="filter-label">{reportConfig.localFilterConfig.label}</label>
            <select value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="filter-select">
              <option value="">All</option>
              {reportConfig.localFilterConfig.options.map((o: any) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

      </div>
    </div>
  );

  return (
    <>
      <AdminModule
        key={`${reportType}-${debouncedSearch}-${filterValue}`}
        eyebrow="Reports"
        title={reportConfig.title}
        listPath={reportConfig.listPath}
        columns={reportConfig.columns}
        filterContent={filterContent}
        headerActions={
          <button className="button secondary" onClick={exportToCsv} type="button">
            <Download size={17} />
            Export CSV
          </button>
        }
      />
    </>
  );
}
