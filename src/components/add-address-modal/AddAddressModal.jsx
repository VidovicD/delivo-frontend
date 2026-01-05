import { useEffect, useRef, useState } from "react";
import { useAddress } from "../../contexts/AddressContext";
import { loadGoogleMaps } from "../../utils/loadGoogleMaps";
import {
  DELIVERY_ZONE,
  getNoviSadLocationBias,
  isAddressSuggestion,
  isPointInDeliveryZone,
  matchesNoviSadArea,
  formatAddressDisplay,
  toLatin,
} from "../../utils/addressValidation";

import "./AddAddressModal.css";

function AddAddressModal({ onClose, initialAddress }) {
  const { addAddressFromPlace, updateAddressById } = useAddress();

  const inputRef = useRef(null);
  const requestRef = useRef(0);
  const debounceRef = useRef(null);
  const cacheRef = useRef(new Map());
  const cacheTtlMs = 5 * 60 * 1000;
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const polygonRef = useRef(null);
  const geocoderRef = useRef(null);
  const mapCtorRef = useRef(null);
  const markerCtorRef = useRef(null);

  const [mapsReady, setMapsReady] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [addressError, setAddressError] = useState("");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [pendingAddress, setPendingAddress] = useState("");
  const [pinPosition, setPinPosition] = useState(null);
  const [pinInZone, setPinInZone] = useState(true);
  const [pinMoved, setPinMoved] = useState(false);
  const [locating, setLocating] = useState(false);
  const [addressChanged, setAddressChanged] = useState(false);

  function isPlusCodeAddress(text) {
    if (!text) return false;
    return /^[23456789CFGHJMPQRVWX]{4,}\+/.test(text.trim());
  }

  function isSameAddressInput(value, initialValue) {
    const current = toLatin(value || "").trim().toLowerCase();
    const full = toLatin(initialValue || "").trim().toLowerCase();
    const short = formatAddressDisplay(initialValue || "")
      .trim()
      .toLowerCase();
    if (!current) return false;
    return current === full || current === short;
  }

  function fetchAddressForPosition(next) {
    if (!geocoderRef.current) return;
    geocoderRef.current.geocode({ location: next }, (results, status) => {
      if (status === "OK" && results && results.length > 0) {
        const usable = results.filter((r) => {
          const text = (r.formatted_address || "").trim();
          const displayText = formatAddressDisplay(text);
          const hasLetters = /[A-Za-z\u0400-\u04FF]/.test(displayText);
          return hasLetters && !isPlusCodeAddress(text);
        });
        const preferred = usable.find((r) => {
          const types = r.types || [];
          const locType = r.geometry?.location_type;
          const isStreet = types.includes("street_address");
          const isPrecise =
            locType === "ROOFTOP" || locType === "RANGE_INTERPOLATED";
          return isStreet && isPrecise;
        });
        const chosen = preferred || usable[0];
        if (!chosen) {
          setPendingAddress("");
          setAddressError("Nema validne adrese. Pomeri pin na ulicu.");
          if (inputRef.current) {
            inputRef.current.value = "";
          }
          return;
        }
        setPendingAddress(chosen.formatted_address);
        setAddressError("");
        if (inputRef.current) {
          inputRef.current.value = formatAddressDisplay(chosen.formatted_address);
        }
      }
    });
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setAddressError("Lokacija nije podrzana u ovom uredjaju.");
      return;
    }
    setLocating(true);
    setAddressError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        const inZone = isPointInDeliveryZone(next);
        setPinInZone(inZone);
        setPinPosition(next);
        setPinMoved(true);
        setAddressError(
          inZone ? "" : "Pin je van zone dostave. Pomeri ga unutar zone."
        );
        fetchAddressForPosition(next);
        setLocating(false);
      },
      () => {
        setAddressError("Ne mogu da pristupim lokaciji.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function createPinContent(inZone) {
    const el = document.createElement("div");
    el.style.width = "22px";
    el.style.height = "22px";
    el.style.borderRadius = "12px 12px 12px 0";
    el.style.background = inZone
      ? "var(--brand-primary)"
      : "var(--brand-warning)";
    el.style.border = "2px solid #ffffff";
    el.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.25)";
    el.style.transform = "rotate(-45deg)";
    el.style.position = "relative";

    const dot = document.createElement("div");
    dot.style.width = "8px";
    dot.style.height = "8px";
    dot.style.borderRadius = "50%";
    dot.style.background = "#ffffff";
    dot.style.position = "absolute";
    dot.style.left = "50%";
    dot.style.top = "50%";
    dot.style.transform = "translate(-50%, -50%) rotate(45deg)";
    el.appendChild(dot);

    return el;
  }

  useEffect(() => {
    let cancelled = false;

    const tryInitLibraries = async (attempt = 0) => {
      if (cancelled) return;

      let mapsCtor = null;
      let markerCtor = null;

      if (window.google?.maps?.importLibrary) {
        try {
          const mapsLib = await window.google.maps.importLibrary("maps");
          const markerLib = await window.google.maps.importLibrary("marker");
          mapsCtor = mapsLib?.Map || null;
          markerCtor = markerLib?.AdvancedMarkerElement || null;
        } catch {
          mapsCtor = null;
          markerCtor = null;
        }
      }

      if (!mapsCtor && window.google?.maps?.Map) {
        mapsCtor = window.google.maps.Map;
      }
      if (!markerCtor && window.google?.maps?.marker?.AdvancedMarkerElement) {
        markerCtor = window.google.maps.marker.AdvancedMarkerElement;
      }

      mapCtorRef.current = mapsCtor;
      markerCtorRef.current = markerCtor;

      if (mapCtorRef.current) {
        setAddressError("");
        setMapsReady(true);
        return;
      }

      if (attempt < 8) {
        setTimeout(() => tryInitLibraries(attempt + 1), 200);
        return;
      }

      setMapsReady(false);
      setAddressError("Mapa nije dostupna.");
    };

    loadGoogleMaps().then(() => {
      tryInitLibraries(0);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapsReady || !initialAddress) return;
    setSuggestions([]);
    setAddressError("");
    setPendingAddress(initialAddress.address || "");
    setPinMoved(false);
    setAddressChanged(false);
    if (inputRef.current) {
      inputRef.current.value = formatAddressDisplay(initialAddress.address || "");
    }
    if (initialAddress.lat != null && initialAddress.lng != null) {
      const next = {
        lat: initialAddress.lat,
        lng: initialAddress.lng,
      };
      setPinInZone(isPointInDeliveryZone(next));
      setPinPosition(next);
    }
  }, [mapsReady, initialAddress]);

  useEffect(() => {
    if (!mapsReady || !mapRef.current || !mapCtorRef.current) return;

    const hasPin = !!pinPosition;
    const center = hasPin
      ? { lat: pinPosition.lat, lng: pinPosition.lng }
      : getNoviSadLocationBias().center;
    const zonePath = DELIVERY_ZONE.map(([lng, lat]) => ({ lat, lng }));
    const isInZone = hasPin ? isPointInDeliveryZone(center) : true;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new mapCtorRef.current(mapRef.current, {
        center,
        zoom: 16,
        disableDefaultUI: true,
        zoomControl: true,
        ...(process.env.REACT_APP_GOOGLE_MAPS_MAP_ID
          ? { mapId: process.env.REACT_APP_GOOGLE_MAPS_MAP_ID }
          : {}),
      });
      if (hasPin && markerCtorRef.current) {
        markerRef.current = new markerCtorRef.current({
          map: mapInstanceRef.current,
          position: center,
          content: createPinContent(isInZone),
          gmpDraggable: true,
        });
        markerRef.current.addListener("dragend", (event) => {
          const pos =
            event && event.latLng ? event.latLng : markerRef.current.position;
          if (!pos) return;
          const next = { lat: pos.lat(), lng: pos.lng() };
          const inZone = isPointInDeliveryZone(next);
          setPinInZone(inZone);
          setPinPosition(next);
          setPinMoved(true);
          if (markerRef.current) {
            markerRef.current.content = createPinContent(inZone);
          }
          setAddressError(
            inZone ? "" : "Pin je van zone dostave. Pomeri ga unutar zone."
          );
          fetchAddressForPosition(next);
        });
      }
      polygonRef.current = new window.google.maps.Polygon({
        map: mapInstanceRef.current,
        paths: zonePath,
        strokeColor: "#0f172a",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#0f172a",
        fillOpacity: 0.08,
        clickable: false,
      });
      if (!geocoderRef.current) {
        geocoderRef.current = new window.google.maps.Geocoder();
      }
      if (hasPin) {
        setPinInZone(isInZone);
      }
    } else {
      mapInstanceRef.current.setCenter(center);
      if (hasPin) {
        mapInstanceRef.current.setZoom(16);
      }
      if (hasPin) {
        if (!markerRef.current && markerCtorRef.current) {
          markerRef.current = new markerCtorRef.current({
            map: mapInstanceRef.current,
            position: center,
            content: createPinContent(isInZone),
            gmpDraggable: true,
          });
          markerRef.current.addListener("dragend", (event) => {
            const pos =
              event && event.latLng
                ? event.latLng
                : markerRef.current.position;
            if (!pos) return;
            const next = { lat: pos.lat(), lng: pos.lng() };
            const inZone = isPointInDeliveryZone(next);
            setPinInZone(inZone);
            setPinPosition(next);
            setPinMoved(true);
            if (markerRef.current) {
              markerRef.current.content = createPinContent(inZone);
            }
            setAddressError(
              inZone ? "" : "Pin je van zone dostave. Pomeri ga unutar zone."
            );
            fetchAddressForPosition(next);
          });
        } else if (markerRef.current) {
          markerRef.current.map = mapInstanceRef.current;
          markerRef.current.position = center;
          markerRef.current.content = createPinContent(isInZone);
        }
        setPinInZone(isInZone);
      } else if (markerRef.current) {
        markerRef.current.map = null;
      }
      if (polygonRef.current) {
        polygonRef.current.setPaths(zonePath);
      }
    }
  }, [mapsReady, pinPosition]);

  function handleInput(e) {
    if (!mapsReady) return;

    const rawValue = e.target.value;
    const value = toLatin(rawValue);
    setAddressError("");
    setPendingAddress("");
    if (!initialAddress) {
      setPinPosition(null);
    }
    setPinInZone(true);
    if (!initialAddress) {
      setPinMoved(false);
      setAddressChanged(false);
    } else {
      setAddressChanged(!isSameAddressInput(value, initialAddress.address || ""));
    }

    if (!value) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }
    if (value.length < 3) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setLoadingSuggestions(true);
    debounceRef.current = setTimeout(async () => {
      const baseQuery = matchesNoviSadArea(value)
        ? value
        : `${value}, Novi Sad`;
      const query = baseQuery;

      const cached = cacheRef.current.get(query);
      if (cached) {
        if (Date.now() - cached.ts < cacheTtlMs) {
          setAddressError(
            cached.value.length ? "" : "Nema rezultata u zoni dostave."
          );
          setSuggestions(cached.value);
          setLoadingSuggestions(false);
          return;
        }
        cacheRef.current.delete(query);
      }

      const baseRequest = {
        input: query,
        includedRegionCodes: ["RS"],
        locationBias: getNoviSadLocationBias(),
      };

      const currentRequest = ++requestRef.current;

      async function getFilteredSuggestions(req) {
        const { suggestions: rawSuggestions } =
          await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            req
          );

        const candidates = (rawSuggestions || [])
          .filter((s) => isAddressSuggestion(s))
          .slice(0, 10);

        const filtered = await Promise.all(
          candidates.map(async (s) => {
            try {
              const place = s.placePrediction.toPlace();
              await place.fetchFields({ fields: ["location"] });
              if (!place.location) return null;
              const inZone = isPointInDeliveryZone({
                lat: place.location.lat(),
                lng: place.location.lng(),
              });
              return inZone ? s : null;
            } catch {
              return null;
            }
          })
        );

        return filtered.filter(Boolean).slice(0, 3);
      }

      let next = await getFilteredSuggestions(baseRequest);

      if (!next.length && value.length > 4) {
        const fallbackInput = query.slice(0, -1).trim();
        if (fallbackInput.length >= 3) {
          next = await getFilteredSuggestions({
            ...baseRequest,
            input: fallbackInput,
          });
        }
      }

      if (!next.length) {
        const rawInput = value.trim();
        if (rawInput.length >= 3 && rawInput !== query) {
          next = await getFilteredSuggestions({
            ...baseRequest,
            input: rawInput,
          });
        }
      }

      if (currentRequest === requestRef.current) {
        cacheRef.current.set(query, { ts: Date.now(), value: next });
        setAddressError(next.length ? "" : "Nema rezultata u zoni dostave.");
        setSuggestions(next);
        setLoadingSuggestions(false);
      }
    }, 300);
  }

  async function handleSelect(suggestion) {
    if (!mapsReady) return;

    const place = suggestion.placePrediction.toPlace();

    await place.fetchFields({
      fields: ["formattedAddress", "location", "addressComponents"],
    });

    if (!place.formattedAddress || !place.location) return;

    setSuggestions([]);
    setAddressError("");
    setPendingAddress(place.formattedAddress);
    if (inputRef.current) {
      inputRef.current.value = formatAddressDisplay(place.formattedAddress);
    }
    const next = {
      lat: place.location.lat(),
      lng: place.location.lng(),
    };
    setPinInZone(isPointInDeliveryZone(next));
    setPinPosition(next);
    setPinMoved(false);
    if (initialAddress) {
      setAddressChanged(true);
    }
  }

  async function handleConfirmPin() {
    if (!pinPosition || !pendingAddress) return;
    if (!isPointInDeliveryZone(pinPosition)) {
      setAddressError("Dostava je dostupna samo u zoni dostave.");
      return;
    }

    if (initialAddress?.id) {
      await updateAddressById({
        id: initialAddress.id,
        address: pendingAddress,
        lat: pinPosition.lat,
        lng: pinPosition.lng,
      });
    } else {
      await addAddressFromPlace({
        address: pendingAddress,
        lat: pinPosition.lat,
        lng: pinPosition.lng,
      });
    }

    onClose();
  }

  return (
    <div className="aa-overlay">
      <div className="aa-modal">
        <h2>{initialAddress ? "Izmena adrese" : "Dodavanje adrese"}</h2>

        <div className="aa-search">
          <input
            ref={inputRef}
            className="aa-input"
            placeholder="Unesite adresu"
            onChange={handleInput}
            autoComplete="off"
            disabled={!mapsReady}
          />
          <button
            type="button"
            className="aa-locate aa-locate--input"
            onClick={handleUseMyLocation}
            disabled={locating || !mapsReady}
            title="Moja lokacija"
          >
            {locating ? "..." : <span className="aa-locate-icon" />}
          </button>

          {suggestions.length > 0 && (
            <div className="aa-suggestions">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(s)}
                >
                  {formatAddressDisplay(s.placePrediction.text.text)}
                </button>
              ))}
            </div>
          )}

          {loadingSuggestions && suggestions.length === 0 && !addressError && (
            <div className="aa-suggestions">
              <button type="button" disabled>
                Trazim adrese...
              </button>
            </div>
          )}

          {addressError && (
            <div className="aa-suggestions">
              <button type="button" disabled>
                {addressError}
              </button>
            </div>
          )}
        </div>

        <div className="aa-map">
          <div className="aa-map-title">
            Potvrdi lokaciju na mapi
          </div>
          {pendingAddress ? (
              <div className="aa-map-subtitle">
                Pomeri pin na tacnu adresu: {formatAddressDisplay(pendingAddress)}
              </div>
          ) : (
            <div className="aa-map-subtitle">
              Unesi adresu pa pomeri pin.
            </div>
          )}
          {!mapsReady && (
            <div className="aa-map-subtitle">
              Ucitavam mapu...
            </div>
          )}
            {pinPosition && (!pinMoved && (!initialAddress || addressChanged)) && (
              <div className="aa-map-subtitle">
                Pomeri pin da potvrdis tacnu lokaciju.
              </div>
            )}
          <div className="aa-map-frame" ref={mapRef} />
          <button
            type="button"
            className="aa-confirm"
            onClick={handleConfirmPin}
              disabled={
                !pinInZone ||
                (!pinMoved && (!initialAddress || addressChanged))
              }
            >
            {initialAddress ? "Sacuvaj izmene" : "Potvrdi adresu"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddAddressModal;


