"use client";

import { useState, useMemo } from "react";
import Sidebar from "@/app/components/layout/Sidebar";
import ResourceCard from "@/app/components/ui/ResourceCard";
import SoundButton from "@/app/components/ui/SoundButton";
import FilterBar from "@/app/components/ui/FilterBar";
import styles from "./page.module.css";

export default function ClientPage({ slug, info, folders, resources }) {
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedFolderName, setSelectedFolderName] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [sortBy, setSortBy] = useState("newest");

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
  }, [resources, selectedFolderId, selectedFormat, sortBy]);

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
    if (filteredResources.length === 0) {
      return (
        <div className={styles.empty}>
          <p>
            No resources found{selectedFolderName ? ` in "${selectedFolderName}"` : ""}.
          </p>
        </div>
      );
    }

    if (info.layout === "sound") {
      return (
        <div className={styles.soundGrid}>
          {filteredResources.map((resource, idx) => (
            <SoundButton
              key={resource.id}
              id={resource.id}
              name={resource.name}
              downloadUrl={resource.downloadUrl || resource.fileUrl}
              fileFormat={resource.fileFormat}
              fileSize={resource.fileSize}
              downloadCount={resource.downloadCount}
              index={idx}
            />
          ))}
        </div>
      );
    }

    if (info.layout === "font") {
      return (
        <div className={styles.grid}>
          {filteredResources.map((resource, idx) => (
            <ResourceCard
              key={resource.id}
              {...resource}
              downloadUrl={resource.downloadUrl || resource.fileUrl}
              cardType="font"
              index={idx}
            />
          ))}
        </div>
      );
    }

    return (
      <div className={styles.grid}>
        {filteredResources.map((resource, idx) => (
          <ResourceCard
            key={resource.id}
            {...resource}
            downloadUrl={resource.downloadUrl || resource.fileUrl}
            cardType={
              slug === "image-overlay"
                ? "image"
                : slug === "preset-lut"
                ? "preview"
                : "video"
            }
            index={idx}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <Sidebar
        categoryName={info.name}
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={handleSelectFolder}
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
          {info.name}
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
    </div>
  );
}
