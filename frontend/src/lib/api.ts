export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "staff_user" | "billing_user";
  permissions: string[];
};

export function getStoredToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("admin_token") || "";
}

export function getStoredUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("admin_user");
  return raw ? JSON.parse(raw) as AdminUser : null;
}

export function storeAdminSession(token: string, user: AdminUser) {
  localStorage.setItem("admin_token", token);
  localStorage.setItem("admin_user", JSON.stringify(user));
}

export function setStoredUser(user: AdminUser) {
  if (typeof window !== "undefined") {
    localStorage.setItem("admin_user", JSON.stringify(user));
  }
}

export function clearAdminSession() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => ({}));

  if (response.status === 401) {
    clearAdminSession();
    if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
      window.location.href = "/admin/login";
    }
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    throw new Error(payload.message || "API request failed");
  }

  return payload as T;
}
