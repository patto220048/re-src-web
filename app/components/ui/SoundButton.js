"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Download, Eye } from "lucide-react";
import { useAuth } from "@/app/lib/auth-context";
import { incrementDownloadCount } from "@/app/lib/api";
import { mediaManager } from "@/app/lib/mediaManager";
import { isVideoFormat, isImageFormat, isFontFormat } from "@/app/lib/mediaUtils";
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
  fileName,
  downloadUrl,
  fileFormat,
  fileSize,
  downloadCount = 0,
  index = 0,
  onPreview,
  primaryColor = "#FFFFFF",
  isPremium,
  ...otherProps
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  
  const { user, isPremium: userIsPremium, isAdmin } = useAuth();
  const router = useRouter();

  const audioRef = useRef(null);
  const rafRef = useRef(null);
  const wasPlayingRef = useRef(false);

  const resourceObj = { id, name, fileName, fileFormat, downloadUrl, ...otherProps };
  const hasPreview = isVideoFormat(resourceObj) || isImageFormat(resourceObj) || isFontFormat(resourceObj);

  const handlePreview = (e) => {
    e.stopPropagation();
    if (onPreview) onPreview(resourceObj);
  };

  // Update time via requestAnimationFrame for smooth progress
  const updateTime = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused && !isScrubbing) {
      setCurrentTime(audio.currentTime);
      rafRef.current = requestAnimationFrame(updateTime);
    }
  }, [isScrubbing]);

  // Helper to initialize audio on demand
  const initAudio = useCallback(() => {
    if (!downloadUrl) return null;
    
    // If audio object already exists but URL is different, update its src
    if (audioRef.current) {
      if (audioRef.current.src !== downloadUrl) {
        audioRef.current.src = downloadUrl;
        audioRef.current.load();
      }
      // Ensure state is synced if duration is already available
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
      return audioRef.current;
    }
    
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
    return audio;
  }, [downloadUrl]);

  // Sync volume settings and handle global reset
  useEffect(() => {
    return mediaManager.subscribe(({ activeMediaId }) => {
      // If another item started playing, and we are not that item, but we have progress
      if (activeMediaId && activeMediaId !== id) {
        if (isPlaying || currentTime > 0) {
          setIsPlaying(false);
          setCurrentTime(0);
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          
          // Actually stop the audio if it was the one playing
          if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
        }
      }
    });
  }, [id, isPlaying, currentTime]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        mediaManager.stop(audio);
        audio.src = "";
        audioRef.current = null;
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleMouseEnter = useCallback(() => {
    const audio = initAudio();
    if (audio && audio.readyState < 2 && audio.paused) {
      audio.preload = "auto";
      audio.load();
    }
  }, [initAudio]);

  const togglePlay = useCallback(() => {
    const audio = initAudio();
    if (!audio || !downloadUrl) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      mediaManager.stop(audio);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    } else {
      if (audio.ended) audio.currentTime = 0;
      mediaManager.play(audio, 'audio', () => {
        setIsPlaying(false);
        setCurrentTime(0); // Sync state when another media overrides
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      }, id);
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
  }, [downloadUrl, isPlaying, updateTime, initAudio]);

  // Global seek logic using clientX for accuracy
  const seek = useCallback((clientX, target) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Use native duration as priority, fallback to state
    const audioDuration = (audio.duration && !isNaN(audio.duration) && audio.duration > 0) 
      ? audio.duration 
      : duration;

    // If we still don't have duration, we can't seek
    if (!audioDuration || isNaN(audioDuration) || audioDuration === 0) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, offsetX / rect.width));
    
    const newTime = ratio * audioDuration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration, id, isScrubbing]);

  const handleMouseDown = useCallback((e) => {
    e.stopPropagation();
    const audio = initAudio();
    if (!audio) return;

    // YouTube style: Pause while scrubbing, remember if it was playing
    const isCurrentlyPlaying = !audio.paused;
    wasPlayingRef.current = isCurrentlyPlaying;
    
    if (isCurrentlyPlaying) {
      audio.pause();
      setIsPlaying(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }

    setIsScrubbing(true);
    // Use a small timeout or immediate update to ensure state is processed if needed
    // but clientX is already available
    seek(e.clientX, e.currentTarget);
  }, [seek, initAudio]);

  // Handle global scrubbing events
  useEffect(() => {
    if (!isScrubbing) return;

    const handleMouseMove = (e) => {
      const wrapper = document.querySelector(`#sound-${id} .${styles.progressWrapper}`);
      if (wrapper) seek(e.clientX, wrapper);
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      
      const audio = audioRef.current;
      if (audio && wasPlayingRef.current) {
        mediaManager.play(audio, 'audio', () => {
          setIsPlaying(false);
          setCurrentTime(0);
        }, id);
        audio.play().then(() => {
          setIsPlaying(true);
          if (!rafRef.current) rafRef.current = requestAnimationFrame(updateTime);
        }).catch(() => {});
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isScrubbing, id, seek, updateTime]);

  const handleDownload = async (e) => {
    e.stopPropagation();

    // Premium check - All resources now require Premium
    if (!isAdmin && !userIsPremium) {
      window.dispatchEvent(new CustomEvent("need-premium"));
      return;
    }

    if (isDownloading || !downloadUrl) return;

    setIsDownloading(true);
    try {
      // 1. Try cross-origin download via blob (allows naming)
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error("Fetch failed");

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
      console.warn("Blob download failed (likely CORS). Falling back to direct link.", err);

      // 2. Fallback: Open in new tab (browser handles it, usually triggers download or play)
      try {
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        const ext = fileFormat ? `.${fileFormat.replace(/^\./, "").toLowerCase()}` : "";
        const baseName = name?.replace(/\.[^/.]+$/, "") || "download";
        link.download = `${baseName}${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (id) incrementDownloadCount(id).catch(() => {});
      } catch (fallbackErr) {
        console.error("Direct download fallback failed:", fallbackErr);
      }
    }
    setIsDownloading(false);
  };

  const displayName = (name || fileName || "Untitled").replace(/\.[^/.]+$/, "");
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
        style={{ '--cat-color': primaryColor }}
      >
        <span className={styles.ring} style={{ borderColor: (isPlaying || currentTime > 0) ? primaryColor : undefined }} />
        {isPlaying ? (
          <span className={styles.pauseIcon}>
            <span className={styles.pauseBar} style={{ backgroundColor: primaryColor }} />
            <span className={styles.pauseBar} style={{ backgroundColor: primaryColor }} />
          </span>
        ) : (
          <span 
            className={styles.playIcon} 
            style={{ borderLeftColor: (isPlaying || currentTime > 0) ? primaryColor : undefined }} 
          />
        )}
      </button>

      {/* Sound wave bars - Always rendered, CSS handles width/opacity animation */}
      <div className={styles.waveBars}>
        <span className={styles.bar} style={{ backgroundColor: primaryColor }} />
        <span className={styles.bar} style={{ backgroundColor: primaryColor }} />
        <span className={styles.bar} style={{ backgroundColor: primaryColor }} />
        <span className={styles.bar} style={{ backgroundColor: primaryColor }} />
      </div>

      {/* Info */}
      <div className={styles.info}>
        <span className={styles.name} title={name} style={{ color: isPlaying ? primaryColor : 'inherit' }}>{displayName}</span>
        <div className={styles.meta}>
          {fileFormat && <span className={styles.format}>{fileFormat}</span>}
          {sizeStr && <span className={styles.size}>{sizeStr}</span>}
          <span className={styles.dlCount}>
            <Download size={10} />
            {(downloadCount || 0).toLocaleString()}
          </span>
          {/* Time display container handles jumpy layout */}
          <span 
            className={`${styles.time} ${(isPlaying || currentTime > 0) ? styles.timeVisible : ""}`}
            style={{ color: isPlaying ? primaryColor : 'inherit' }}
          >
            {duration > 0 ? `${formatTime(currentTime)} / ${formatTime(duration)}` : ""}
          </span>
        </div>

        {/* Stable Progress bar structure */}
        <div 
          className={`${styles.progressWrapper} ${(isPlaying || currentTime > 0 || isScrubbing) ? styles.timeVisible : ""}`} 
          onMouseDown={handleMouseDown}
          style={{ 
            opacity: (isPlaying || currentTime > 0 || isScrubbing) ? 1 : 0, 
            visibility: (isPlaying || currentTime > 0 || isScrubbing) ? 'visible' : 'hidden',
            height: isScrubbing ? '6px' : undefined
          }}
        >
          <div className={styles.progressTrack}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${progress}%`, backgroundColor: primaryColor }} 
            />
          </div>
        </div>
      </div>

      {/* Preview Overlay Trigger */}
      {hasPreview && (
        <button
          className={styles.previewBtn}
          onClick={handlePreview}
          title="Xem trước"
          aria-label={`Xem trước ${displayName}`}
        >
          <Eye size={16} />
        </button>
      )}

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
