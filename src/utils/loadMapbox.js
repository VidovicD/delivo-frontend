let loadPromise;

export function loadMapbox() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("No window"));
  }

  if (window.mapboxgl) {
    if (process.env.REACT_APP_MAPBOX_TOKEN) {
      window.mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;
    }
    return Promise.resolve(window.mapboxgl);
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      "script[data-mapbox-gl]"
    );
    const existingCss = document.querySelector(
      "link[data-mapbox-gl]"
    );

    if (!existingCss) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css";
      link.setAttribute("data-mapbox-gl", "true");
      document.head.appendChild(link);
    }

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.mapboxgl) {
          if (process.env.REACT_APP_MAPBOX_TOKEN) {
            window.mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;
          }
          resolve(window.mapboxgl);
        } else {
          reject(new Error("Mapbox failed to load"));
        }
      });
      existingScript.addEventListener("error", () => {
        reject(new Error("Mapbox failed to load"));
      });
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js";
    script.async = true;
    script.defer = true;
    script.setAttribute("data-mapbox-gl", "true");
    script.onload = () => {
      if (window.mapboxgl) {
        if (process.env.REACT_APP_MAPBOX_TOKEN) {
          window.mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;
        }
        resolve(window.mapboxgl);
      } else {
        reject(new Error("Mapbox failed to load"));
      }
    };
    script.onerror = () => reject(new Error("Mapbox failed to load"));
    document.head.appendChild(script);
  });

  return loadPromise;
}
