"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/app/components/layout/Sidebar";
import ResourceCard from "@/app/components/ui/ResourceCard";
import SoundButton from "@/app/components/ui/SoundButton";
import FilterBar from "@/app/components/ui/FilterBar";
import PreviewOverlay from "@/app/components/ui/PreviewOverlay";
import styles from "./page.module.css";

const PAGE_SIZE = 24;

export default function ClientPage({ slug, info, folders, resources }) {
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedFolderName, setSelectedFolderName] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [previewResource, setPreviewResource] = useState(null);
  const [inPageSearch, setInPageSearch] = useState("");
  const searchParams = useSearchParams();
  const resSlug = searchParams.get("res");

  // Handle deep-link to resource via ?res=slug
  useEffect(() => {
    if (resSlug && resources.length > 0) {
      const resource = resources.find(r => r.slug === resSlug);
      if (resource) {
        setPreviewResource(resource);
      }
    }
  }, [resSlug, resources]);

  // Listen for in-page search from ContextSearch
  useEffect(() => {
    const handleLocalSearch = (e) => {
      setInPageSearch(e.detail || "");
    };
    window.addEventListener("local-search", handleLocalSearch);
    return () => window.removeEventListener("local-search", handleLocalSearch);
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedFolderId, selectedFormat, sortBy, inPageSearch]);

  const filteredResources = useMemo(() => {
    let results = [...resources];

    // Filter by folder
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
  }, [resources, selectedFolderId, selectedFormat, sortBy, inPageSearch]);

  const handleSelectFolder = (folder) => {
    if (folder === null) {
      setSelectedFolderId(null);
      setSelectedFolderName(null);
    } else {
      setSelectedFolderId(folder.id);
      setSelectedFolderName(folder.path || folder.name);
    }
  };

  const handleLoadMore = () => {
    setIsMoreLoading(true);
    // Simulate a short render/loading delay for better UX feel
    setTimeout(() => {
      setVisibleCount((prev) => prev + PAGE_SIZE);
      setIsMoreLoading(false);
    }, 600);
  };

  const renderResources = () => {
    if (filteredResources.length === 0) {
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
              {...resource} // Pass everything for mediaUtils
              downloadUrl={resource.downloadUrl || resource.fileUrl}
              index={idx % PAGE_SIZE}
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
              index={idx % PAGE_SIZE}
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
              index={idx % PAGE_SIZE}
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
        {visibleCount < filteredResources.length && (
          <div className={styles.loadMoreWrapper}>
            <button
              onClick={handleLoadMore}
              className={`${styles.loadMoreBtn} ${
                isMoreLoading ? styles.loadingBtn : ""
              }`}
              disabled={isMoreLoading}
            >
              {isMoreLoading ? "Loading Assets..." : `Load More (${filteredResources.length - visibleCount} items left)`}
            </button>
          </div>
        )}
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
          {info.name} ({resources.length})
        </h1>

        <FilterBar
          formats={info.formats}
          selectedFormat={selectedFormat}
          onFormatChange={setSelectedFormat}
          sortBy={sortBy}
          onSortChange={setSortBy}
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
