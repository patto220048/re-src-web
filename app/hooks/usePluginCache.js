"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/lib/auth-context";

// Global store to persist status between navigation within the same session
const pluginCacheStore = new Map();

// Initial load from localStorage with Versioning
if (typeof window !== 'undefined') {
  const CACHE_KEY = 'premiere_plugin_cache';
  const VER_KEY = 'premiere_plugin_cache_v';
  const CURRENT_VER = 'v4'; // Upgraded to v4 to force clean up all ghost "+" icons

  try {
    if (localStorage.getItem(VER_KEY) !== CURRENT_VER) {
      localStorage.removeItem(CACHE_KEY);
      localStorage.setItem(VER_KEY, CURRENT_VER);
    }
    
    // We don't pre-fill pluginCacheStore from localStorage anymore to enforce re-validation
    // But we keep the versioning logic to clear stale data
  } catch (e) {}
}

// Helper to update store and localStorage
const updateCacheStore = (id, status) => {
  if (!id) return;
  const sid = String(id);
  pluginCacheStore.set(sid, status);
  if (typeof window !== 'undefined') {
    try {
      const saved = JSON.parse(localStorage.getItem('premiere_plugin_cache') || '{}');
      if (status === 'cached') {
        saved[sid] = 'cached';
      } else {
        delete saved[sid];
      }
      localStorage.setItem('premiere_plugin_cache', JSON.stringify(saved));
    } catch (e) {}
  }
};

/**
 * Hook to manage resource cache status and communication with Premiere Pro Plugin Shell
 */
export function usePluginCache(resourceId, fileName, fileFormat) {
  const { isPlugin } = useAuth();
  
  // ALWAYS start as 'idle' to prevent "ghost" cached status before Shell responds
  const [downloadStatus, setDownloadStatus] = useState('idle'); 
  const [progress, setProgress] = useState(0);
  const [lastError, setLastError] = useState(null);

  const isInsidePlugin = isPlugin || (typeof window !== 'undefined' && window.location.search.includes('mode=plugin'));

  // Function to build proper filename (sync with Shell logic)
  const getDownloadName = useCallback(() => {
    const baseName = (fileName || "download").replace(/\.[^/.]+$/, "");
    const ext = fileFormat ? `.${fileFormat.replace(/^\./, "").toLowerCase()}` : "";
    return `${baseName}${ext}`;
  }, [fileName, fileFormat]);

  // Request status check from Shell
  const checkStatus = useCallback(() => {
    if (isInsidePlugin && resourceId) {
      window.parent.postMessage({
        type: 'CHECK_RESOURCE_STATUS',
        resourceId: resourceId,
        fileName: getDownloadName()
      }, '*');
    }
  }, [isInsidePlugin, resourceId, getDownloadName]);

  // Initial check on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (!isInsidePlugin) return;

    const handleMessage = (event) => {
      const { type, resourceId: msgResourceId, exists, progress: dlProgress, error } = event.data;
      
      if (String(msgResourceId) !== String(resourceId)) return;

      switch (type) {
        case 'RESOURCE_STATUS':
          const sid = String(resourceId);
          if (exists) {
            setDownloadStatus('cached');
            setProgress(100);
            updateCacheStore(sid, 'cached');
          } else {
            // If Premiere says it doesn't exist, REMOVE it from cache store
            setDownloadStatus('idle');
            setProgress(0);
            updateCacheStore(sid, 'idle');
          }
          break;

        case 'DOWNLOAD_PROGRESS':
          setDownloadStatus('downloading');
          setProgress(parseFloat(dlProgress));
          break;

        case 'DOWNLOAD_COMPLETE':
          setDownloadStatus('cached');
          setProgress(100);
          updateCacheStore(resourceId, 'cached');
          break;

        case 'CLEAR_PLUGIN_CACHE':
          console.log("Hook received CLEAR_PLUGIN_CACHE message");
          if (typeof window !== 'undefined') {
            localStorage.removeItem('premiere_plugin_cache');
            localStorage.removeItem('premiere_plugin_cache_v');
            window.location.reload();
          }
          break;

        case 'DOWNLOAD_ERROR':
          setDownloadStatus('idle');
          setLastError(error);
          break;
          
        case 'IMPORT_COMPLETE':
          // Optional: handle specific UI feedback after import
          break;
      }
    };

    window.parent.addEventListener('message', handleMessage);
    return () => window.parent.removeEventListener('message', handleMessage);
  }, [isInsidePlugin, resourceId, checkStatus]);

  const downloadResource = (url) => {
    if (isInsidePlugin) {
      window.parent.postMessage({
        type: 'DOWNLOAD_RESOURCE',
        url: url,
        fileName: getDownloadName(),
        resourceId: resourceId
      }, '*');
    }
  };

  const importAsset = () => {
    if (isInsidePlugin) {
      window.parent.postMessage({
        type: 'IMPORT_ASSET',
        fileName: getDownloadName(),
        resourceId: resourceId
      }, '*');
    }
  };

  return {
    downloadStatus,
    progress,
    lastError,
    downloadResource,
    importAsset,
    checkStatus
  };
}
