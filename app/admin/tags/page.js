"use client";

import { useState, useMemo } from "react";
import useSWR, { useSWRConfig } from "swr";
import { 
  Search, 
  Trash2, 
  Edit2, 
  RefreshCw, 
  Tag as TagIcon, 
  Check, 
  X, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { 
  getTags, 
  renameTagGlobally, 
  deleteTagGlobally, 
  syncAllTagsFromResources 
} from "@/app/lib/api";
import { revalidateTagData, revalidateTagChanges } from "@/app/lib/actions";
import styles from "./page.module.css";
const fetcher = (url) => fetch(url).then((res) => res.json());

export default function AdminTags() {
  const { mutate: globalMutate } = useSWRConfig();
  const { data: tags = [], isLoading: loading, mutate } = useSWR("/api/admin/tags", fetcher);
  const { data: meta } = useSWR("/api/admin/metadata", fetcher);
  
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

  // States for Inline Edit
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Removed useEffect and list loading logic as it's handled by SWR

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredTags = useMemo(() => {
    return tags.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tags, searchQuery]);

  const handleSync = async () => {
    if (!confirm("Bạn có chắc chắn muốn đồng bộ lại toàn bộ Tag? Việc này sẽ quét lại tất cả tài nguyên trong Database.")) return;
    
    setSyncing(true);
    try {
      const count = await syncAllTagsFromResources();
      showToast(`Đã đồng bộ thành công ${count} tag độc nhất.`);
      
      await Promise.all([
        revalidateTagData(),
        globalMutate('/api/admin/metadata'),
        mutate()
      ]);
    } catch (e) {
      showToast("Lỗi khi đồng bộ dữ liệu", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleStartEdit = (tag) => {
    setEditingId(tag.id);
    setEditValue(tag.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleRename = async (oldName) => {
    const newName = editValue.trim();
    if (!newName || newName === oldName) {
      handleCancelEdit();
      return;
    }

    setActionLoading(true);
    try {
      const affected = await renameTagGlobally(oldName, newName);
      showToast(`Đã đổi tên và cập nhật ${affected} tài nguyên.`);
      setEditingId(null);
      await Promise.all([
        revalidateTagChanges(),
        globalMutate('/api/admin/metadata'),
        mutate()
      ]);
    } catch (e) {
      showToast("Lỗi khi đổi tên tag", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (tagName) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tag "${tagName}"? Hành động này sẽ xóa tag khỏi tất cả tài nguyên chứa nó.`)) return;

    setActionLoading(true);
    try {
      const affected = await deleteTagGlobally(tagName);
      showToast(`Đã xóa tag và cập nhật ${affected} tài nguyên.`);
      await Promise.all([
        revalidateTagChanges(),
        globalMutate('/api/admin/metadata'),
        mutate()
      ]);
    } catch (e) {
      showToast("Lỗi khi xóa tag", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const StatsRow = () => (
    <div className={styles.statsRow}>
      <div className={styles.card}>
        <div className={styles.cardInfo}>
          <span className={styles.cardTitle}>Total Unique Tags</span>
          <span className={styles.cardValue}>{tags.length}</span>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.cardInfo}>
          <span className={styles.cardTitle}>Unused Tags</span>
          <span className={styles.cardValue}>
            {tags.filter(t => !t.usageCount || t.usageCount === 0).length}
          </span>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.cardInfo}>
          <span className={styles.cardTitle}>Most Used Tag</span>
          <span className={styles.cardValue} style={{ fontSize: '1.25rem', color: '#FACB11' }}>
            {tags[0]?.name ? `#${tags[0].name}` : '—'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div style={{ flex: 1 }}>
          <h1 className={styles.title}>Tags Management</h1>
          <p className={styles.subtitle}>
            Monitor and manage global searchable keywords across all resources.
          </p>
        </div>
        <div className={styles.actions}>
          <button 
            className={styles.syncBtn} 
            onClick={handleSync}
            disabled={syncing || loading}
          >
            {syncing ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
            {syncing ? "SYNCING..." : "SYNC DATABASE"}
          </button>
        </div>
      </header>

      <StatsRow />

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <input 
            type="text" 
            className={styles.searchInput}
            placeholder="Tìm kiếm tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loadingWrapper}>
            <Loader2 className="animate-spin" size={32} />
            <p>Đang tải danh sách tag...</p>
          </div>
        ) : filteredTags.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tên Tag</th>
                <th>Số lượng sử dụng</th>
                <th className={styles.actionsCell}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredTags.map((tag) => (
                <tr key={tag.id} className={styles.tagRow}>
                  <td>
                    <div className={styles.tagNameCell}>
                      <TagIcon size={16} className={styles.tagIcon} />
                      {editingId === tag.id ? (
                        <input 
                          type="text"
                          className={styles.renameInput}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(tag.name);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                      ) : (
                        <span className={styles.tagBadge}>{tag.name}</span>
                      )}
                    </div>
                  </td>
                  <td className={styles.countCell}>
                    <strong>{tag.usageCount || 0}</strong> tài nguyên
                  </td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actionBtns}>
                      {editingId === tag.id ? (
                        <>
                          <button 
                            className={`${styles.iconBtn} ${styles.saveBtn}`}
                            onClick={() => handleRename(tag.name)}
                            disabled={actionLoading}
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            className={`${styles.iconBtn} ${styles.cancelBtn}`}
                            onClick={handleCancelEdit}
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            className={styles.iconBtn}
                            onClick={() => handleStartEdit(tag)}
                            title="Đổi tên"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className={`${styles.iconBtn} ${styles.deleteBtn}`}
                            onClick={() => handleDelete(tag.name)}
                            title="Xóa toàn cục"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>
            <TagIcon size={48} style={{ marginBottom: "16px", opacity: 0.2 }} />
            <p>Không tìm thấy tag nào.</p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                style={{ marginTop: "12px", color: "var(--border-active)", textDecoration: "underline" }}
              >
                Xóa bộ lọc tìm kiếm
              </button>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={styles.toast} style={{ 
          backgroundColor: toast.type === "error" ? "#ff4d4d" : "#FFFFFF",
          color: toast.type === "error" ? "#FFFFFF" : "#000000"
        }}>
          {toast.type === "error" ? <AlertCircle size={20} style={{marginRight: 8}} /> : <Check size={20} style={{marginRight: 8}} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
