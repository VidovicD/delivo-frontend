import {
  getNoviSadLocationBias,
  getNoviSadLocationRestriction,
  toLatin,
} from "./addressValidation";

function buildMapboxUrl(query) {
  const token = process.env.REACT_APP_MAPBOX_TOKEN || "";
  const { center } = getNoviSadLocationBias();
  const bounds = getNoviSadLocationRestriction();
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query
    )}.json`
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("limit", "10");
  url.searchParams.set("country", "rs");
  url.searchParams.set("language", "sr");
  url.searchParams.set(
    "bbox",
    `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`
  );
  url.searchParams.set("proximity", `${center.lng},${center.lat}`);
  return url.toString();
}

export async function fetchMapboxSuggestions(query) {
  const response = await fetch(buildMapboxUrl(query));
  if (!response.ok) return [];
  const data = await response.json();
  const features = Array.isArray(data.features) ? data.features : [];
  const needle = toLatin((query || "").split(",")[0].trim()).toLowerCase();

  const filtered = features
    .map((feature) => {
      const center = feature?.center;
      const placeTypes = feature?.place_type || [];
      const text = toLatin(feature?.text || "").toLowerCase();
      const fullText = toLatin(feature?.place_name || "").toLowerCase();
      if (needle && !text.includes(needle) && !fullText.includes(needle)) {
        return null;
      }
      if (
        (!placeTypes.includes("address") &&
          !placeTypes.includes("street")) ||
        text.includes("obilaznica") ||
        fullText.includes("obilaznica") ||
        text === "nova"
      ) {
        return null;
      }
      if (!center || center.length < 2) return null;
      const point = { lng: center[0], lat: center[1] };
      return {
        id: feature.id,
        display_name: feature.address
          ? `${feature.text} ${feature.address}`
          : feature.text,
        place_name: feature.place_name,
        center: point,
      };
    })
    .filter(Boolean);

  const seen = new Set();
  const unique = [];
  for (const item of filtered) {
    const key = (item.display_name || "").toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  return unique.slice(0, 3);
}

export async function reverseMapboxGeocode({ lng, lat }) {
  const token = process.env.REACT_APP_MAPBOX_TOKEN || "";
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("limit", "1");
  url.searchParams.set("types", "address");
  url.searchParams.set("language", "sr");

  const response = await fetch(url.toString());
  if (!response.ok) return "";
  const data = await response.json();
  const feature = Array.isArray(data.features) ? data.features[0] : null;
  return feature?.place_name || "";
}
