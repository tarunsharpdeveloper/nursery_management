"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Banknote, BarChart3, Boxes, CalendarCheck, ClipboardList, CreditCard, Factory, NotebookTabs, Package, Receipt, Tags, Truck, Users } from "lucide-react";
import { clearAdminSession, getStoredUser, type AdminUser } from "@/lib/api";

const links = [
  { href: "/admin", label: "Dashboard", icon: ClipboardList, permission: "dashboard:read" },
  { href: "/admin/products", label: "Products", icon: Package, permission: "products:read" },
  { href: "/admin/categories", label: "Categories", icon: Tags, permission: "products:read" },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes, permission: "inventory:read" },
  { href: "/admin/production", label: "Production", icon: Factory, permission: "production:write" },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList, permission: "orders:read" },
  { href: "/admin/payments", label: "Payments", icon: CreditCard, permission: "payments:read" },
  { href: "/admin/billing", label: "Billing", icon: Receipt, permission: "billing:read" },
  { href: "/admin/ledger", label: "Ledger", icon: NotebookTabs, permission: "ledger:read" },
  { href: "/admin/advance-bookings", label: "Bookings", icon: ClipboardList, permission: "bookings:read" },
  { href: "/admin/dispatch", label: "Dispatch", icon: Truck, permission: "dispatch:read" },
  { href: "/admin/employees", label: "Employees", icon: Users, permission: "employees:read" },
  { href: "/admin/attendance", label: "Attendance", icon: CalendarCheck, permission: "attendance:read" },
  { href: "/admin/wages", label: "Wages", icon: Banknote, permission: "wages:read" },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, permission: "reports:read" }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.replace("/admin/login");
      return;
    }
    setUser(storedUser);
  }, [router]);

  const visibleLinks = useMemo(() => {
    if (!user) return [];
    return links.filter((link) => user.permissions.includes("*") || user.permissions.includes(link.permission));
  }, [user]);

  function logout() {
    clearAdminSession();
    router.replace("/admin/login");
  }

  if (!user) {
    return <main className="section"><p className="meta">Checking login...</p></main>;
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h3>Admin Portal</h3>
        <p className="meta" style={{ color: "rgba(255,255,255,0.7)" }}>{user.name}<br />{user.role}</p>
        {visibleLinks.map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href} style={pathname === href ? { background: "rgba(255,255,255,0.14)", color: "white" } : undefined}>
            <Icon size={18} />
            {label}
          </Link>
        ))}
        <button className="button secondary" type="button" onClick={logout} style={{ marginTop: 18, width: "100%" }}>
          Logout
        </button>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
