"use client";

import { createContext, useContext, useState, useCallback } from "react";

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  const [selectedFolderId, setSelectedFolderId] = useState(null);

  const setFolderId = useCallback((id) => {
    setSelectedFolderId(id);
  }, []);

  return (
    <SidebarContext.Provider value={{ selectedFolderId, setFolderId }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
