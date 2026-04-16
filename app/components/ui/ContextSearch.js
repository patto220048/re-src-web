"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { getIcon } from "@/app/components/ui/IconLib";
import styles from "./ContextSearch.module.css";

function getCategoryIcon(iconName, size = 16) {
  const Icon = getIcon(iconName);
  return <Icon size={size} />;
}

// Helper to highlight matched text
function highlightText(text, matches = [], keyName) {
  if (!text) return null;
  const match = matches.find(m => m.key === keyName);
  if (!match || !match.indices || match.indices.length === 0) {
    return text; // No match on this key
  }

  const elements = [];
  let lastIndex = 0;
  match.indices.forEach(([start, end], idx) => {
    if (start > lastIndex) {
      elements.push(<span key={`text-${idx}`}>{text.substring(lastIndex, start)}</span>);
    }
    // fuse.js end index is inclusive
    elements.push(
      <mark key={`mark-${idx}`} className={styles.highlight}>
        {text.substring(start, end + 1)}
      </mark>
    );
    lastIndex = end + 1;
  });

  if (lastIndex < text.length) {
    elements.push(<span key={`text-last`}>{text.substring(lastIndex)}</span>);
  }

  return <>{elements}</>;
}

export default function ContextSearch() {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  const close = useCallback(() => {
    setVisible(false);
    setQuery("");
    setResults([]);
    setActiveIndex(0);
    // Clear page filter too
    window.dispatchEvent(new CustomEvent("local-search", { detail: "" }));
  }, []);

  // Debounced search when query changes
  useEffect(() => {
    if (!visible) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query.trim())}`);
        const data = await response.json();
        setResults(data.results || []);
        setActiveIndex(0);
      } catch (e) {
        console.error("Search error:", e);
        setResults([]);
      }
      setLoading(false);
    }, 300); // 300ms debounce for API calls

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, visible]);

  useEffect(() => {
    const handleContextMenu = (e) => {
      if (
        window.location.pathname.startsWith("/admin") ||
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA"
      ) {
        return;
      }

      e.preventDefault();
      const x = Math.min(e.clientX, window.innerWidth - 340);
      const y = Math.min(e.clientY, window.innerHeight - 360);

      setPosition({ x, y });
      setVisible(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        close();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close]);

  const handleKeyDown = (e) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (results[activeIndex]) {
          const item = results[activeIndex];
          window.location.href = `/${item.categorySlug}?res=${item.slug}`;
          close();
        } else if (query.trim()) {
          // Fallback: go to search page
          window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
          close();
        }
        break;
    }
  };

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className={styles.container}
      style={{ left: position.x, top: position.y }}
    >
      <div className={styles.searchBox}>
        <Search size={16} className={styles.searchIcon} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Quick search..."
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            setActiveIndex(0);
            // Dispatch a custom event for in-page filtering
            window.dispatchEvent(new CustomEvent("local-search", { detail: val }));
          }}
          onKeyDown={handleKeyDown}
          className={styles.input}
          id="context-search-input"
        />
        <kbd className={styles.kbd}>ESC</kbd>
      </div>

      {loading && (
        <div className={styles.empty}>
          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ marginLeft: "6px" }}>Searching...</span>
        </div>
      )}

      {!loading && results.length > 0 && (
        <ul className={styles.results}>
          {results.map((item, idx) => (
            <li
              key={item.id}
              className={`${styles.resultItem} ${idx === activeIndex ? styles.active : ""}`}
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => {
                window.location.href = `/${item.categorySlug}?res=${item.slug}`;
                close();
              }}
            >
              <span className={styles.resultIcon}>
                {getCategoryIcon(item.categoryIcon)}
              </span>
              <div className={styles.resultItemContent}>
                <div className={styles.resultName}>{item.name}</div>
                <div className={styles.resultMeta}>
                  {item.format && <span className={styles.resultFormat}>{item.format.toUpperCase()}</span>}
                  {item.folderName && (
                    <>
                      <span className={styles.dot}>•</span>
                      <span className={styles.folder}>{item.folderName.toUpperCase()}</span>
                    </>
                  )}
                  <span className={styles.dot}>•</span>
                  <span className={styles.action}>CLICK TO OPEN</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && query && results.length === 0 && (
        <div className={styles.empty}>No results found</div>
      )}

      <div className={styles.hint}>
        <span>↑↓ navigate</span>
        <span>↵ select</span>
        <span>esc close</span>
      </div>
    </div>
  );
}
