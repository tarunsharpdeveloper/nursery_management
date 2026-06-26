"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/api";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      // Already logged in, redirect to dashboard
      router.replace("/admin/dashboard");
    } else {
      // Not logged in, redirect to login
      router.replace("/admin/login");
    }
  }, [router]);

  return (
    <main className="section">
      {/* <p className="meta">Redirecting...</p> */}
    </main>
  );
}
