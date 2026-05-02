"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/app/components/layout/Navbar";
import Footer from "@/app/components/layout/Footer";
import ContextSearch from "@/app/components/ui/ContextSearch";
import { mediaManager } from "@/app/lib/mediaManager";

export default function LayoutShell({ children, initialCategories = [] }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  // Stop all media when route changes to prevent "ghost" audio playing on other pages
  useEffect(() => {
    mediaManager.stopAll();
  }, [pathname]);

  return (
    <>
      {!isAdmin && <Navbar initialCategories={initialCategories} />}
      <main 
        style={{ 
          position: 'relative',
          ...(!isAdmin ? { paddingTop: "var(--navbar-height)" } : {}) 
        }}
      >
        {children}
      </main>
      {!isAdmin && pathname !== "/about-us" && <Footer />}
      {!isAdmin && pathname !== "/about-us" && <ContextSearch />}
    </>
  );
}
