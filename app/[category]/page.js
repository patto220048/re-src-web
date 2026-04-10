"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { getCached, setCache } from "@/app/lib/cache";
import Sidebar from "@/app/components/layout/Sidebar";
import ResourceCard from "@/app/components/ui/ResourceCard";
import SoundButton from "@/app/components/ui/SoundButton";
import FilterBar from "@/app/components/ui/FilterBar";
import styles from "./page.module.css";

const CATEGORY_INFO = {
  "sound-effects": { name: "Sound Effects", color: "#00F0FF", formats: ["mp3", "wav", "ogg"], layout: "sound" },
  music: { name: "Music", color: "#A855F7", formats: ["mp3", "wav", "flac"], layout: "sound" },
  "video-meme": { name: "Video Meme", color: "#FBBF24", formats: ["mp4", "webm", "gif"], layout: "media" },
  "green-screen": { name: "Green Screen", color: "#22C55E", formats: ["mp4", "mov", "webm"], layout: "media" },
  animation: { name: "Animation", color: "#F43F5E", formats: ["mp4", "gif", "webm"], layout: "media" },
  "image-overlay": { name: "Image & Overlay", color: "#F97316", formats: ["png", "jpg", "webp"], layout: "media" },
  font: { name: "Font", color: "#E2E8F0", formats: ["ttf", "otf", "woff2"], layout: "font" },
  "preset-lut": { name: "Preset & LUT", color: "#6366F1", formats: ["cube", "xmp", "lut"], layout: "media" },
};

function buildFolderTree(flatList) {
  const map = {};
  const roots = [];

  flatList.forEach((f) => {
    map[f.id] = { ...f, children: [], path: f.name };
  });

  flatList.forEach((f) => {
    if (f.parentId && map[f.parentId]) {
      const parent = map[f.parentId];
      map[f.id].path = `${parent.path}/${f.name}`;
      parent.children.push(map[f.id]);
    } else {
      roots.push(map[f.id]);
    }
  });

  const sortChildren = (nodes) => {
    nodes.sort((a, b) => (a.order || 0) - (b.order || 0));
    nodes.forEach((n) => {
      if (n.children.length > 0) sortChildren(n.children);
    });
  };
  sortChildren(roots);
  return roots;
}

/* ---------- Loading Skeletons ---------- */
function SoundSkeleton({ count = 6 }) {
  return (
    <div className={styles.soundGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeleton}>
          <div className={styles.skeletonCircle} />
          <div className={styles.skeletonLines}>
            <div className={styles.skeletonLine} style={{ width: "60%" }} />
            <div className={styles.skeletonLine} style={{ width: "35%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CardSkeleton({ count = 8 }) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeletonCard}>
          <div className={styles.skeletonThumb} />
          <div className={styles.skeletonCardBody}>
            <div className={styles.skeletonLine} style={{ width: "75%" }} />
            <div className={styles.skeletonLine} style={{ width: "45%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.category;
  const info = CATEGORY_INFO[slug] || { name: slug, color: "#00F0FF", formats: [], layout: "media" };

  const [folders, setFolders] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedFolderName, setSelectedFolderName] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [sortBy, setSortBy] = useState("newest");

  // Fetch folders with cache
  useEffect(() => {
    async function loadFolders() {
      const cacheKey = `folders_${slug}`;
      const cached = getCached(cacheKey);
      if (cached) {
        setFolders(cached);
        return;
      }

      try {
        const ref = collection(db, "folders");
        const q = query(ref, where("categorySlug", "==", slug));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        const tree = buildFolderTree(data);
        setFolders(tree);
        setCache(cacheKey, tree);
      } catch (e) {
        console.error("Failed to load folders:", e.message);
      }
    }
    loadFolders();
  }, [slug]);

  // Fetch resources with cache
  useEffect(() => {
    async function loadResources() {
      const cacheKey = `resources_${slug}_${selectedFolderId || "all"}`;
      const cached = getCached(cacheKey);
      if (cached) {
        setResources(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const ref = collection(db, "resources");
        const constraints = [
          where("category", "==", slug),
          where("isPublished", "==", true),
        ];
        if (selectedFolderId) {
          constraints.push(where("folderId", "==", selectedFolderId));
        }
        const q = query(ref, ...constraints);
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setResources(data);
        setCache(cacheKey, data, 3 * 60 * 1000); // 3 min cache for resources
      } catch (e) {
        console.error("Failed to load resources:", e.message);
      }
      setLoading(false);
    }
    loadResources();
  }, [slug, selectedFolderId]);

  const filteredResources = useMemo(() => {
    let results = [...resources];
    if (selectedFormat) {
      results = results.filter((r) =>
        r.fileFormat?.toUpperCase() === selectedFormat.toUpperCase()
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
  }, [resources, selectedFormat, sortBy]);

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
          <p>No resources found{selectedFolderName ? ` in "${selectedFolderName}"` : ""}.</p>
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
            cardType={slug === "image-overlay" ? "image" : slug === "preset-lut" ? "preview" : "video"}
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

        {loading ? (
          info.layout === "sound" ? <SoundSkeleton /> : <CardSkeleton />
        ) : (
          renderResources()
        )}
      </div>
    </div>
  );
}
