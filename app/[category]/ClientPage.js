"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Sidebar from "@/app/components/layout/Sidebar";
import ResourceCard from "@/app/components/ui/ResourceCard";
import SoundButton from "@/app/components/ui/SoundButton";
import FilterBar from "@/app/components/ui/FilterBar";
import PreviewOverlay from "@/app/components/ui/PreviewOverlay";
import { getResources, getResourceBySlug } from "@/app/lib/api";
import styles from "./page.module.css";

const PAGE_SIZE_DISPLAY = 24;
const PAGE_SIZE_BATCH = 200;

export default function ClientPage({ slug, info, folders, resources: initialResources }) {
  // --- States ---
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedFolderName, setSelectedFolderName] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE_DISPLAY);
  
  // Resources State
  const [allLoadedResources, setAllLoadedResources] = useState(initialResources);
  const [serverOffset, setServerOffset] = useState(initialResources.length);
  const [hasMoreDB, setHasMoreDB] = useState(initialResources.length === PAGE_SIZE_BATCH);
  const [isFetchLoading, setIsFetchLoading] = useState(false);
  
  const [previewResource, setPreviewResource] = useState(null);
  const [inPageSearch, setInPageSearch] = useState("");
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resSlug = searchParams.get("res");
  const loadMoreRef = useRef(null);

  // --- Effects ---

  // Handle deep-link to resource via ?res=slug
  useEffect(() => {
    if (resSlug) {
      const existing = allLoadedResources.find(r => r.slug === resSlug);
      if (existing) {
        // User requested to DISABLE auto-preview for ALL types
        // setPreviewResource(existing); 
      } else {
        // If not in current pool, fetch it specifically
        getResourceBySlug(resSlug).then(resource => {
          if (resource) {
            setAllLoadedResources(prev => [resource, ...prev]);
            // setPreviewResource(resource); // Disable auto-preview
          }
        });
      }
    }
  }, [resSlug, allLoadedResources]);

  // Listen for in-page search from ContextSearch
  useEffect(() => {
    const handleLocalSearch = (e) => {
      setInPageSearch(e.detail || "");
    };
    window.addEventListener("local-search", handleLocalSearch);
    return () => window.removeEventListener("local-search", handleLocalSearch);
  }, []);

  // Reset EVERYTHING when primary filters (Folder/Format/Search/Sort) change
  // Note: For now, we reset to the initial state to keep it simple. 
  // Truly large datasets with filtering would need server-side filtering logic.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE_DISPLAY);
  }, [selectedFolderId, selectedFormat, sortBy, inPageSearch]);

  // Synchronize internal state with server-provided initialResources when they change (navigation/refresh)
  useEffect(() => {
    setAllLoadedResources(initialResources);
    setServerOffset(initialResources.length);
    setHasMoreDB(initialResources.length === PAGE_SIZE_BATCH);
    setVisibleCount(PAGE_SIZE_DISPLAY);
  }, [initialResources]);

  // --- Core Filtering ---
  const filteredResources = useMemo(() => {
    let results = [...allLoadedResources];

    if (resSlug) {
      const target = results.find(r => r.slug === resSlug);
      if (target) return [target];
    }

    if (selectedFolderId) {
      results = results.filter((r) => r.folderId === selectedFolderId);
    }

    if (selectedFormat) {
      results = results.filter(
        (r) => r.fileFormat?.toUpperCase() === selectedFormat.toUpperCase()
      );
    }

    if (inPageSearch) {
      const q = inPageSearch.toLowerCase();
      results = results.filter(r => 
        r.name?.toLowerCase().includes(q) || 
        r.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    switch (sortBy) {
      case "popular":
        results.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
        break;
      case "name":
        results.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      default:
        break;
    }
    return results;
  }, [allLoadedResources, selectedFolderId, selectedFormat, sortBy, inPageSearch]);

  // --- Pagination Logic ---

  const handleLoadMore = useCallback(async () => {
    if (isFetchLoading) return;

    // SAFETY GUARD: If we have no more DB items AND we've shown all local items, stop.
    if (!hasMoreDB && visibleCount >= filteredResources.length) return;

    // 1. Check if we have more in our LOCAL pool of loaded resources
    if (visibleCount + PAGE_SIZE_DISPLAY <= filteredResources.length) {
      setVisibleCount(prev => prev + PAGE_SIZE_DISPLAY);
      return;
    }

    // 2. If we are near the end of the local pool AND the server might have more
    if (hasMoreDB) {
      setIsFetchLoading(true);
      try {
        const nextBatch = await getResources({ 
          categorySlug: slug, 
          offset: serverOffset, 
          limit: PAGE_SIZE_BATCH 
        });

        if (nextBatch.length > 0) {
          setAllLoadedResources(prev => [...prev, ...nextBatch]);
          setServerOffset(prev => prev + nextBatch.length);
          // If we got fewer than requested, we've hit the end
          if (nextBatch.length < PAGE_SIZE_BATCH) {
            setHasMoreDB(false);
          }
          // Increment visibility
          setVisibleCount(prev => prev + PAGE_SIZE_DISPLAY);
        } else {
          setHasMoreDB(false);
        }
      } catch (err) {
        console.error("Failed to fetch more resources:", err);
      } finally {
        setIsFetchLoading(false);
      }
    } else {
      // Just show remaining if any
      if (visibleCount < filteredResources.length) {
        setVisibleCount(filteredResources.length);
      }
    }
  }, [isFetchLoading, visibleCount, filteredResources.length, hasMoreDB, slug, serverOffset]);

  // --- Infinite Scroll Observer ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [handleLoadMore]);

  const handleSelectFolder = (folder) => {
    if (folder === null) {
      setSelectedFolderId(null);
      setSelectedFolderName(null);
    } else {
      setSelectedFolderId(folder.id);
      setSelectedFolderName(folder.path || folder.name);
    }
  };

  const renderResources = () => {
    if (filteredResources.length === 0 && !isFetchLoading) {
      return (
        <div className={styles.empty}>
          <p>
            No resources found{selectedFolderName ? ` in "${selectedFolderName}"` : ""}.
          </p>
        </div>
      );
    }

    const displayResources = filteredResources.slice(0, visibleCount);

    let gridContent;
    if (info.layout === "audio" || info.layout === "sound") {
      gridContent = (
        <div className={styles.soundGrid}>
          {displayResources.map((resource, idx) => (
            <SoundButton
              key={resource.id}
              {...resource}
              downloadUrl={resource.downloadUrl || resource.fileUrl}
              index={idx % PAGE_SIZE_DISPLAY}
              onPreview={() => setPreviewResource(resource)}
              primaryColor={info.color}
            />
          ))}
        </div>
      );
    } else if (info.layout === "font") {
      gridContent = (
        <div className={styles.grid}>
          {displayResources.map((resource, idx) => (
            <ResourceCard
              key={resource.id}
              {...resource}
              downloadUrl={resource.downloadUrl || resource.fileUrl}
              cardType="font"
              index={idx % PAGE_SIZE_DISPLAY}
              onPreview={() => setPreviewResource(resource)}
            />
          ))}
        </div>
      );
    } else {
      gridContent = (
        <div className={styles.grid}>
          {displayResources.map((resource, idx) => (
            <ResourceCard
              key={resource.id}
              {...resource}
              downloadUrl={resource.downloadUrl || resource.fileUrl}
              cardType={
                info.layout === "video" || info.layout === "image"
                  ? info.layout
                  : slug === "image-overlay"
                  ? "image"
                  : slug === "preset-lut"
                  ? "preview"
                  : "video"
              }
              index={idx % PAGE_SIZE_DISPLAY}
              onPreview={() => setPreviewResource(resource)}
              primaryColor={info.color}
            />
          ))}
        </div>
      );
    }

    return (
      <>
        {gridContent}
        
        {/* Sentinel element for Infinite Scroll */}
        <div ref={loadMoreRef} className={styles.observerSentinel}>
          {(isFetchLoading || (visibleCount < filteredResources.length) || hasMoreDB) && (
            <div className={styles.loadMoreWrapper}>
              <div className={styles.infiniteLoader}>
                <span className={styles.loaderIcon}></span>
                <span>Optimizing your creative flow...</span>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className={styles.page} style={{ "--cat-color": info.color }}>
      <Sidebar
        categoryName={info.name}
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={handleSelectFolder}
        primaryColor={info.color}
      />

      <div className={styles.main}>
        <div className={styles.breadcrumb}>
          <span className={styles.breadcrumbItem}>{info.name}</span>
          {selectedFolderName && (
            <>
              {selectedFolderName.split("/").map((part, idx) => (
                <span key={idx}>
                  <span className={styles.breadcrumbSep}>/</span>
                  <span className={styles.breadcrumbItem}>{part}</span>
                </span>
              ))}
            </>
          )}
        </div>

        <h1 className={styles.title} style={{ color: info.color }}>
          {info.name} ({filteredResources.length})
        </h1>

        <FilterBar
          formats={info.formats}
          selectedFormat={selectedFormat}
          onFormatChange={setSelectedFormat}
          sortBy={sortBy}
          onSortChange={setSortBy}
          resSlug={resSlug}
          onClearRes={() => router.push(pathname)}
        />

        {renderResources()}
      </div>

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
