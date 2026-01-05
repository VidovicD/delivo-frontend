export const NOVI_SAD = {
  name: "Novi Sad",
  center: { lat: 45.2671, lng: 19.8335 },
  radiusMeters: 20000,
  bounds: {
    north: 45.45,
    south: 45.08,
    east: 20.1,
    west: 19.55,
  },
};

export const NOVI_SAD_ALIASES = [
  "Novi Sad",
  "Petrovaradin",
  "Sremska Kamenica",
  "Veternik",
  "Futog",
  "Bukovac",
  "Kac",
  "Rumenka",
  "Ledinci",
  "Stepanovicevo",
  "Kovil",
  "Cenej",
];

export const DELIVERY_ZONE = [
  [19.752614211781946, 45.261880942558406],
  [19.75853444622166, 45.228183438408195],
  [19.762106140928665, 45.202067845904594],
  [19.840407989232602, 45.20652940998488],
  [19.87295331286822, 45.22364745642241],
  [19.89660413701509, 45.23713241059306],
  [19.903814465276838, 45.254724339244575],
  [19.866949142466666, 45.2672457695615],
  [19.897024269207094, 45.260986231293856],
  [19.895109359283737, 45.2948073282644],
  [19.86335295953259, 45.31134046360617],
  [19.816343756114776, 45.31148323245395],
  [19.8027939035764, 45.30880314795988],
  [19.792419797725586, 45.29435828882694],
  [19.753037669304263, 45.2617319133804],
  [19.752595604228873, 45.26187651229432],
  [19.752614211781946, 45.261880942558406],
];

export function getNoviSadLocationBias() {
  return {
    center: NOVI_SAD.center,
    radius: NOVI_SAD.radiusMeters,
  };
}

export function getNoviSadLocationRestriction() {
  return NOVI_SAD.bounds;
}

export function matchesNoviSadArea(text) {
  const value = (text || "").toLowerCase();
  return NOVI_SAD_ALIASES.some((name) =>
    value.includes(name.toLowerCase())
  );
}

export function isPointInDeliveryZone(point) {
  if (!point) return false;
  const x = point.lng;
  const y = point.lat;
  if (x == null || y == null) return false;

  let inside = false;
  for (let i = 0, j = DELIVERY_ZONE.length - 1; i < DELIVERY_ZONE.length; j = i++) {
    const xi = DELIVERY_ZONE[i][0];
    const yi = DELIVERY_ZONE[i][1];
    const xj = DELIVERY_ZONE[j][0];
    const yj = DELIVERY_ZONE[j][1];
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

export function isAddressSuggestion(suggestion) {
  const types = suggestion?.placePrediction?.types || [];
  if (!types.length) return false;
  const mainText = (
    suggestion?.placePrediction?.structuredFormat?.mainText?.text ||
    suggestion?.placePrediction?.text?.text ||
    ""
  ).trim();
  const hasLetters = /[A-Za-z\u0400-\u04FF]/.test(mainText);
  if (!hasLetters) {
    return false;
  }
  const fullText = suggestion?.placePrediction?.text?.text || "";
  const displayText = formatAddressDisplay(fullText);
  if (!/[A-Za-z\u0400-\u04FF]/.test(displayText)) {
    return false;
  }
  const allowed = [
    "street_address",
    "route",
    "premise",
    "subpremise",
    "street_number",
    "intersection",
  ];
  if (types.includes("establishment") || types.includes("point_of_interest")) {
    return false;
  }
  if (types.some((t) => allowed.includes(t))) {
    const text = (suggestion?.placePrediction?.text?.text || "").toUpperCase();
    if (/\bE\d+\b/.test(text) || /\bA\d+\b/.test(text)) {
      return false;
    }
    return true;
  }
  if (
    types.includes("locality") ||
    types.includes("administrative_area_level_1") ||
    types.includes("administrative_area_level_2") ||
    types.includes("country")
  ) {
    return false;
  }
  return false;
}

export function isPlaceInNoviSad(place) {
  const components = place?.addressComponents || [];

  for (const c of components) {
    const types = c.types || [];
    const longText = c.longText || c.long_name || "";
    const shortText = c.shortText || c.short_name || "";
    const isCity = longText === NOVI_SAD.name || shortText === NOVI_SAD.name;

    if (
      isCity &&
      (types.includes("locality") ||
        types.includes("administrative_area_level_2") ||
        types.includes("postal_town"))
    ) {
      return true;
    }
  }

  const address = place?.formattedAddress || "";
  return address.includes(NOVI_SAD.name);
}

export function toLatin(text) {
  const value = text || "";
  const singleMap = {
    "\u0410": "A",
    "\u0430": "a",
    "\u0411": "B",
    "\u0431": "b",
    "\u0412": "V",
    "\u0432": "v",
    "\u0413": "G",
    "\u0433": "g",
    "\u0414": "D",
    "\u0434": "d",
    "\u0402": "Dj",
    "\u0452": "dj",
    "\u0415": "E",
    "\u0435": "e",
    "\u0416": "Z",
    "\u0436": "z",
    "\u0417": "Z",
    "\u0437": "z",
    "\u0418": "I",
    "\u0438": "i",
    "\u0408": "J",
    "\u0458": "j",
    "\u041A": "K",
    "\u043A": "k",
    "\u041B": "L",
    "\u043B": "l",
    "\u0409": "Lj",
    "\u0459": "lj",
    "\u041C": "M",
    "\u043C": "m",
    "\u041D": "N",
    "\u043D": "n",
    "\u040A": "Nj",
    "\u045A": "nj",
    "\u041E": "O",
    "\u043E": "o",
    "\u041F": "P",
    "\u043F": "p",
    "\u0420": "R",
    "\u0440": "r",
    "\u0421": "S",
    "\u0441": "s",
    "\u0422": "T",
    "\u0442": "t",
    "\u040B": "C",
    "\u045B": "c",
    "\u0423": "U",
    "\u0443": "u",
    "\u0424": "F",
    "\u0444": "f",
    "\u0425": "H",
    "\u0445": "h",
    "\u0426": "C",
    "\u0446": "c",
    "\u0427": "C",
    "\u0447": "c",
    "\u040F": "Dz",
    "\u045F": "dz",
    "\u0428": "S",
    "\u0448": "s",
  };

  let out = "";
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    out += singleMap[ch] || ch;
  }

  return out;
}

export function formatAddressDisplay(text) {
  const latin = toLatin(text || "").trim();
  if (!latin) return "";
  const first = latin.split(",")[0].trim();
  return first || latin;
}
