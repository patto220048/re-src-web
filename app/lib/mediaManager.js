/**
 * Global Media Manager — ensures only one audio/video plays at a time.
 * Also manages global volume settings across the site.
 */

let activeMedia = null;
let activeCallback = null;

// Initialize global volume from localStorage or default to 0.5
let globalVolume = 0.5;
let globalMuted = false;

if (typeof window !== 'undefined') {
  const savedVol = localStorage.getItem('editerlor_volume');
  if (savedVol !== null) globalVolume = parseFloat(savedVol);
  const savedMuted = localStorage.getItem('editerlor_muted');
  if (savedMuted !== null) globalMuted = savedMuted === 'true';
}

export const mediaManager = {
  /**
   * Register and play a media element. Stops any currently playing media first.
   * @param {HTMLAudioElement|HTMLVideoElement} element
   * @param {Function} onStopped - callback when this media is stopped by another
   */
  play(element, onStopped) {
    // 1. Stop currently active media
    if (activeMedia && activeMedia !== element) {
      try {
        activeMedia.pause();
        activeMedia.currentTime = 0;
      } catch (_) {
        // ignore if already disposed
      }
      if (activeCallback) activeCallback();
    }

    // 2. Set as active
    activeMedia = element;
    activeCallback = onStopped;

    // 3. Apply global volume settings
    this.applySettings(element);
  },

  /**
   * Apply current global volume/muted settings to an element
   * @param {HTMLAudioElement|HTMLVideoElement} element 
   */
  applySettings(element) {
    if (!element) return;
    element.volume = globalVolume;
    element.muted = globalMuted;
  },

  /**
   * Unregister a media element (e.g., on pause or unmount).
   * @param {HTMLAudioElement|HTMLVideoElement} element
   */
  stop(element) {
    if (activeMedia === element) {
      activeMedia = null;
      activeCallback = null;
    }
  },

  /**
   * Check if a specific element is the currently active media.
   * @param {HTMLAudioElement|HTMLVideoElement} element
   * @returns {boolean}
   */
  isActive(element) {
    return activeMedia === element;
  },

  /**
   * Global Volume Controls
   */
  getVolume() { return globalVolume; },
  setVolume(val) {
    globalVolume = Math.max(0, Math.min(1, val));
    if (typeof window !== 'undefined') {
      localStorage.setItem('editerlor_volume', globalVolume);
    }
    // Update active media instantly
    if (activeMedia) activeMedia.volume = globalVolume;
  },

  getMuted() { return globalMuted; },
  setMuted(val) {
    globalMuted = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('editerlor_muted', globalMuted);
    }
    // Update active media instantly
    if (activeMedia) activeMedia.muted = globalMuted;
  }
};

