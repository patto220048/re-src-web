"use client";

import { useState } from "react";
import { useAuth } from "@/app/lib/auth-context";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import styles from "./page.module.css";

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <Lock size={32} />
        </div>
        <h1 className={styles.title}>Set New Password</h1>
        <p className={styles.subtitle}>
          Enter your new password below.
        </p>

        {success ? (
          <div className={styles.successMsg}>
            <Check size={20} />
            <span>Password updated! Redirecting...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.errorMsg}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>New Password</label>
              <div className={styles.inputWrap}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={styles.input}
                  required
                  minLength={6}
                  id="new-password"
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

            <div className={styles.field}>
              <label className={styles.label}>Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className={styles.input}
                required
                id="confirm-password"
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
