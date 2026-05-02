import { useState, useMemo, useEffect, memo } from "react";
import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import styles from "./TreeFolder.module.css";

const TreeItem = memo(function TreeItem({ 
  folder, 
  selectedFolderId, 
  onSelect, 
  primaryColor, 
  expandedNodes,
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
        className={`${styles.row} ${isSelected ? styles.active : ""}`}
        style={{ paddingLeft: `${16 + level * 16}px` }}
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          onSelect(folder);
        }}
      >
        {hasChildren && (
          <ChevronRight
            size={14}
            className={`${styles.chevron} ${expanded ? styles.chevronOpen : ""}`}
          />
        )}
        {!hasChildren && <span className={styles.spacer} />}
        {expanded ? (
          <FolderOpen size={16} className={styles.folderIcon} />
        ) : (
          <Folder size={16} className={styles.folderIcon} />
        )}
        <span className={styles.name}>{folder.name}</span>
        {folder.totalResourceCount > 0 && (
          <span className={styles.count}>{folder.totalResourceCount}</span>
        )}
      </button>
      {hasChildren && expanded && (
        <ul className={styles.children}>
          {folder.children.map((child) => (
            <TreeItem
              key={child.id}
              folder={child}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              primaryColor={primaryColor}
              expandedNodes={expandedNodes}
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
});

const TreeFolder = memo(function TreeFolder({ folders = [], selectedFolderId, onSelect, primaryColor }) {
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
      className={styles.tree} 
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
          />
        ))}
      </ul>
    </nav>
  );
});

export default TreeFolder;
