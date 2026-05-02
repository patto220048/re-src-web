"use client";

import { useState, useMemo, useEffect, useRef, useCallback, useTransition, useDeferredValue } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useSidebar } from "@/app/context/SidebarContext";
import useSWR from "swr";
import { useDebounce } from "@/app/hooks/useDebounce";

import dynamic from "next/dynamic";
const PreviewOverlay = dynamic(() => import("@/app/components/ui/PreviewOverlay"));
import { getResources, getResourceBySlug, getCategoryTags } from "@/app/lib/api";

// Sub-components
import NavigationHeader from "./components/NavigationHeader";
import FilterSection from "./components/FilterSection";
import ResourceGrid from "./components/ResourceGrid";

import styles from "./page.module.css";

const PAGE_SIZE_DISPLAY = 24;
const PAGE_SIZE_BATCH = 200;

const findInTree = (nodes, targetId, parent = null) => {
  if (!nodes || !targetId) return null;
  for (const node of nodes) {
    if (node.id === targetId) return { current: node, parent };
    if (node.children?.length > 0) {
      const result = findInTree(node.children, targetId, node);
      if (result) return result;
    }
  }
  return null;
};

const getDescendantIds = (node) => {
  let ids = [node.id];
  if (node.children) {
    node.children.forEach(child => {
      ids = [...ids, ...getDescendantIds(child)];
    });
  }
  return ids;
};

