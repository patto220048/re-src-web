"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth-context";
import { LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";
import styles from "./page.module.css";

export default function AdminLogin() {
  const router = useRouter();
  const { user, profile, isAdmin, loginWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already logged in as admin — redirect to dashboard
  useEffect(() => {
    if (user && isAdmin) {
      router.replace("/admin/dashboard");
    } else if (user && profile && !isAdmin) {
      // Logged in but not admin — show error
      setError("You do not have admin privileges.");
    }
  }, [user, profile, isAdmin, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginWithEmail(email, password);
      // Auth context will update, useEffect will handle redirect
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  // If already admin, don't show login form (redirect happening)
  if (user && isAdmin) return null;

  return (
    <div className={styles.page}>
      <form className={styles.form} onSubmit={handleLogin}>
        <div className={styles.header}>
          <h1 className={styles.title}>Admin Login</h1>
          <p className={styles.subtitle}>SFXFolder.com Management</p>
        </div>

        {error && (
          <div className={styles.error}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@SFXFolder.com.com"
            className={styles.input}
            required
            id="admin-email"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Password</label>
          <div className={styles.passwordWrap}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className={styles.input}
              required
              id="admin-password"
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          <LogIn size={18} />
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
