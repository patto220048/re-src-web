"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Download } from "lucide-react";
import { incrementDownloadCount } from "@/app/lib/firestore";
import { mediaManager } from "@/app/lib/mediaManager";
import styles from "./SoundButton.module.css";

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatTime(seconds) {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SoundButton({
  id,
  name,
  downloadUrl,
  fileFormat,
  fileSize,
  downloadCount = 0,
  index = 0,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const rafRef = useRef(null);

  // Update time via requestAnimationFrame for smooth progress
  const updateTime = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      setCurrentTime(audio.currentTime);
      rafRef.current = requestAnimationFrame(updateTime);
    }
  }, []);

  useEffect(() => {
    if (!downloadUrl) return;
    const audio = new Audio();
    audio.preload = "metadata";
    audio.src = downloadUrl;

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });
    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setCurrentTime(0);
      mediaManager.stop(audio);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    });
    audio.addEventListener("error", () => {
      setIsPlaying(false);
      mediaManager.stop(audio);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    });
    audioRef.current = audio;

    return () => {
      audio.pause();
      mediaManager.stop(audio);
      audio.src = "";
      audioRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [downloadUrl]);

  const handleMouseEnter = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.readyState < 2 && audio.paused) {
      audio.preload = "auto";
      audio.load();
    }
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !downloadUrl) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      mediaManager.stop(audio);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    } else {
      if (audio.ended) audio.currentTime = 0;
      mediaManager.play(audio, () => {
        setIsPlaying(false);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      });
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
          rafRef.current = requestAnimationFrame(updateTime);
        }).catch((err) => {
          if (err.name === "AbortError") return;
          console.error("Playback error:", err);
          setIsPlaying(false);
          mediaManager.stop(audio);
        });
      }
    }
  }, [downloadUrl, isPlaying, updateTime]);

  // Seek via progress bar click
  const handleProgressClick = useCallback((e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  }, [duration]);

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (isDownloading || !downloadUrl) return;

    setIsDownloading(true);
    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const ext = fileFormat ? `.${fileFormat.replace(/^\./, "").toLowerCase()}` : "";
      const baseName = name?.replace(/\.[^/.]+$/, "") || "download";
      link.download = `${baseName}${ext}`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      if (id) incrementDownloadCount(id).catch(() => {});
    } catch (err) {
      console.error("Download failed:", err);
    }
    setIsDownloading(false);
  };

  const displayName = name?.replace(/\.[^/.]+$/, "") || "Untitled";
  const sizeStr = formatSize(fileSize);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`${styles.item} ${isPlaying ? styles.playing : ""}`}
      style={{ "--stagger-index": index }}
      id={`sound-${id}`}
      onMouseEnter={handleMouseEnter}
    >
      {/* Play button */}
      <button
        className={styles.playBtn}
        onClick={togglePlay}
        aria-label={isPlaying ? `Pause ${displayName}` : `Play ${displayName}`}
        disabled={!downloadUrl}
      >
        <span className={styles.ring} />
        {isPlaying ? (
          <span className={styles.pauseIcon}>
            <span className={styles.pauseBar} />
            <span className={styles.pauseBar} />
          </span>
        ) : (
          <span className={styles.playIcon} />
        )}
      </button>

      {/* Sound wave bars */}
      {isPlaying && (
        <div className={styles.waveBars}>
          <span className={styles.bar} />
          <span className={styles.bar} />
          <span className={styles.bar} />
          <span className={styles.bar} />
        </div>
      )}

      {/* Info */}
      <div className={styles.info}>
        <span className={styles.name} title={name}>{displayName}</span>
        <span className={styles.meta}>
          {fileFormat && <span className={styles.format}>{fileFormat}</span>}
          {sizeStr && <span className={styles.size}>{sizeStr}</span>}
          <span className={styles.dlCount}>
            <Download size={10} />
            {(downloadCount || 0).toLocaleString()}
          </span>
          {/* Time display — only on active item */}
          {(isPlaying || currentTime > 0) && duration > 0 && (
            <span className={styles.time}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          )}
        </span>

        {/* Progress bar — only on active item */}
        {(isPlaying || currentTime > 0) && duration > 0 && (
          <div className={styles.progressTrack} onClick={handleProgressClick}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {/* Download */}
      <button
        className={styles.downloadBtn}
        onClick={handleDownload}
        disabled={isDownloading || !downloadUrl}
        aria-label={`Download ${displayName}`}
      >
        <Download size={14} />
      </button>
    </div>
  );
}
