/**
 * app.js – Init: kartan laddas när #map blir synlig (IntersectionObserver).
 */
let mapInitialized = false;
document.addEventListener("DOMContentLoaded", () => {
  const mapEl = document.getElementById("map");
  if (!mapEl) return;
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry && entry.isIntersecting && !mapInitialized && typeof L !== "undefined") {
        initMap();
        mapInitialized = true;
        observer.disconnect();
      }
    },
    { root: null, rootMargin: "0px", threshold: 0.1 }
  );
  observer.observe(mapEl);
});
