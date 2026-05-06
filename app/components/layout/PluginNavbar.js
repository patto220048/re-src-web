"use client";
import { useState, useEffect, useRef } from "react";
import { Home, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./PluginNavbar.module.css";

export default function PluginNavbar({ breadcrumbs = [], categoryName = "", onBreadcrumbClick }) {
  const router = useRouter();
  const navRef = useRef(null);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    if (!navRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Trigger compact mode when navbar width is < 380px
        // This better aligns with 1-2 column grids in Premiere
        setIsCompact(entry.contentRect.width < 380);
      }
    });
    
    observer.observe(navRef.current);
    return () => observer.disconnect();
  }, []);

  // Use compact mode strictly based on available width
  const displayCompact = isCompact;
  
  const handleReload = () => {
    // Clear API data cache to force a fresh load from server
    if (typeof window !== 'undefined') {
      localStorage.removeItem('plugin_data_v1');
    }
    window.location.reload();
  };

  return (
    <div className={styles.navGroup} ref={navRef}>
      <div className={styles.buttons}>
        <button onClick={() => router.back()} className={styles.iconBtn} title="Back">
          <ChevronLeft size={14} />
        </button>
        <button onClick={() => router.forward()} className={styles.iconBtn} title="Forward">
          <ChevronRight size={14} />
        </button>
        <button onClick={handleReload} className={styles.iconBtn} title="Refresh">
          <RefreshCw size={14} />
        </button>
        <button onClick={() => onBreadcrumbClick?.(null)} className={styles.iconBtn} title="Category Home">
          <Home size={14} />
        </button>
      </div>

      <div className={styles.divider} />

      <div className={styles.path}>
        <button 
          className={styles.pathItem}
          onClick={() => onBreadcrumbClick?.(null)}
        >
          {categoryName}
        </button>
        
        {displayCompact && breadcrumbs.length > 1 ? (
          <>
            <div className={styles.pathSegment}>
              <ChevronRight size={12} className={styles.sep} />
              <span className={styles.ellipsis}>...</span>
            </div>
            <div className={styles.pathSegment} key={breadcrumbs[breadcrumbs.length - 1].id}>
              <ChevronRight size={12} className={styles.sep} />
              <button 
                className={styles.pathItem}
                onClick={() => onBreadcrumbClick?.(breadcrumbs[breadcrumbs.length - 1].id)}
              >
                {breadcrumbs[breadcrumbs.length - 1].name}
              </button>
            </div>
          </>
        ) : (
          breadcrumbs.map((bc) => (
            <div key={bc.id} className={styles.pathSegment}>
              <ChevronRight size={12} className={styles.sep} />
              <button 
                className={styles.pathItem}
                onClick={() => onBreadcrumbClick?.(bc.id)}
              >
                {bc.name}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

