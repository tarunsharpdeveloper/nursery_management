"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, BarChart3, Boxes, CalendarCheck, ClipboardList, CreditCard, Factory, Leaf, LogOut, Menu, NotebookTabs, Package, Receipt, Tags, Truck, UserCircle, Users, User, Shield } from "lucide-react";
import { clearAdminSession, getStoredUser, type AdminUser } from "@/lib/api";

const links = [
  // { href: "/admin", label: "Dashboard", icon: ClipboardList, permission: "dashboard:read" },
  { href: "/admin/dashboard", label: "Dashboard", icon: ClipboardList, permission: "dashboard:read" },
  { href: "/admin/categories", label: "Product Category", icon: Tags, permission: "products:read" },
  { href: "/admin/products", label: "Products", icon: Package, permission: "products:read" },
  // { href: "/admin/inventory", label: "Inventory", icon: Boxes, permission: "inventory:read" },
  { href: "/admin/production", label: "Inventory / Production", icon: Factory, permission: "production:write" },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList, permission: "orders:read" },
  { href: "/admin/payments", label: "Payments", icon: CreditCard, permission: "payments:read" },
  { href: "/admin/billing", label: "Billing", icon: Receipt, permission: "billing:read" },
  { href: "/admin/ledger", label: "Ledger", icon: NotebookTabs, permission: "ledger:read" },
  { href: "/admin/advance-bookings", label: "Bookings", icon: ClipboardList, permission: "bookings:read" },
  { href: "/admin/dispatch", label: "Dispatch", icon: Truck, permission: "dispatch:read" },
  { href: "/admin/employees", label: "Employees", icon: Users, permission: "employees:read" },
  { href: "/admin/attendance", label: "Attendance", icon: CalendarCheck, permission: "attendance:read" },
  { href: "/admin/wages", label: "Wages", icon: Banknote, permission: "wages:read" },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, permission: "reports:read" },
  { href: "/admin/users", label: "Users", icon: UserCircle, permission: "users:read" },
  { href: "/admin/roles", label: "Roles", icon: Shield, permission: "roles:read" }
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
    if (pathname === "/admin/login") return;
    
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.replace("/admin/login");
      return;
    }
    setUser(storedUser);
  }, [router, pathname]);


  const visibleLinks = useMemo(() => {
    if (!user) return [];
    return links.filter((link) => {
      if (user.role === "billing_user" && link.href === "/admin/orders") {
        return false;
      }
      return user.permissions.includes("*") || user.permissions.includes(link.permission);
    });
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

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

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
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Leaf size={20} />
          </div>
          <div className="sidebar-label">
            <h3>Admin Portal</h3>
            <span>Sanviya Hi-Tech Nursery</span>
          </div>
        </div>

        {/* <div className="sidebar-profile">
          <div className="sidebar-avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div className="sidebar-label">
            <strong>{user.name}</strong>
            <span>{user.role.replaceAll("_", " ")}</span>
          </div>
        </div> */}

        <nav className="sidebar-nav" aria-label="Admin navigation">
          {visibleLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link href={href} key={href} title={label} className={isActive ? "active" : undefined}>
                <Icon size={18} />
                <span className="sidebar-label">{label}</span>
              </Link>
            );
          })}
        </nav>

      </aside>

      <div className="content-wrapper">
        <header className="admin-header">
          <div className="admin-header-left">
            <button className="hamburger-btn" onClick={toggleSidebar}>
              <Menu size={22} />
            </button>
          </div>
          <div className="admin-user-profile nav-dropdown" style={{ cursor: "pointer" }}>
            <style>{`
              .admin-dropdown-panel {
                background: #1d3424 !important;
                border-color: #1d3424 !important;
              }
              .admin-dropdown-item {
                color: rgba(255, 255, 255, 0.86) !important;
              }
              .admin-dropdown-item:hover {
                background-color: rgba(255, 255, 255, 0.14) !important;
                color: white !important;
              }
            `}</style>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <UserCircle size={22} />
              <span className="username">{user.name}</span>
            </div>
            <div className="dropdown-panel admin-dropdown-panel" style={{ right: "-12px", left: "auto", minWidth: "150px" }}>
              <Link href="/admin/profile" className="dropdown-item admin-dropdown-item" style={{ display: "flex", alignItems: "center", gap: "8px" }}><User size={16} /> Profile</Link>
              <button onClick={logout} className="dropdown-item admin-dropdown-item" style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}><LogOut size={16} /> Logout</button>
            </div>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}
