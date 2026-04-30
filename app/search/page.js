"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Search as SearchIcon } from "lucide-react";
import SearchBar from "@/app/components/ui/SearchBar";
import ResourceCard from "@/app/components/ui/ResourceCard";
import PreviewOverlay from "@/app/components/ui/PreviewOverlay";
import styles from "./page.module.css";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [previewResource, setPreviewResource] = useState(null);

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
        const response = await fetch(`/api/search?q=${encodeURIComponent(initialQuery.trim())}`);
        const data = await response.json();
        setResults(data.results || []);
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
          {results.map((r, idx) => {
            const categorySlug = r.categorySlug || r.category?.slug;
            const deepUrl = categorySlug 
              ? `/${categorySlug}?res=${r.slug}&folder=${r.folderId}` 
              : null;
              
            return (
              <ResourceCard
                key={r.id}
                {...r}
                detailUrl={deepUrl}
                downloadUrl={r.downloadUrl || r.fileUrl}
                index={idx}
                onPreview={() => setPreviewResource(r)}
              />
            );
          })}
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

      {previewResource && (
        <PreviewOverlay 
          resource={previewResource} 
          onClose={() => setPreviewResource(null)} 
          showDownload={true} 
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
