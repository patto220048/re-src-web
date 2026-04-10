/**
 * Global Media Manager — ensures only one audio/video plays at a time.
 * When a new media starts, all others automatically stop.
 */

let activeMedia = null;
let activeCallback = null;

export const mediaManager = {
  /**
   * Register and play a media element. Stops any currently playing media first.
   * @param {HTMLAudioElement|HTMLVideoElement} element
   * @param {Function} onStopped - callback when this media is stopped by another
   */
  play(element, onStopped) {
    // Stop currently active media
    if (activeMedia && activeMedia !== element) {
      try {
        activeMedia.pause();
        activeMedia.currentTime = 0;
      } catch (_) {
        // ignore if already disposed
      }
      if (activeCallback) activeCallback();
    }

    activeMedia = element;
    activeCallback = onStopped;
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
};
