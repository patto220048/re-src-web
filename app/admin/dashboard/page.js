"use client";

import useSWR from "swr";
import { FileText, Download, FolderTree, TrendingUp } from "lucide-react";
import styles from "./page.module.css";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function AdminDashboard() {
  const { data: metadata, isLoading: loading } = useSWR('/api/admin/metadata', fetcher);
  
  const stats = metadata?.stats || {
    totalResources: 0,
    totalDownloads: 0,
    totalFolders: 0,
    recentResources: [],
  };

  const statCards = [
    { 
      icon: FileText, 
      label: "Total Resources", 
      value: stats.totalResources, 
      color: "#FACB11" // Brand Gold
    },
    { 
      icon: Download, 
      label: "Total Downloads", 
      value: stats.totalDownloads.toLocaleString(), 
      color: "#FACB11" 
    },
    { 
      icon: FolderTree, 
      label: "Total Folders", 
      value: stats.totalFolders, 
      color: "#FACB11" 
    },
    { 
      icon: TrendingUp, 
      label: "Today Downloads", 
      value: "—", 
      color: "rgba(255, 255, 255, 0.4)" // Muted for pending
    },
  ];

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Dashboard</h1>

      <div className={styles.statsGrid}>
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={styles.statCard} style={{ "--stat-color": stat.color }}>
              <div className={styles.statIcon}>
                <Icon size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>
                  {loading ? "..." : stat.value}
                </span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent Resources</h2>
        {loading ? (
          <div className={styles.emptySection}>
            <p>Loading...</p>
          </div>
        ) : stats.recentResources.length > 0 ? (
          <div className={styles.recentList}>
            {stats.recentResources.map((res) => (
              <div key={res.id} className={styles.recentItem}>
                <span className={styles.recentName}>{res.name}</span>
                <span className={styles.recentMeta}>
                  {res.category} • {res.fileFormat} • {(res.downloadCount || 0).toLocaleString()} downloads
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptySection}>
            <p>No resources yet. Start by uploading resources.</p>
          </div>
        )}
      </div>
    </div>
  );
}
