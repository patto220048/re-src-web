/* eslint-disable */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronRight, Menu, X } from "lucide-react";
import TreeFolder from "@/app/components/ui/TreeFolder";
import styles from "./Sidebar.module.css";

const MIN_WIDTH = 200;
const MAX_WIDTH = 500;
const DEFAULT_WIDTH = 260;

export default function Sidebar({
  categoryName,
  folders = [],
  selectedFolderId,
  onSelectFolder,
  primaryColor = "#FFFFFF",
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);

  // Load width from localStorage on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem("sidebarWidth");
    if (savedWidth) {
      setWidth(parseInt(savedWidth, 10));
    }
  }, []);

  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    localStorage.setItem("sidebarWidth", width.toString());
  }, [width]);

  const resize = useCallback(
    (e) => {
      if (isResizing) {
        let newWidth = e.clientX;
        if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
        if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
        setWidth(newWidth);
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
      // Add class to body to prevent text selection and keep cursor style consistent
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    }

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <>
      {/* Mobile toggle */}
      <button
        className={styles.mobileToggle}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        <span>Folders</span>
      </button>

      <aside
        ref={sidebarRef}
        className={`${styles.sidebar} ${mobileOpen ? styles.open : ""} ${
          isResizing ? styles.isResizing : ""
        }`}
        id="category-sidebar"
        style={{ 
          "--cat-color": primaryColor,
          width: mobileOpen ? undefined : `${width}px` 
        }}
      >
        {/* Resize Handle */}
        <div className={styles.resizer} onMouseDown={startResizing} />
        <div className={styles.header}>
          <h3 className={styles.title}>{categoryName || "Folders"}</h3>
        </div>

        <div className={styles.content}>
          {/* "All" option */}
          <button
            className={`${styles.allBtn} ${!selectedFolderId ? styles.allActive : ""}`}
            onClick={() => {
              onSelectFolder?.(null);
              setMobileOpen(false);
            }}
          >
            <ChevronRight size={14} />
            <span>All Resources</span>
          </button>

          <TreeFolder
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelect={(folder) => {
              onSelectFolder?.(folder);
              setMobileOpen(false);
            }}
          />
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
      )}
    </>
  );
}
