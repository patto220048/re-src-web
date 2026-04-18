import styles from "./TableSkeleton.module.css";

export default function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className={styles.skeletonContainer}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className={styles.row}>
          {[...Array(cols)].map((_, j) => (
            <div key={j} className={styles.cell}>
              <div className={styles.shimmer}></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
