let loadingPromise = null;

export function loadGoogleMaps() {
  if (window.google?.maps?.places) {
    return Promise.resolve();
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps failed to load"));

    document.head.appendChild(script);
  });

  return loadingPromise;
}
