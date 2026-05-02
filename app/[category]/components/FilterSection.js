"use client";

import { memo, useTransition } from "react";
import FilterBar from "@/app/components/ui/FilterBar";

const FilterSection = memo(function FilterSection({
  info,
  selectedFormats,
  setSelectedFormats,
  availableTags,
  selectedTags,
  setSelectedTags,
  sortBy,
  setSortBy,
  inPageSearch,
  setInPageSearch,
  resSlug,
  breadcrumbs,
  handleSelectFolder,
  updateUrl,
  router,
  pathname,
  folders,
  findInTree,
  isLoading
}) {
  const [isPending, startTransition] = useTransition();

  const handleFormatsChange = (vals) => {
    startTransition(() => {
      setSelectedFormats(vals);
      updateUrl({ format: vals });
    });
  };

  const handleTagsChange = (vals) => {
    startTransition(() => {
      setSelectedTags(vals);
      updateUrl({ tags: vals });
    });
  };

  const handleSortChange = (val) => {
    startTransition(() => {
      setSortBy(val);
      updateUrl({ sort: val });
    });
  };

  const handleBreadcrumbClick = (id) => {
    if (!id) handleSelectFolder(null);
    else {
      const folder = findInTree(folders, id);
      if (folder?.current) handleSelectFolder(folder.current);
    }
  };

  return (
    <FilterBar
      formats={info.formats}
      selectedFormats={selectedFormats}
      onFormatsChange={handleFormatsChange}
      tags={availableTags}
      selectedTags={selectedTags}
      onTagsChange={handleTagsChange}
      sortBy={sortBy}
      onSortChange={handleSortChange}
      inPageSearch={inPageSearch}
      onSearchChange={setInPageSearch}
      resSlug={resSlug}
      onClearRes={() => router.push(pathname)}
      primaryColor={info.color}
      breadcrumbs={breadcrumbs}
      categoryName={info.name}
      onBreadcrumbClick={handleBreadcrumbClick}
      isLoading={isLoading}
    />
  );
});

export default FilterSection;
