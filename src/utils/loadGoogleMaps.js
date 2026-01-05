let loadingPromise = null;

export function loadGoogleMaps() {
  if (
    window.google &&
    window.google.maps &&
    window.google.maps.places &&
    window.google.maps.marker &&
    window.google.maps.Map
  ) {
    return Promise.resolve();
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_KEY}&libraries=places,marker&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = async () => {
      try {
        if (window.google?.maps?.importLibrary) {
          await Promise.all([
            window.google.maps.importLibrary("maps"),
            window.google.maps.importLibrary("places"),
            window.google.maps.importLibrary("marker"),
          ]);
        }
      } catch {
        // ignore and let caller handle missing constructors
      }
      resolve();
    };
    script.onerror = () => reject();

    document.head.appendChild(script);
  });

  return loadingPromise;
}
