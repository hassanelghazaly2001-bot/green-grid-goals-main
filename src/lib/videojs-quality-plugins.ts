/**
 * Dynamically load Video.js HLS quality selector plugins.
 * If packages are missing or fail to load, the player still works without the quality menu.
 */
export function registerQualitySelectorPlugins(): Promise<boolean> {
  return import("videojs-contrib-quality-levels")
    .then(() => import("videojs-quality-selector-hls"))
    .then(() => true)
    .catch(() => false);
}
