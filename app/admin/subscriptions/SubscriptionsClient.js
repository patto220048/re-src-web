"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, CheckCircle2, XCircle, Clock, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import styles from "./page.module.css";
import { useDebounce } from "@/app/hooks/useDebounce";
import { useInfiniteScroll } from "@/app/hooks/useInfiniteScroll";
import TableSkeleton from "@/app/components/ui/TableSkeleton";
import toast from "react-hot-toast";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const STATUS_CONFIG = {
  ACTIVE:    { label: "Active",    color: "#22c55e", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "#f43f5e", icon: XCircle      },
  EXPIRED:   { label: "Expired",   color: "#94a3b8", icon: Clock        },
  SUSPENDED: { label: "Suspended", color: "#f59e0b", icon: AlertCircle  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "#94a3b8", icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={styles.badge} style={{ color: cfg.color, borderColor: cfg.color + "44" }}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
}

export default function SubscriptionsClient({ subscriptions: initialSubscriptions }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [subList, setSubList] = useState(initialSubscriptions || []);
  
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const debouncedSearch = useDebounce(query, 500);

  const fetchSubscriptions = useCallback(async (pageNum = 0, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "25",
        q: debouncedSearch,
        filter: filter
      });

      const res = await fetch(`/api/admin/subscriptions?${params.toString()}`);
      const result = await res.json();
      
      if (result.error) throw new Error(result.error);

      if (isInitial) {
        setSubList(result.data);
      } else {
        setSubList(prev => [...prev, ...result.data]);
      }
      
      setHasMore(result.hasMore);
      setTotalCount(result.count);
      setPage(pageNum);
    } catch (err) {
      console.error("Fetch subscriptions error:", err);
      toast.error("Failed to load subscriptions. Please check your connection or permissions.");
      setHasMore(false); // Stop loop on error
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, filter]);

  // Initial load or search/filter change
  useEffect(() => {
    fetchSubscriptions(0, true);
  }, [fetchSubscriptions]);

  // Infinite scroll trigger
  const loaderRef = useInfiniteScroll(hasMore, loading || loadingMore, () => {
    fetchSubscriptions(page + 1);
  });

  const stats = {
    total:     totalCount,
    active:    subList.filter((s) => s.status === "ACTIVE").length, // Note: Local filter for stats is rough but okay for current view
    cancelled: subList.filter((s) => s.status === "CANCELLED").length,
    expired:   subList.filter((s) => s.status === "EXPIRED").length,
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Subscriptions</h1>
        <span className={styles.count}>{stats.total} total</span>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: "#22c55e" }}>{stats.active}</div>
          <div className={styles.statLabel}>Active</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: "#f43f5e" }}>{stats.cancelled}</div>
          <div className={styles.statLabel}>Cancelled</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: "#94a3b8" }}>{stats.expired}</div>
          <div className={styles.statLabel}>Expired</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total</div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by email or subscription ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filters}>
          {["all", "active", "cancelled", "expired"].map((f) => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.active : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Status</th>
              <th>Plan ID</th>
              <th>Started</th>
              <th>Renews / Ended</th>
              <th>PayPal ID</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>
                  <TableSkeleton rows={10} cols={6} />
                </td>
              </tr>
            ) : subList.length === 0 ? (
              <tr><td colSpan={6} className={styles.empty}>No subscriptions found</td></tr>
            ) : subList.map((s) => (
              <tr key={s.id}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.avatar}>
                      {(s.profiles?.full_name || s.profiles?.email || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className={styles.userName}>{s.profiles?.full_name || "—"}</div>
                      <div className={styles.userEmail}>{s.profiles?.email}</div>
                    </div>
                  </div>
                </td>
                <td><StatusBadge status={s.status} /></td>
                <td className={styles.monoCell}>{s.plan_id || "—"}</td>
                <td className={styles.dateCell}>{formatDate(s.current_period_start)}</td>
                <td className={styles.dateCell}>{formatDate(s.current_period_end)}</td>
                <td>
                  <div className={styles.subIdCell}>
                    <span className={styles.monoCell}>{s.paypal_subscription_id?.slice(0, 14)}…</span>
                    <a
                      href={`https://www.sandbox.paypal.com/billing/subscriptions/${s.paypal_subscription_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.extLink}
                      title="View on PayPal"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Infinite Scroll Loader Target */}
      <div ref={loaderRef} className={styles.infiniteLoader}>
        {loadingMore && (
           <div className={styles.moreSpinner}>
             <Loader2 size={24} className={styles.spin} />
             <span>Loading more subscriptions...</span>
           </div>
        )}
        {!hasMore && subList.length > 0 && (
          <p className={styles.endMessage}>All subscriptions loaded</p>
        )}
      </div>
    </div>
  );
}
