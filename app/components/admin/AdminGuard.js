"use client";

import { useAuth } from "@/app/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AdminGuard({ children }) {
  const { user, profile, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return; // Still loading, don't redirect yet

    const isLoginPage = pathname === "/admin/login";

    if (!user && !isLoginPage) {
      router.replace("/admin/login");
      return;
    }

    // If user is logged in but NOT admin, and NOT on login page — kick out
    if (user && !isAdmin && !isLoginPage) {
      router.replace("/");
      return;
    }
  }, [user, profile, loading, isAdmin, pathname, router]);

  // Still loading auth state
  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--bg-primary)",
        color: "var(--text-muted)",
        fontSize: "1rem",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 32, height: 32,
            border: "3px solid var(--border-default)",
            borderTopColor: "var(--neon-cyan)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 12px",
          }} />
          Verifying access...
        </div>
      </div>
    );
  }

  // Not logged in, on login page — just show login
  if (!user && pathname === "/admin/login") {
    return children;
  }

  // Not logged in, not on login page — redirect is happening in useEffect
  if (!user) {
    return null;
  }

  // Logged in but not admin — redirect is happening in useEffect
  if (!isAdmin) {
    return null;
  }

  // Admin verified — show admin content
  return children;
}
