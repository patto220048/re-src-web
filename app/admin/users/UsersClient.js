"use client";

import { useState, useTransition, useEffect, useCallback, useMemo } from "react";
import useSWR, { useSWRConfig } from 'swr';
import useSWRInfinite from 'swr/infinite';
import { 
  Search, Shield, User, Crown, ChevronDown, Loader2, Plus, 
  Edit2, Trash2, CheckCircle2, ArrowUp, ArrowDown, Download,
  ArrowUpDown
} from "lucide-react";
import toast from "react-hot-toast";
import styles from "./page.module.css";
import { useDebounce } from "@/app/hooks/useDebounce";
import { useInfiniteScroll } from "@/app/hooks/useInfiniteScroll";
import TableSkeleton from "@/app/components/ui/TableSkeleton";
import UserModal from "./UserModal";
import AnimatedContainer from "@/app/components/ui/AnimatedContainer";

function formatRelativeTime(date) {
  if (!date) return "—";
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const ROLE_CONFIG = {
  admin:   { label: "Admin",   color: "#f59e0b", icon: Shield },
  premium: { label: "Premium", color: "#a855f7", icon: Crown  },
  user:    { label: "User",    color: "#64748b", icon: User   },
};

const SUB_STATUS_CONFIG = {
  active:    { label: "Active",    color: "#22c55e" },
  free:      { label: "Free",      color: "#64748b" },
  cancelled: { label: "Cancelled", color: "#f43f5e" },
  expired:   { label: "Expired",   color: "#94a3b8" },
};

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  const Icon = cfg.icon;
  return (
    <span className={styles.badge} style={{ color: cfg.color, borderColor: cfg.color + "44" }}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
}

function SubBadge({ status }) {
  const cfg = SUB_STATUS_CONFIG[status] || SUB_STATUS_CONFIG.free;
  return (
    <span className={styles.badge} style={{ color: cfg.color, borderColor: cfg.color + "44" }}>
      {cfg.label}
    </span>
  );
}

async function updateUserRole(userId, newRole) {
  const res = await fetch("/api/admin/users/role", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, role: newRole }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed");
}

const fetcher = url => fetch(url).then(r => r.json());

export default function UsersClient({ users: initialUsers }) {

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [order, setOrder] = useState("desc");
  const [exportLimit, setExportLimit] = useState("100");
  
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const debouncedSearch = useDebounce(query, 500);

  // SWR Configuration
  const getKey = (pageIndex, previousPageData) => {
    if (previousPageData && !previousPageData.hasMore) return null;
    const params = new URLSearchParams({
      page: pageIndex.toString(),
      limit: "25",
      search: debouncedSearch,
      filter: filter,
      sortBy: sortBy,
      order: order
    });
    return `/api/admin/users?${params.toString()}`;
  };

  const { mutate: globalMutate } = useSWRConfig();
  const mutateMeta = () => globalMutate('/api/admin/metadata');

  // Metadata SWR
  const { data: metaData } = useSWR('/api/admin/metadata', fetcher, {
    refreshInterval: 30000, // Sync every 30s
  });

  const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
    persistSize: true,
    fallbackData: initialUsers ? [{ data: initialUsers, hasMore: true, count: initialUsers.length }] : undefined
  });

  const userList = data ? data.map(page => page?.data || []).flat().filter(Boolean) : [];
  const loading = !data && !error;
  const loadingMore = size > 0 && data && typeof data[size - 1] === "undefined";
  const hasMore = data ? data[data.length - 1]?.hasMore : true;
  const totalCount = data ? data[0]?.count : 0;

  // Infinite scroll trigger
  const loaderRef = useInfiniteScroll(hasMore, loading || loadingMore || isValidating, () => {
    if (hasMore && !isValidating) {
      setSize(size + 1);
    }
  });


  const handleRoleChange = (userId, newRole) => {
    startTransition(async () => {
      const toastId = toast.loading("Updating role...");
      try {
        await updateUserRole(userId, newRole);
        // Mutate both users list and global metadata
        await Promise.all([mutate(), mutateMeta()]);
        toast.success("Role updated", { id: toastId });

      } catch (err) {
        toast.error(err.message, { id: toastId });
      }
    });
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    startTransition(async () => {
      const toastId = toast.loading("Deleting user...");
      try {
        const res = await fetch(`/api/admin/users/${userToDelete}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to delete");
        }
        // Mutate both
        await Promise.all([mutate(), mutateMeta()]);
        toast.success("User deleted permanently", { id: toastId });
        setUserToDelete(null);
      } catch (err) {
        toast.error(err.message, { id: toastId });
      }
    });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setOrder(order === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setOrder("desc");
    }
  };

  const handleExport = async () => {
    const toastId = toast.loading(`Preparing export for ${exportLimit} users...`);
    try {
      const res = await fetch(`/api/admin/users/export?limit=${exportLimit}`);
      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success("CSV exported successfully", { id: toastId });
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

  const openAddModal = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setSelectedUser(u);
    setIsModalOpen(true);
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ArrowUpDown size={14} className={styles.sortIconIdle} />;
    return order === "desc" ? <ArrowDown size={14} className={styles.sortIconActive} /> : <ArrowUp size={14} className={styles.sortIconActive} />;
  };

  return (
    <div className={styles.container}>
      <AnimatedContainer type="fade">
        <div className={styles.header}>
          <div style={{ flex: 1 }}>
            <h1 className={styles.title}>Users Management</h1>
            <p className={styles.subtitle}>
              Monitor and manage user accounts, permissions, and subscriptions.
            </p>
          </div>
          <div className={styles.headerActions}>
             <div className={styles.exportGroup}>
               <select 
                 className={styles.limitSelect}
                 value={exportLimit}
                 onChange={(e) => setExportLimit(e.target.value)}
                >
                 <option value="50">Last 50</option>
                 <option value="100">Last 100</option>
                 <option value="500">Last 500</option>
                 <option value="all">All Users</option>
               </select>
               <button className={styles.btnExport} onClick={handleExport}>
                 <Download size={18} /> Export CSV
               </button>
             </div>
             <button className={styles.btnAdd} onClick={openAddModal}>
               <Plus size={18} /> New User
             </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className={styles.statsRow}>
          <div className={`${styles.statsCard} ${styles.totalUsers}`}>
            <div className={styles.statsIcon}>
              <User size={24} />
            </div>
            <div className={styles.statsInfo}>
              <span className={styles.statsLabel}>Total Users</span>
              <span className={styles.statsValue}>
                {metaData?.stats?.totalUsers ?? totalCount ?? "..."}
              </span>
            </div>
          </div>
          
          <div className={`${styles.statsCard} ${styles.premiumUsers}`}>
            <div className={styles.statsIcon}>
              <Crown size={24} />
            </div>
            <div className={styles.statsInfo}>
              <span className={styles.statsLabel}>Premium</span>
              <span className={styles.statsValue}>
                {metaData?.stats?.totalPremium ?? "..."}
              </span>
            </div>
          </div>

          <div className={`${styles.statsCard} ${styles.adminUsers}`}>
            <div className={styles.statsIcon}>
              <Shield size={24} />
            </div>
            <div className={styles.statsInfo}>
              <span className={styles.statsLabel}>Admins</span>
              <span className={styles.statsValue}>
                {metaData?.stats?.totalAdmins ?? "..."}
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filters}>
            {["all", "admin", "premium", "user"].map((f) => (
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
      </AnimatedContainer>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => handleSort("full_name")} className={styles.sortableHead}>
                User <SortIcon field="full_name" />
              </th>
              <th>Role</th>
              <th>Subscription</th>
              <th onClick={() => handleSort("subscription_expires_at")} className={styles.sortableHead}>
                Expires <SortIcon field="subscription_expires_at" />
              </th>
               <th onClick={() => handleSort("last_active_at")} className={styles.sortableHead}>
                Last Active <SortIcon field="last_active_at" />
              </th>
              <th onClick={() => handleSort("created_at")} className={`${styles.sortableHead} ${styles.hideOnMobile}`}>
                Joined <SortIcon field="created_at" />
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody style={{ opacity: isValidating && !loadingMore ? 0.7 : 1, transition: 'opacity 0.2s' }}>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <TableSkeleton rows={10} cols={7} />
                </td>
              </tr>
            ) : userList.length === 0 ? (
              <tr><td colSpan={7} className={styles.empty}>No users found</td></tr>
            ) : (
                userList.filter(u => u).map((u, idx) => (
                  <tr key={u.id}>
                  <td>
                    <AnimatedContainer type="staggerItem">
                      <div className={styles.userCell}>
                        <div className={styles.avatar}>{(u?.full_name || u?.email || "?")[0].toUpperCase()}</div>
                        <div>
                          <div className={styles.userName}>{u?.full_name || "—"}</div>
                          <div className={styles.userEmail}>
                            {u?.email}
                            {u?.email_verified_at && (
                              <CheckCircle2 size={12} className={styles.verifiedIcon} title={`Verified at ${new Date(u.email_verified_at).toLocaleString()}`} />
                            )}
                          </div>
                        </div>
                      </div>
                    </AnimatedContainer>
                  </td>
                  <td><RoleBadge role={u.role} /></td>
                  <td><SubBadge status={u.subscription_status || "free"} /></td>
                  <td className={styles.dateCell}>{formatDate(u.subscription_expires_at)}</td>
                  <td className={styles.dateCell}>{formatRelativeTime(u.last_active_at)}</td>
                  <td className={`${styles.dateCell} ${styles.hideOnMobile}`}>{formatDate(u.created_at)}</td>
                   <td>
                    <div className={styles.actions}>
                      <button 
                        className={styles.actionBtn} 
                        onClick={() => openEditModal(u)}
                        title="Edit user"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className={`${styles.actionBtn} ${styles.delete}`} 
                        onClick={() => setUserToDelete(u.id)}
                        title="Delete user"
                        disabled={isPending}
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className={styles.roleSelect}>
                        <select
                          value={u.role || "user"}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className={styles.select}
                          disabled={isPending}
                        >
                          <option value="user">User</option>
                          <option value="premium">Premium</option>
                          <option value="admin">Admin</option>
                        </select>
                        <ChevronDown size={14} className={styles.selectIcon} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Infinite Scroll Loader Target */}
      <div ref={loaderRef} className={styles.infiniteLoader}>
        {loadingMore && (
           <div className={styles.moreSpinner}>
             <Loader2 size={24} className={styles.spin} />
             <span>Loading more users...</span>
           </div>
        )}
        {!hasMore && userList.length > 0 && (
           <p className={styles.endMessage}>All users loaded</p>
        )}
      </div>

      {isModalOpen && (
        <UserModal 
          user={selectedUser} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            mutate();
            mutateMeta();
          }} 
        />
      )}

      {userToDelete && (
        <div className={styles.overlay} onClick={() => setUserToDelete(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>Confirm Deletion</div>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              Are you sure you want to delete this user vĩnh viễn? This action cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setUserToDelete(null)} disabled={isPending}>
                Cancel
              </button>
              <button className={styles.btnDanger} onClick={handleDelete} disabled={isPending}>
                {isPending ? (
                  <div className={styles.moreSpinner}>
                    <Loader2 size={18} className={styles.spin} />
                  </div>
                ) : (
                  "Delete Permanently"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
