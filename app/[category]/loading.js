import styles from "./page.module.css";

export default function Loading() {
  return (
    <div className={styles.page}>
      {/* Sidebar Skeleton */}
      <aside className={styles.sidebarSkeleton}>
        <div className={styles.skeletonHeader} />
        <div className={styles.skeletonList}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className={styles.skeletonNavItem} />
          ))}
        </div>
      </aside>

      <main className={styles.main}>
        {/* Breadcrumb Skeleton */}
        <div className={styles.breadcrumbSkeleton}>
          <div className={styles.skeletonBreadPart} />
        </div>

        {/* Title Skeleton */}
        <div className={styles.titleSkeleton} />

        {/* FilterBar Skeleton */}
        <div className={styles.filterBarSkeleton} />

        {/* Grid Skeleton */}
        <div className={styles.grid}>
          {[...Array(12)].map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonThumb} />
              <div className={styles.skeletonCardBody}>
                <div className={styles.skeletonLine} style={{ width: "70%" }} />
                <div className={styles.skeletonLine} style={{ width: "40%" }} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