export default function ClientPage({ slug, info, folders, resources: initialResources, categoryTags = [] }) {
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedFolderName, setSelectedFolderName] = useState(null);
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [allLoadedResources, setAllLoadedResources] = useState(initialResources || []);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE_DISPLAY);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetchLoading, setIsFetchLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreDB, setHasMoreDB] = useState(initialResources?.length === PAGE_SIZE_BATCH);
  const [serverOffset, setServerOffset] = useState(initialResources?.length || 0);
  const [previewResource, setPreviewResource] = useState(null);
  const [inPageSearch, setInPageSearch] = useState("");
  const deferredSearch = useDeferredValue(inPageSearch);
  const [folderTags, setFolderTags] = useState([]);

  const [historyStack, setHistoryStack] = useState([null]);
  const [historyPointer, setHistoryPointer] = useState(0);

  const loadMoreRef = useRef(null);
  const abortControllerRef = useRef(null);
  const lastRequestIdRef = useRef(0);
  const isFirstRun = useRef(true);
  const hasLoadedInitialStateRef = useRef(false);
  const historyStackRef = useRef([null]);
  const prevSlugRef = useRef(slug);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resSlug = searchParams.get("res");
  const { setFolderId } = useSidebar();

  const debouncedSearch = useDebounce(deferredSearch, 400);
  const debouncedTags = useDebounce(selectedTags, 300);
  const debouncedFormats = useDebounce(selectedFormats, 300);
  const debouncedFolderId = useDebounce(selectedFolderId, 100);
  const debouncedSortBy = useDebounce(sortBy, 100);

  const updateUrl = useCallback((updates) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.set(key, value.join(","));
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleSelectFolder = useCallback((folder, isHistoryMove = false) => {
    const id = folder?.id || null;
    const name = folder ? (folder.path || folder.name) : null;

    startTransition(() => {
      setSelectedFolderId(id);
      setSelectedFolderName(name);
      setVisibleCount(PAGE_SIZE_DISPLAY);
      setFolderId(id);
      updateUrl({ folder: id });

      if (!isHistoryMove) {
        const newStack = historyStackRef.current.slice(0, historyPointer + 1);
        newStack.push(id);
        setHistoryStack(newStack);
        setHistoryPointer(newStack.length - 1);
        historyStackRef.current = newStack;
      }
    });
  }, [historyPointer, setFolderId, updateUrl]);

  useEffect(() => {
    const initialFolderId = searchParams.get("folder") || null;
    const initialFormats = searchParams.get("format")?.split(",") || [];
    const initialTags = searchParams.get("tags")?.split(",") || [];
    const initialSort = searchParams.get("sort") || "newest";

    if (initialFolderId) {
      setSelectedFolderId(initialFolderId);
      const result = findInTree(folders, initialFolderId);
      setSelectedFolderName(result?.current ? (result.current.path || result.current.name) : null);
      setFolderId(initialFolderId);
    }

    if (!hasLoadedInitialStateRef.current || prevSlugRef.current !== slug) {
      const initialStack = initialFolderId ? [initialFolderId] : [null];
      setHistoryStack(initialStack);
      historyStackRef.current = initialStack;
      setHistoryPointer(0);
      hasLoadedInitialStateRef.current = true;
      prevSlugRef.current = slug;
    }
    
    if (initialFormats.length > 0) setSelectedFormats(initialFormats);
    if (initialTags.length > 0) setSelectedTags(initialTags);
    if (initialSort) setSortBy(initialSort);
    
    setIsInitialized(true);
  }, [slug, folders]);

  useEffect(() => {
    if (!isInitialized || isPending) return;
    
    const folderId = searchParams.get("folder") || null;
    if (folderId !== selectedFolderId) {
      setSelectedFolderId(folderId);
      const result = findInTree(folders, folderId);
      setSelectedFolderName(result?.current ? (result.current.path || result.current.name) : null);
      setVisibleCount(PAGE_SIZE_DISPLAY);
    }
    
    const formatsStr = searchParams.get("format") || "";
    if (formatsStr !== selectedFormats.join(",")) {
      setSelectedFormats(formatsStr ? formatsStr.split(",") : []);
    }
    
    const tagsStr = searchParams.get("tags") || "";
    if (tagsStr !== selectedTags.join(",")) {
      setSelectedTags(tagsStr ? tagsStr.split(",") : []);
    }
    
    const sort = searchParams.get("sort") || "newest";
    if (sort !== sortBy) setSortBy(sort);
  }, [searchParams, isInitialized, folders, selectedFolderId, selectedFormats, selectedTags, sortBy, isPending]);

  useEffect(() => {
    if (!isInitialized || !resSlug) return;
    const existing = allLoadedResources.find(r => r.slug === resSlug);
    if (!existing) {
      getResourceBySlug(resSlug).then(resource => {
        if (resource) setAllLoadedResources(prev => [resource, ...prev]);
      });
    }
  }, [resSlug, allLoadedResources, isInitialized]);

  useEffect(() => {
    const handleLocalSearch = (e) => setInPageSearch(e.detail || "");
    window.addEventListener("local-search", handleLocalSearch);
    return () => window.removeEventListener("local-search", handleLocalSearch);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    try {
      localStorage.setItem(`last_state_${slug}`, JSON.stringify({
        folderId: selectedFolderId,
        formats: selectedFormats,
        tags: selectedTags,
        sort: sortBy
      }));
    } catch (e) { console.warn("Save to localStorage failed:", e); }

    const requestId = ++lastRequestIdRef.current;
    if (abortControllerRef.current) abortControllerRef.current.abort();

    const refreshData = async () => {
      if (hasLoadedInitialStateRef.current && isFirstRun.current) {
        isFirstRun.current = false;
        const hasNoFilters = !debouncedSearch && debouncedTags.length === 0 && debouncedFormats.length === 0;
        if (initialResources?.length > 0 && hasNoFilters && debouncedFolderId === null) {
          if (requestId === lastRequestIdRef.current) {
            setAllLoadedResources(initialResources);
            setServerOffset(initialResources.length);
            setIsInitialLoading(false);
            setIsFetchLoading(false);
          }
          return;
        }
      }

      const isFreshLoad = debouncedSearch || debouncedFormats.length > 0 || debouncedTags.length > 0 || debouncedFolderId !== null;
      if (allLoadedResources.length === 0 || isFreshLoad) setIsInitialLoading(true);
      else setIsFetchLoading(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const isFiltering = debouncedSearch || debouncedFormats.length > 0 || debouncedTags.length > 0 || resSlug;
      let folderIdToPass = debouncedFolderId;
      if (isFiltering && debouncedFolderId) {
        const node = findInTree(folders, debouncedFolderId)?.current;
        if (node) folderIdToPass = getDescendantIds(node);
      }

      try {
        const fresh = await getResources({
          categorySlug: slug,
          selectedTags: debouncedTags,
          selectedFormats: debouncedFormats,
          folderId: folderIdToPass,
          searchTerm: debouncedSearch,
          offset: 0,
          limit: PAGE_SIZE_BATCH,
          abortSignal: controller.signal
        });

        if (!controller.signal.aborted) {
          setAllLoadedResources(fresh || []);
          setServerOffset(fresh?.length || 0);
          setHasMoreDB(fresh?.length === PAGE_SIZE_BATCH);
          setVisibleCount(PAGE_SIZE_DISPLAY);
        }
      } catch (e) { if (e.name !== 'AbortError') console.error("Refresh fetch failed:", e); }
      finally {
        if (requestId === lastRequestIdRef.current) {
          setIsInitialLoading(false);
          setIsFetchLoading(false);
        }
      }
    };

    refreshData();
    const timeoutId = setTimeout(() => {
      if (requestId === lastRequestIdRef.current) {
        setIsInitialLoading(false);
        setIsFetchLoading(false);
      }
    }, 8000);

    return () => clearTimeout(timeoutId);
  }, [isInitialized, debouncedFolderId, debouncedFormats, debouncedTags, debouncedSortBy, debouncedSearch, slug]);

  const tagKey = (debouncedFolderId && isInitialized) ? [`tags`, slug, debouncedFolderId] : null;
  useSWR(tagKey, async ([, category, folder]) => {
    const node = findInTree(folders, folder)?.current;
    if (node) {
      const allSubFolderIds = getDescendantIds(node);
      const tags = await getCategoryTags(category, allSubFolderIds);
      setFolderTags(tags);
      return tags;
    }
    return [];
  }, { revalidateOnFocus: false, dedupingInterval: 60000 });

  useEffect(() => { if (!selectedFolderId) setFolderTags([]); }, [selectedFolderId]);

  useEffect(() => {
    setAllLoadedResources(initialResources);
    setServerOffset(initialResources.length);
    setHasMoreDB(initialResources.length === PAGE_SIZE_BATCH);
    setVisibleCount(PAGE_SIZE_DISPLAY);
  }, [slug]);

  const filteredResources = useMemo(() => {
    // Nếu đang ở cấp gốc (không chọn folder) và KHÔNG có bộ lọc nào kích hoạt,
    // chúng ta sẽ ẩn danh sách Resource để chỉ hiện các Folder con.
    const isAtRoot = !selectedFolderId;
    const isFiltering = debouncedSearch || debouncedTags.length > 0 || debouncedFormats.length > 0 || resSlug;

    if (isAtRoot && !isFiltering) {
      return [];
    }

    let results = [...allLoadedResources];
    if (resSlug) {
      const target = results.find(r => r.slug === resSlug);
      if (target) return [target];
    }
    switch (sortBy) {
      case "popular": results.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0)); break;
      case "name": results.sort((a, b) => (a.name || "").localeCompare(b.name || "")); break;
    }
    return results;
  }, [allLoadedResources, sortBy, resSlug, selectedFolderId, debouncedSearch, debouncedTags, debouncedFormats]);

  const availableTags = useMemo(() => {
    const isFiltered = selectedTags.length > 0 || inPageSearch || selectedFormats.length > 0;
    const tagMap = {};
    allLoadedResources.forEach(r => {
      if (r.tags) r.tags.forEach(t => {
        const lowTag = t.toLowerCase();
        tagMap[lowTag] = (tagMap[lowTag] || 0) + 1;
      });
    });

    let baseTags = isFiltered 
      ? Array.from(new Set([...selectedTags.map(t => t.toLowerCase()), ...Object.keys(tagMap)]))
      : (selectedFolderId ? (folderTags.length > 0 ? folderTags : []) : categoryTags);

    return baseTags.map(tag => ({
      name: tag.toLowerCase(),
      count: tagMap[tag.toLowerCase()] || 0
    })).sort((a, b) => {
      const aSelected = selectedTags.includes(a.name);
      const bSelected = selectedTags.includes(b.name);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      if (a.count !== b.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
  }, [allLoadedResources, selectedFolderId, categoryTags, folderTags, inPageSearch, selectedTags, selectedFormats]);

  const { currentSubfolders, parentFolder } = useMemo(() => {
    if (!selectedFolderId) return { currentSubfolders: folders, parentFolder: null };
    const result = findInTree(folders, selectedFolderId);
    return { currentSubfolders: result?.current?.children || [], parentFolder: result?.parent };
  }, [folders, selectedFolderId]);

  const currentFolder = useMemo(() => 
    selectedFolderId ? findInTree(folders, selectedFolderId)?.current : null,
    [folders, selectedFolderId]
  );

  const breadcrumbs = useMemo(() => {
    const crumbs = [];
    let curr = findInTree(folders, selectedFolderId);
    while (curr) {
      crumbs.unshift({ id: curr.current.id, name: curr.current.name });
      curr = curr.parent ? findInTree(folders, curr.parent.id) : null;
    }
    return crumbs;
  }, [folders, selectedFolderId]);

  const goBack = () => {
    if (historyPointer > 0) {
      const prevId = historyStack[historyPointer - 1];
      const folder = findInTree(folders, prevId);
      setHistoryPointer(prev => prev - 1);
      handleSelectFolder(folder?.current || null, true);
    }
  };

  const goForward = () => {
    if (historyPointer < historyStack.length - 1) {
      const nextId = historyStack[historyPointer + 1];
      const folder = findInTree(folders, nextId);
      setHistoryPointer(prev => prev + 1);
      handleSelectFolder(folder?.current || null, true);
    }
  };

  const resetToRoot = () => handleSelectFolder(null);

  const handleLoadMore = useCallback(() => {
    if (isInitialLoading || isFetchLoading || isLoadingMore || !hasMoreDB) return;

    setIsLoadingMore(true);
    const isFiltering = debouncedSearch || debouncedFormats.length > 0 || debouncedTags.length > 0;
    let folderIdToPass = debouncedFolderId;
    if (isFiltering && debouncedFolderId) {
      const node = findInTree(folders, debouncedFolderId)?.current;
      if (node) folderIdToPass = getDescendantIds(node);
    }
    
    getResources({
      categorySlug: slug,
      selectedTags: debouncedTags,
      selectedFormats: debouncedFormats,
      folderId: folderIdToPass,
      searchTerm: debouncedSearch,
      offset: serverOffset,
      limit: PAGE_SIZE_BATCH,
    }).then(more => {
      if (more?.length > 0) {
        setAllLoadedResources(prev => [...prev, ...more]);
        setServerOffset(prev => prev + more.length);
        setHasMoreDB(more.length === PAGE_SIZE_BATCH);
      } else setHasMoreDB(false);
    }).finally(() => setIsLoadingMore(false));
  }, [isInitialLoading, isFetchLoading, isLoadingMore, hasMoreDB, serverOffset, debouncedSearch, debouncedFormats, debouncedTags, debouncedFolderId, slug, folders]);

  return (
    <>
      <div className={styles.main}>
        <NavigationHeader 
          selectedFolderId={selectedFolderId}
          resetToRoot={resetToRoot}
          goBack={goBack}
          goForward={goForward}
          historyPointer={historyPointer}
          historyStack={historyStack}
          currentFolder={currentFolder}
          info={info}
        />

        <FilterSection
          info={info}
          selectedFormats={selectedFormats}
          setSelectedFormats={setSelectedFormats}
          availableTags={availableTags}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          sortBy={sortBy}
          setSortBy={setSortBy}
          inPageSearch={inPageSearch}
          setInPageSearch={setInPageSearch}
          resSlug={resSlug}
          breadcrumbs={breadcrumbs}
          handleSelectFolder={handleSelectFolder}
          updateUrl={updateUrl}
          router={router}
          pathname={pathname}
          folders={folders}
          findInTree={findInTree}
        />

        <ResourceGrid 
          filteredResources={filteredResources}
          currentSubfolders={currentSubfolders}
          isInitialLoading={isInitialLoading}
          isFetchLoading={isFetchLoading}
          isPending={isPending}
          isLoadingMore={isLoadingMore}
          hasMoreDB={hasMoreDB}
          info={info}
          slug={slug}
          handleSelectFolder={handleSelectFolder}
          setPreviewResource={setPreviewResource}
          router={router}
          inPageSearch={deferredSearch}
          selectedFormats={selectedFormats}
          selectedTags={selectedTags}
          resSlug={resSlug}
          onLoadMore={handleLoadMore}
        />
      </div>

      {previewResource && (
        <PreviewOverlay 
          resource={previewResource} 
          onClose={() => setPreviewResource(null)} 
          showDownload={true} 
        />
      )}
    </>
  );
}
