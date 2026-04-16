import Link from "next/link";
import { getIcon } from "./IconLib";
import styles from "./CategoryCard.module.css";

export default function CategoryCard({ name, slug, icon, color, resourceCount = 0, index = 0 }) {
  const IconComponent = getIcon(icon);

  return (
    <Link
      href={`/${slug}`}
      className={styles.card}
      style={{
        "--card-color": color,
        "--pulse-color": `${color}33`,
        "--stagger-index": index,
      }}
      id={`category-card-${slug}`}
    >
      <div className={styles.iconWrap}>
        <IconComponent size={28} strokeWidth={1.8} />
      </div>
      <h3 className={styles.name}>
        {name} {resourceCount > 0 && `(${resourceCount})`}
      </h3>
      <span className={styles.count}>
        {resourceCount > 0 ? "Browse library" : "Coming soon"}
      </span>
      <div className={styles.glow} />
    </Link>
  );
}
