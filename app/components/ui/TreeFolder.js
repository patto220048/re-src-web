import { useState, useMemo, useEffect, memo } from "react";
import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import styles from "./TreeFolder.module.css";

const TreeItem = memo(function TreeItem({ 
  folder, 
  selectedFolderId, 
  onSelect, 
  primaryColor, 
  expandedNodes,
  isCollapsed,
  level = 0 
}) {
  const isExpandedInitially = expandedNodes.has(folder.id);
  const [expanded, setExpanded] = useState(isExpandedInitially);

  useEffect(() => {
    if (isExpandedInitially) setExpanded(true);
  }, [isExpandedInitially]);

  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = selectedFolderId === folder.id;

  return (
    <li className={styles.item}>
      <button
        className={`${styles.row} ${isSelected ? styles.active : ""} ${isCollapsed ? styles.collapsedRow : ""}`}
        style={{ paddingLeft: isCollapsed ? "0" : `${16 + level * 16}px` }}
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          onSelect(folder);
        }}
      >
        {hasChildren && !isCollapsed && (
          <ChevronRight
            size={14}
            className={`${styles.chevron} ${expanded ? styles.chevronOpen : ""}`}
          />
        )}
        {!hasChildren && !isCollapsed && <span className={styles.spacer} />}
        {expanded ? (
          <FolderOpen size={16} className={styles.folderIcon} />
        ) : (
          <Folder size={16} className={styles.folderIcon} />
        )}
        {!isCollapsed && <span className={styles.name}>{folder.name}</span>}
        {folder.totalResourceCount > 0 && !isCollapsed && (
          <span className={styles.count}>{folder.totalResourceCount}</span>
        )}
      </button>
      {hasChildren && expanded && !isCollapsed && (
        <ul className={styles.children}>
          {folder.children.map((child) => (
            <TreeItem
              key={child.id}
              folder={child}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              primaryColor={primaryColor}
              expandedNodes={expandedNodes}
              isCollapsed={isCollapsed}
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
});

const TreeFolder = memo(function TreeFolder({ folders = [], selectedFolderId, onSelect, primaryColor, isCollapsed }) {
  const expandedNodes = useMemo(() => {
    const expanded = new Set();
    if (!selectedFolderId) return expanded;

    const findAndMark = (nodes) => {
      for (const node of nodes) {
        if (node.id === selectedFolderId) return true;
        if (node.children && findAndMark(node.children)) {
          expanded.add(node.id);
          return true;
        }
      }
      return false;
    };

    findAndMark(folders);
    return expanded;
  }, [folders, selectedFolderId]);

  return (
    <nav 
      className={`${styles.tree} ${isCollapsed ? styles.collapsed : ""}`} 
      aria-label="Folder navigation"
      style={{ "--cat-color": primaryColor }}
    >
      <ul className={styles.list}>
        {folders.map((folder) => (
          <TreeItem
            key={folder.id}
            folder={folder}
            selectedFolderId={selectedFolderId}
            onSelect={onSelect}
            primaryColor={primaryColor}
            expandedNodes={expandedNodes}
            isCollapsed={isCollapsed}
          />
        ))}
      </ul>
    </nav>
  );
});

export default TreeFolder;
