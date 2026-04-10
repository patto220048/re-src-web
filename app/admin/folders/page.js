"use client";

import { useState, useEffect, useMemo } from "react";
import { Folder, MoreVertical, Edit2, Trash2, Plus, Search, ChevronRight, X, FolderOpen } from "lucide-react";
import { getCategories, getFolders, addFolder, updateFolder, deleteFolder, getResources } from "@/app/lib/firestore";
import styles from "./page.module.css";

export default function AdminFolders() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  
  // Breadcrumb tracking: array of folder objects [{id, name}, ...]
  const [path, setPath] = useState([]);
  
  const [folders, setFolders] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  
  const [folderName, setFolderName] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await getCategories();
        setCategories(cats);
        if (cats.length > 0) {
          setActiveCategory(cats[0]);
        }
      } catch (e) {
        console.error("Failed to load categories:", e);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    if (!activeCategory) return;
    loadFolders();
  }, [activeCategory, path]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadFolders() {
    setLoading(true);
    try {
      const parentId = path.length > 0 ? path[path.length - 1].id : null;
      const [foldersData, resourcesData] = await Promise.all([
        getFolders(activeCategory.slug, parentId),
        getResources(activeCategory.slug, parentId)
      ]);
      setFolders(foldersData);
      setResources(resourcesData);
    } catch (e) {
      console.error("Failed to load contents:", e);
    }
    setLoading(false);
  }

  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return folders;
    const term = searchQuery.toLowerCase();
    return folders.filter((f) => f.name?.toLowerCase().includes(term));
  }, [folders, searchQuery]);

  const filteredResources = useMemo(() => {
    if (!searchQuery.trim()) return resources;
    const term = searchQuery.toLowerCase();
    return resources.filter((r) => r.name?.toLowerCase().includes(term));
  }, [resources, searchQuery]);

  async function handleCreateFolder(e) {
    e.preventDefault();
    if (!folderName.trim() || !activeCategory) return;
    
    try {
      const parentId = path.length > 0 ? path[path.length - 1].id : null;
      const slug = folderName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      await addFolder({
        name: folderName.trim(),
        slug: slug,
        categorySlug: activeCategory.slug,
        parentId: parentId,
        order: folders.length
      });
      setFolderName("");
      setCreateModalOpen(false);
      loadFolders();
    } catch (e) {
      alert("Failed to create folder: " + e.message);
    }
  }

  async function handleEditFolder(e) {
    e.preventDefault();
    if (!folderName.trim() || !selectedFolder) return;
    
    try {
      await updateFolder(selectedFolder.id, {
        name: folderName.trim(),
      });
      setFolderName("");
      setSelectedFolder(null);
      setEditModalOpen(false);
      loadFolders();
    } catch (e) {
      alert("Failed to update folder: " + e.message);
    }
  }

  async function handleDeleteFolder(folder) {
    if (folder.resourceCount > 0) {
      alert(`Cannot delete folder "${folder.name}" because it contains ${folder.resourceCount} resources. Please move or delete them first.`);
      return;
    }
    if (!confirm(`Are you sure you want to delete "${folder.name}"?`)) return;
    
    try {
      await deleteFolder(folder.id);
      loadFolders();
    } catch (e) {
      alert("Failed to delete folder: " + e.message);
    }
    setActiveDropdown(null);
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(`.${styles.dropdown}`) && !e.target.closest(`.${styles.folderMenuBtn}`)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Folder Management</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={styles.addBtn} onClick={() => { setFolderName(""); setCreateModalOpen(true); }}>
            <Plus size={18} /> New Folder
          </button>
          <a href={`/admin/resources/new${path.length > 0 ? '?folderId=' + path[path.length - 1].id : ''}`} className={styles.addBtn} style={{ background: 'var(--primary-color)', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plus size={18} /> Upload Resource
          </a>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Sidebar for Categories */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarTitle}>Categories</div>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.catTab} ${activeCategory?.id === cat.id ? styles.catTabActive : ""}`}
              onClick={() => {
                setActiveCategory(cat);
                setPath([]); // Reset path when switching category
                setSearchQuery("");
              }}
            >
              <FolderOpen size={16} />
              {cat.name}
            </button>
          ))}
          {categories.length === 0 && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: 'var(--space-2)' }}>No categories found</div>}
        </div>

        {/* Main Content */}
        <div className={styles.main}>
          <div className={styles.toolbar}>
            {/* Breadcrumbs */}
            <div className={styles.breadcrumb}>
              <button style={{fontWeight: path.length === 0 ? "600" : "normal", color: path.length === 0 ? "var(--text-primary)" : undefined}} onClick={() => setPath([])}>
                {activeCategory ? activeCategory.name : "Root"}
              </button>
              {path.map((folder, index) => (
                <span key={folder.id}>
                  <ChevronRight size={16} color="var(--text-muted)" />
                  <button style={{fontWeight: index === path.length - 1 ? "600" : "normal", color: index === path.length - 1 ? "var(--text-primary)" : undefined}} onClick={() => setPath(path.slice(0, index + 1))}>
                    {folder.name}
                  </button>
                </span>
              ))}
            </div>

            {/* Search */}
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          {/* Folder Grid */}
          {loading ? (
            <div className={styles.emptyState}>Loading contents...</div>
          ) : (filteredFolders.length > 0 || filteredResources.length > 0) ? (
             <div className={styles.grid}>
              {/* Render Folders */}
              {filteredFolders.map((folder) => (
                <div key={`folder-${folder.id}`} className={styles.folderItem} onClick={(e) => {
                  if (!e.target.closest(`.${styles.folderMenuBtn}`) && !e.target.closest(`.${styles.dropdown}`)) {
                    setPath([...path, folder]);
                    setSearchQuery("");
                  }
                }}>
                  <div className={styles.folderHeader}>
                    <Folder size={32} className={styles.folderIcon} fill="var(--neon-cyan)" fillOpacity={0.2} strokeWidth={1.5} />
                    <button 
                      className={styles.folderMenuBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === folder.id ? null : folder.id);
                      }}
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>
                  
                  {activeDropdown === folder.id && (
                    <div className={styles.dropdown}>
                      <button 
                        className={styles.dropdownBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFolder(folder);
                          setFolderName(folder.name);
                          setEditModalOpen(true);
                          setActiveDropdown(null);
                        }}
                      >
                        <Edit2 size={14} /> Rename
                      </button>
                      <button 
                        className={`${styles.dropdownBtn} ${styles.danger}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder);
                        }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}

                  <div>
                    <div className={styles.folderName}>{folder.name}</div>
                    <div className={styles.folderMeta}>{folder.resourceCount || 0} items</div>
                  </div>
                </div>
              ))}

              {/* Render Resources */}
              {filteredResources.map((resource) => (
                <div key={`res-${resource.id}`} className={styles.folderItem} style={{ border: '1px solid var(--border-color)', background: 'var(--surface-color)' }}>
                  <div className={styles.folderHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '10px', fontWeight: 'bold' }}>
                      {resource.fileFormat || 'FILE'}
                    </div>
                  </div>
                  <div>
                    <div className={styles.folderName}>{resource.name}</div>
                    <div className={styles.folderMeta}>{resource.fileSize ? (resource.fileSize / 1024 / 1024).toFixed(2) + ' MB' : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              {searchQuery ? `No items match "${searchQuery}"` : "This folder is empty."}
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>New Folder</h2>
              <button className={styles.modalClose} onClick={() => setCreateModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateFolder}>
              <div className={styles.modalBody}>
                <label>
                  <span className={styles.modalLabel}>Folder Name</span>
                  <input
                    autoFocus
                    type="text"
                    required
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    className={styles.modalInput}
                    placeholder="e.g. Hero Sections"
                  />
                </label>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={() => setCreateModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.btnSubmit} disabled={!folderName.trim()}>Create Folder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Rename Folder</h2>
              <button className={styles.modalClose} onClick={() => setEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditFolder}>
              <div className={styles.modalBody}>
                <label>
                  <span className={styles.modalLabel}>Folder Name</span>
                  <input
                    autoFocus
                    type="text"
                    required
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    className={styles.modalInput}
                  />
                </label>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={() => setEditModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.btnSubmit} disabled={!folderName.trim()}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
