"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Loader2, 
  AlertTriangle,
  MoveUp,
  MoveDown
} from "lucide-react";
import { 
  getCategoriesWithCounts, 
  addCategory, 
  updateCategory, 
  deleteCategory 
} from "@/app/lib/api";
import styles from "./page.module.css";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    order: 0,
    description: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getCategoriesWithCounts();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: "", slug: "", order: categories.length, description: "" });
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || "",
      slug: cat.slug || "",
      order: cat.order || 0,
      description: cat.description || ""
    });
    setError("");
    setModalOpen(true);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: val,
      // Auto-slug if not editing or if slug was auto-generated
      slug: !editingCategory ? val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : prev.slug
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await addCategory(formData);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (cat.resourceCount > 0) {
      alert(`Cannot delete category "${cat.name}" because it contains ${cat.resourceCount} resources.`);
      return;
    }

    if (confirm(`Are you sure you want to delete the category "${cat.name}"?`)) {
      setLoading(true);
      try {
        await deleteCategory(cat.id);
        loadData();
      } catch (err) {
        alert(err.message);
        setLoading(false);
      }
    }
  };

  if (loading && categories.length === 0) {
    return (
      <div className={styles.loadingArea}>
        <Loader2 className="animate-spin" />
        <p>Loading categories...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Manage Categories</h1>
        <button onClick={openAddModal} className={styles.addBtn}>
          <Plus size={18} />
          Add Category
        </button>
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order</th>
              <th>Name</th>
              <th>Slug</th>
              <th>Description</th>
              <th>Resources</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td>
                  <span className={styles.orderBadge}>{cat.order}</span>
                </td>
                <td><strong>{cat.name}</strong></td>
                <td><code>{cat.slug}</code></td>
                <td style={{ maxWidth: '300px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {cat.description || "—"}
                </td>
                <td>
                  <span className={styles.countBadge}>{cat.resourceCount} items</span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button 
                      className={styles.editBtn} 
                      onClick={() => openEditModal(cat)}
                      title="Edit Category"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      className={styles.deleteBtn} 
                      onClick={() => handleDelete(cat)}
                      title="Delete Category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                  No categories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingCategory ? "Edit Category" : "New Category"}
              </h2>
              <button className={styles.closeBtn} onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={handleNameChange} 
                  required 
                  placeholder="e.g. Cinematic SFX"
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Slug (URL Key)</label>
                <input 
                  type="text" 
                  value={formData.slug} 
                  onChange={(e) => setFormData(p => ({ ...p, slug: e.target.value }))} 
                  required 
                  placeholder="e.g. cinematic-sfx"
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Display Order</label>
                <input 
                  type="number" 
                  value={formData.order} 
                  onChange={(e) => setFormData(p => ({ ...p, order: parseInt(e.target.value) }))} 
                  required 
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Description (Optional)</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} 
                  rows={3}
                  placeholder="Short description for this category..."
                />
              </div>

              {error && (
                <div className={styles.errorMsg}>
                  <AlertTriangle size={14} style={{ marginRight: 4 }} />
                  {error}
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
