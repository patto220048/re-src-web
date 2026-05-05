"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/lib/auth-context";

// Global store to persist status between navigation within the same session
const pluginCacheStore = new Map();

// Helper to update store and localStorage
const updateCacheStore = (id, status) => {
  if (!id) return;
  pluginCacheStore.set(id, status);
  if (typeof window !== 'undefined') {
    try {
      const saved = JSON.parse(localStorage.getItem('premiere_plugin_cache') || '{}');
      saved[id] = status;
      localStorage.setItem('premiere_plugin_cache', JSON.stringify(saved));
    } catch (e) {}
  }
};

// Initial load from localStorage
if (typeof window !== 'undefined') {
  try {
    const saved = JSON.parse(localStorage.getItem('premiere_plugin_cache') || '{}');
    Object.entries(saved).forEach(([id, status]) => pluginCacheStore.set(id, status));
  } catch (e) {}
}

/**
 * Hook to manage resource cache status and communication with Premiere Pro Plugin Shell
 */
export function usePluginCache(resourceId, fileName, fileFormat) {
  const { isPlugin } = useAuth();
  
  // Initialize from global store if available
  const initialStatus = pluginCacheStore.get(resourceId) || 'idle';
  const [downloadStatus, setDownloadStatus] = useState(initialStatus); 
  const [progress, setProgress] = useState(initialStatus === 'cached' ? 100 : 0);
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
          if (exists) {
            setDownloadStatus('cached');
            setProgress(100);
            updateCacheStore(resourceId, 'cached');
          } else {
            setDownloadStatus('idle');
            setProgress(0);
            updateCacheStore(resourceId, 'idle');
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

        case 'DOWNLOAD_ERROR':
          setDownloadStatus('idle');
          setLastError(error);
          break;
          
        case 'IMPORT_COMPLETE':
          // Optional: handle specific UI feedback after import
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isInsidePlugin, resourceId]);

  const requestImport = useCallback((signedUrl) => {
    if (!isInsidePlugin) return;
    
    window.parent.postMessage({
      type: 'IMPORT_ASSET',
      url: signedUrl,
      fileName: getDownloadName(),
      resourceId: resourceId
    }, '*');
  }, [isInsidePlugin, resourceId, getDownloadName]);

  return {
    downloadStatus,
    progress,
    isInsidePlugin,
    lastError,
    requestImport,
    checkStatus
  };
}
