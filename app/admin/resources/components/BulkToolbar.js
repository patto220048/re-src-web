"use client";

import { Trash2, Edit2, Share2, X, Move } from "lucide-react";
import styles from "./BulkToolbar.module.css";

export default function BulkToolbar({ 
  selectedCount, 
  onClear, 
  onDelete, 
  onEdit, 
  onMove 
}) {
  if (selectedCount === 0) return null;

  return (
    <div className={styles.toolbar}>
      <div className={styles.info}>
        <div className={styles.countBadge}>{selectedCount}</div>
        <span>Đã chọn tài nguyên</span>
        <button onClick={onClear} className={styles.clearBtn} title="Bỏ chọn tất cả">
          <X size={16} />
        </button>
      </div>

      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={onMove}>
          <Move size={18} />
          <span>Di chuyển</span>
        </button>
        <button className={styles.actionBtn} onClick={onEdit}>
          <Edit2 size={18} />
          <span>Chỉnh sửa</span>
        </button>
        <button className={`${styles.actionBtn} ${styles.delete}`} onClick={onDelete}>
          <Trash2 size={18} />
          <span>Xóa</span>
        </button>
      </div>
    </div>
  );
}
