"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, BarChart3, Boxes, CalendarCheck, ClipboardList, CreditCard, Factory, Menu, NotebookTabs, Package, Receipt, Tags, Truck, UserCircle, Users } from "lucide-react";
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
  // "open" = full sidebar with labels, "collapsed" = icon-only, "closed" = fully hidden (mobile)
  const [sidebarState, setSidebarState] = useState<"open" | "collapsed" | "closed">("open");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function checkMobile() {
      const mobile = window.innerWidth <= 780;
      setIsMobile(mobile);
      if (mobile) setSidebarState("closed");
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.replace("/admin/login");
      return;
    }
    setUser(storedUser);
  }, [router]);

  // While logged in, intercept browser back button to stay inside admin
  useEffect(() => {
    if (!user) return;

    function handlePopState() {
      router.replace("/admin");
    }

    window.addEventListener("popstate", handlePopState);
    // Push a history entry on each admin page so back is always trapped
    window.history.pushState({ from: "admin-portal" }, "");

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [user, pathname]);

  const visibleLinks = useMemo(() => {
    if (!user) return [];
    return links.filter((link) => user.permissions.includes("*") || user.permissions.includes(link.permission));
  }, [user]);

  function logout() {
    clearAdminSession();
    // Go to login and allow back-button to work normally (to home page)
    router.replace("/admin/login");
  }

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (isMobile) {
      setSidebarState("closed");
    }
  }, [pathname, isMobile]);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setSidebarState((current) => current === "open" ? "closed" : "open");
    } else {
      setSidebarState((current) => current === "open" ? "collapsed" : "open");
    }
  }, [isMobile]);

  const sidebarClassName = sidebarState === "open" ? "sidebar-open" : sidebarState === "collapsed" ? "sidebar-collapsed" : "sidebar-closed";

  if (!user) {
    return <main className="section"><p className="meta">Checking login...</p></main>;
  }

  return (
    <div className={`dashboard ${sidebarClassName}`}>
      {/* Mobile overlay */}
      {sidebarState === "open" && isMobile && (
        <div className="sidebar-overlay" onClick={() => setSidebarState("closed")} />
      )}

      <aside className="sidebar">
        <h3 className="sidebar-label">Admin Portal</h3>
        <p className="meta sidebar-label" style={{ color: "rgba(255,255,255,0.7)" }}>{user.name}<br />{user.role}</p>
        {visibleLinks.map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href} title={label} style={pathname === href ? { background: "rgba(255,255,255,0.14)", color: "white" } : undefined}>
            <Icon size={18} />
            <span className="sidebar-label">{label}</span>
          </Link>
        ))}
        <button className="button secondary" type="button" onClick={logout} style={{ marginTop: 18 }}>
          <span className="sidebar-label">Logout</span>
        </button>
      </aside>

      <div className="content-wrapper">
        <header className="admin-header">
          <div className="admin-header-left">
            <button className="hamburger-btn" onClick={toggleSidebar}>
              <Menu size={22} />
            </button>
          </div>
          <div className="admin-user-profile">
            <UserCircle size={22} />
            <span className="username">{user.name}</span>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}
