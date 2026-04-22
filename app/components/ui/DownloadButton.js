"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Check, Loader2 } from "lucide-react";
import { incrementDownloadCount } from "@/app/lib/api";
import { useAuth } from "@/app/lib/auth-context";
import styles from "./DownloadButton.module.css";

export default function DownloadButton({ downloadUrl, fileUrl, fileName, fileFormat, resourceId, size, isPremiumResource }) {
  const [state, setState] = useState("idle"); // idle | downloading | done
  const { user, isPremium, isAdmin } = useAuth();
  const router = useRouter();

  // Resolve URL: prefer downloadUrl, fallback to fileUrl
  const resolvedUrl = downloadUrl || fileUrl;

  // Build proper filename with extension
  const getDownloadName = () => {
    const baseName = fileName?.replace(/\.[^/.]+$/, "") || "download";
    const ext = fileFormat ? `.${fileFormat.replace(/^\./, "").toLowerCase()}` : "";
    return `${baseName}${ext}`;
  };

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Premium Check - All resources now require Premium
    if (!isAdmin && !isPremium) {
      window.dispatchEvent(new CustomEvent("need-premium"));
      return;
    }

    if (state !== "idle") return;
    setState("downloading");

    try {
      // 1. Call our API to increment count and get a Secure Signed Download URL
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId: resourceId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.requiresPremium) {
          window.dispatchEvent(new CustomEvent("need-premium"));
          throw new Error("Premium required");
        }
        throw new Error(errorData.error || "Download failed");
      }

      const { downloadUrl: signedUrl } = await response.json();
      
      if (!signedUrl) throw new Error("No download URL returned");

      // 2. Trigger Native Browser Download
      // Using window.location.assign with a signed URL that has Content-Disposition: attachment
      // is the most reliable way to trigger a native download without memory issues.
      window.location.assign(signedUrl);

      setState("done");
      setTimeout(() => setState("idle"), 2000);
    } catch (err) {
      console.error("Download failed:", err);
      setState("idle");
    }
  };

  return (
    <button
      className={`${styles.btn} ${styles[state]} ${size === "compact" ? styles.compact : ""}`}
      onClick={handleClick}
      disabled={state === "downloading" || !resolvedUrl}
      aria-label={`Download ${fileName || "file"}`}
    >
      {state === "done" ? (
        <Check size={16} className={styles.checkIcon} />
      ) : state === "downloading" ? (
        <Loader2 size={16} className={styles.loaderIcon} />
      ) : (
        <Download size={16} className={styles.downloadIcon} />
      )}
      {size !== "compact" && (
        <span className={styles.text}>
          {state === "idle" && "Download"}
          {state === "downloading" && "..."}
          {state === "done" && "Done!"}
        </span>
      )}
    </button>
  );
}
