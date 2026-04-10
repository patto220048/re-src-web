"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, FileAudio, Film, Image, Type, SlidersHorizontal, Loader2 } from "lucide-react";
import { searchResources } from "@/app/lib/firestore";
import styles from "./ContextSearch.module.css";

function getCategoryIcon(cat) {
  const size = 14;
  switch (cat) {
    case "sound-effects": case "music": return <FileAudio size={size} />;
    case "video-meme": case "green-screen": case "animation": return <Film size={size} />;
    case "image-overlay": return <Image size={size} />;
    case "font": return <Type size={size} />;
    case "preset-lut": return <SlidersHorizontal size={size} />;
    default: return <FileAudio size={size} />;
  }
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
        const data = await searchResources(query.trim());
        setResults(data.slice(0, 8)); // Limit to 8 results for quick search
        setActiveIndex(0);
      } catch (e) {
        console.error("Search error:", e);
        setResults([]);
      }
      setLoading(false);
    }, 250); // 250ms debounce

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
          window.location.href = `/${results[activeIndex].category}`;
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
            setQuery(e.target.value);
            setActiveIndex(0);
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
                window.location.href = `/${item.category}`;
                close();
              }}
            >
              <span className={styles.resultIcon}>
                {getCategoryIcon(item.category)}
              </span>
              <span className={styles.resultName}>{item.name}</span>
              <span className={styles.resultFormat}>{item.fileFormat || item.format}</span>
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
