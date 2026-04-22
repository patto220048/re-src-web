"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, CalendarDays, XCircle, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import styles from "./page.module.css";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function StatusBadge({ status }) {
  const map = {
    ACTIVE: { label: "Active", color: "#22c55e", icon: CheckCircle2 },
    CANCELLED: { label: "Cancelled", color: "#f43f5e", icon: XCircle },
    EXPIRED: { label: "Expired", color: "#94a3b8", icon: XCircle },
    SUSPENDED: { label: "Auto-renew Off", color: "#f59e0b", icon: AlertCircle },
  };
  const cfg = map[status] || { label: status, color: "#94a3b8", icon: AlertCircle };
  const Icon = cfg.icon;
  return (
    <span className={styles.statusBadge} style={{ color: cfg.color, borderColor: cfg.color }}>
      <Icon size={14} />
      {cfg.label}
    </span>
  );
}

export default function SubscriptionClient({ subscription, planLabel, userEmail, isMonthly }) {
  const router = useRouter();
  const [toggling, setToggling] = useState(false);

  const isActive = subscription?.status === "ACTIVE";
  const isSuspended = subscription?.status === "SUSPENDED";
  const isCancelled = subscription?.status === "CANCELLED" || subscription?.status === "EXPIRED";
  
  const handleToggleAutoRenew = async (e) => {
    const newVal = e.target.checked;
    setToggling(true);
    const toastId = toast.loading(newVal ? "Enabling auto-renewal..." : "Disabling auto-renewal...");

    try {
      const res = await fetch("/api/paypal/subscription/toggle-auto-renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          subscriptionID: subscription.paypal_subscription_id,
          autoRenew: newVal
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      toast.success(newVal ? "Auto-renewal enabled!" : "Auto-renewal disabled. You'll retain access until expiry.", { id: toastId });
      
      // Refresh to update UI
      router.refresh();
      // Also update local state if router.refresh is not immediate
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Crown size={32} />
        <h1 className={styles.title}>My Subscription</h1>
        <p className={styles.subtitle}>{userEmail}</p>
      </div>

      {!subscription ? (
        <div className={styles.card}>
          <p className={styles.emptyText}>You don't have an active subscription.</p>
          <a href="/pricing" className={styles.upgradeBtn}>View Premium Plans</a>
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.row}>
            <span className={styles.label}>Plan</span>
            <div className={styles.planValueWrapper}>
              <span className={styles.value}>{planLabel}</span>
              {isMonthly && isActive && (
                <button 
                  className={styles.miniUpgradeBtn}
                  onClick={() => router.push("/pricing?upgrade=true")}
                >
                  Upgrade to Yearly
                </button>
              )}
            </div>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Status</span>
            <StatusBadge status={subscription.status} />
          </div>

          <div className={styles.row}>
            <span className={styles.label}>
              <CalendarDays size={15} style={{ display: "inline", marginRight: 4 }} />
              Started
            </span>
            <span className={styles.value}>{formatDate(subscription.current_period_start)}</span>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>
              <CalendarDays size={15} style={{ display: "inline", marginRight: 4 }} />
              {isActive ? "Renews on" : "Expires on"}
            </span>
            <span className={styles.value}>{formatDate(subscription.current_period_end)}</span>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Subscription ID</span>
            <span className={styles.valueSmall}>{subscription.paypal_subscription_id}</span>
          </div>

          {!isCancelled && (
            <div className={styles.switchRow}>
              <div className={styles.switchLabel}>
                <span className={styles.switchTitle}>Auto-renewal</span>
                <span className={styles.switchDesc}>
                  {isActive ? "Your plan will renew automatically." : "Your plan will not renew."}
                </span>
              </div>
              <label className={`${styles.toggleContainer} ${toggling ? styles.disabled : ""}`}>
                <input
                  type="checkbox"
                  className={styles.toggleInput}
                  checked={isActive}
                  onChange={handleToggleAutoRenew}
                  disabled={toggling}
                />
                <span className={styles.toggleSlider}></span>
              </label>
            </div>
          )}

          {isCancelled && (
            <>
              <div className={styles.divider} />
              <a href="/pricing" className={styles.upgradeBtn}>Resubscribe</a>
            </>
          )}
        </div>
      )}
    </div>
  );
}
