"use client";

import { useState } from "react";
import { Download, Check } from "lucide-react";
import { incrementDownloadCount } from "@/app/lib/firestore";
import styles from "./DownloadButton.module.css";

export default function DownloadButton({ downloadUrl, fileUrl, fileName, fileFormat, resourceId }) {
  const [state, setState] = useState("idle"); // idle | downloading | done

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

    if (state !== "idle" || !resolvedUrl) return;
    setState("downloading");

    try {
      // Cross-origin safe download via blob
      const response = await fetch(resolvedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getDownloadName();
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Increment download count client-side (Option A)
      if (resourceId) {
        incrementDownloadCount(resourceId).catch(() => {});
      }

      setState("done");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("idle");
    }
  };

  return (
    <button
      className={`${styles.btn} ${styles[state]}`}
      onClick={handleClick}
      disabled={state === "downloading" || !resolvedUrl}
      aria-label={`Download ${fileName || "file"}`}
    >
      {state === "done" ? (
        <Check size={16} className={styles.checkIcon} />
      ) : (
        <Download size={16} className={styles.downloadIcon} />
      )}
      <span className={styles.text}>
        {state === "idle" && "Download"}
        {state === "downloading" && "..."}
        {state === "done" && "Done!"}
      </span>
    </button>
  );
}
