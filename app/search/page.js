"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Search as SearchIcon } from "lucide-react";
import { searchResourcesClient } from "@/app/lib/searchUtils";
import SearchBar from "@/app/components/ui/SearchBar";
import ResourceCard from "@/app/components/ui/ResourceCard";
import styles from "./page.module.css";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    async function doSearch() {
      if (!initialQuery.trim()) {
        setResults([]);
        setSearched(false);
        return;
      }
      setLoading(true);
      setSearched(true);
      try {
        const found = await searchResourcesClient(initialQuery.trim(), 200);
        setResults(found);
      } catch (e) {
        console.error("Search error:", e.message);
      }
      setLoading(false);
    }
    doSearch();
  }, [initialQuery]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <SearchIcon size={28} className={styles.titleIcon} />
          Search Resources
        </h1>
        <div className={styles.searchWrap}>
          <SearchBar size="large" placeholder="Search by name, tag, or description..." />
        </div>
      </div>

      {searched && (
        <p className={styles.resultInfo}>
          {loading
            ? "Searching..."
            : results.length > 0
            ? `Found ${results.length} results for "${initialQuery}"`
            : `No results found for "${initialQuery}"`}
        </p>
      )}

      {results.length > 0 ? (
        <div className={styles.grid}>
          {results.map((r, idx) => (
            <ResourceCard
              key={r.id}
              {...r}
              downloadUrl={r.downloadUrl || r.fileUrl}
              index={idx}
            />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🔍</div>
          <h3>{searched ? "No results" : "Start searching"}</h3>
          <p>Search for sound effects, music, memes, and more...</p>
          <p className={styles.tip}>
            💡 You can also <strong>right-click</strong> anywhere for quick search
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
