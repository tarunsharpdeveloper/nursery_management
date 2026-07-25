export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export function getMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("/")) return url;
  return `/uploads/${url}`;
}

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "staff_user" | "billing_user";
  permissions: string[];
};

export function getStoredToken() {
  if (typeof window === "undefined") return "";
  const isAdminPath = window.location.pathname.startsWith("/admin");
  if (isAdminPath) {
    return localStorage.getItem("admin_token") || "";
  }
  return localStorage.getItem("customer_token") || "";
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

function getApiErrorMessage(payload: any) {
  if (Array.isArray(payload?.error) && payload.error[0]?.message) {
    return payload.error[0].message;
  }
  return payload?.message || "API request failed";
}

export interface ApiOptions extends RequestInit {
  skipAuthRedirect?: boolean;
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => ({}));

  if (response.status === 401) {
    if (!options.skipAuthRedirect && typeof window !== "undefined") {
      const isAdminRoute = window.location.pathname.startsWith("/admin");
      if (isAdminRoute) {
        clearAdminSession();
        if (window.location.pathname !== "/admin/login") {
          window.location.href = "/admin/login";
        }
      } else {
        localStorage.removeItem("customer_token");
        localStorage.removeItem("customer_user");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    throw new Error(getApiErrorMessage(payload) || "Session expired. Please log in again.");
  }

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload));
  }

  return payload as T;
}
