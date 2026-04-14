"use client";

import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Video, Music, Sliders } from "lucide-react";
import { mediaManager } from "@/app/lib/mediaManager";
import styles from "./GlobalAudioSettings.module.css";

export default function GlobalAudioSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    video: { volume: mediaManager.getVolume('video'), muted: mediaManager.getMuted('video') },
    audio: { volume: mediaManager.getVolume('audio'), muted: mediaManager.getMuted('audio') }
  });
  const popoverRef = useRef(null);

  useEffect(() => {
    const unsubscribe = mediaManager.subscribe((newSettings) => {
      setSettings(newSettings);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleToggleMute = (type) => {
    mediaManager.setMuted(!settings[type].muted, type);
  };

  const handleVolumeChange = (type, val) => {
    mediaManager.setVolume(val, type);
    if (val > 0 && settings[type].muted) {
      mediaManager.setMuted(false, type);
    }
  };

  return (
    <div className={styles.container} ref={popoverRef}>
      <button 
        className={`${styles.trigger} ${isOpen ? styles.active : ""}`} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Audio Settings"
      >
        <Sliders size={20} />
      </button>

      {isOpen && (
        <div className={styles.popover}>
          <div className={styles.header}>
            <h3>Setting Audio</h3>
          </div>

          <div className={styles.sections}>
            {/* Video Channel */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <Video size={14} />
                  <span>Video</span>
                </div>
                <button 
                  className={styles.muteBtn}
                  onClick={() => handleToggleMute('video')}
                >
                  {settings.video.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
              </div>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.video.muted ? 0 : settings.video.volume}
                onChange={(e) => handleVolumeChange('video', parseFloat(e.target.value))}
                className={styles.slider}
              />
            </div>

            {/* Audio Channel */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <Music size={14} />
                  <span>Audio</span>
                </div>
                <button 
                  className={styles.muteBtn}
                  onClick={() => handleToggleMute('audio')}
                >
                  {settings.audio.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
              </div>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.audio.muted ? 0 : settings.audio.volume}
                onChange={(e) => handleVolumeChange('audio', parseFloat(e.target.value))}
                className={styles.slider}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
