import { useEffect, useRef, useState } from "react";
import { useAddress } from "../../contexts/AddressContext";
import { loadMapbox } from "../../utils/loadMapbox";
import {
  fetchMapboxSuggestions,
  reverseMapboxGeocode,
} from "../../utils/mapboxGeocoding";
import {
  DELIVERY_ZONE,
  getNoviSadLocationBias,
  isPointInDeliveryZone,
  matchesNoviSadArea,
  formatAddressDisplay,
  toLatin,
} from "../../utils/addressValidation";

import "./AddAddressModal.css";

function AddAddressModal({
  onClose,
  initialAddress,
  onReady,
  inline = false,
  force = false,
  backRequest,
  onBackHandled,
}) {
  const { addAddressFromPlace, updateAddressById } = useAddress();

  const inputRef = useRef(null);
  const requestRef = useRef(0);
  const debounceRef = useRef(null);
  const cacheRef = useRef(new Map());
  const cacheTtlMs = 5 * 60 * 1000;
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const mapboxRef = useRef(null);
  const mapLoadedRef = useRef(false);
  const pinElementRef = useRef(null);
  const pinPositionRef = useRef(null);
  const readyNotifiedRef = useRef(false);
  const backRequestRef = useRef(backRequest);
  const modalRef = useRef(null);

  const [mapsReady, setMapsReady] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [addressError, setAddressError] = useState("");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [pendingAddress, setPendingAddress] = useState("");
  const [pinPosition, setPinPosition] = useState(null);
  const [pinInZone, setPinInZone] = useState(true);
  const [pinMoved, setPinMoved] = useState(false);
  const [addressChanged, setAddressChanged] = useState(false);
  const [addressType, setAddressType] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [entranceNumber, setEntranceNumber] = useState("");
  const [apartmentNumber, setApartmentNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [entryCode, setEntryCode] = useState("");
  const [step, setStep] = useState("address");
  const [mapMode, setMapMode] = useState("inline");
  const visibleSuggestions = suggestions.filter((s) => {
    const name = `${s.display_name || ""} ${s.place_name || ""}`.toLowerCase();
    return !name.includes("obilaznica");
  });

  const initialType = initialAddress?.address_type || "kuca";
  const initialHouse = initialAddress?.house_number || "";
  const initialEntrance = initialAddress?.entrance_number || "";
  const initialApartment = initialAddress?.apartment_number || "";
  const initialFloor = initialAddress?.floor || "";
  const initialEntry = initialAddress?.entry_code || "";
  const detailsChanged =
    !!initialAddress &&
    (addressType !== initialType ||
      houseNumber !== initialHouse ||
      entranceNumber !== initialEntrance ||
      apartmentNumber !== initialApartment ||
      floor !== initialFloor ||
      entryCode !== initialEntry);

  function isSameAddressInput(value, initialValue) {
    const current = toLatin(value || "").trim().toLowerCase();
    const full = toLatin(initialValue || "").trim().toLowerCase();
    const short = formatAddressDisplay(initialValue || "")
      .trim()
      .toLowerCase();
    if (!current) return false;
    return current === full || current === short;
  }


  function createPinContent(isAllowed) {
    if (!pinElementRef.current) {
      const el = document.createElement("div");
      el.style.display = "flex";
      el.style.flexDirection = "column";
      el.style.alignItems = "center";
      el.style.justifyContent = "flex-start";
      el.style.width = "22px";
      el.style.height = "30px";
      el.style.position = "relative";

      const head = document.createElement("div");
      head.style.width = "22px";
      head.style.height = "22px";
      head.style.borderRadius = "50%";
      head.style.border = "2px solid #ffffff";
      head.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.25)";
      head.style.position = "relative";

      const dot = document.createElement("div");
      dot.style.width = "8px";
      dot.style.height = "8px";
      dot.style.borderRadius = "50%";
      dot.style.background = "#ffffff";
      dot.style.position = "absolute";
      dot.style.left = "50%";
      dot.style.top = "50%";
      dot.style.transform = "translate(-50%, -50%)";
      head.appendChild(dot);

      const tip = document.createElement("div");
      tip.style.width = "0";
      tip.style.height = "0";
      tip.style.borderLeft = "6px solid transparent";
      tip.style.borderRight = "6px solid transparent";
      tip.style.borderTop = "8px solid var(--brand-primary)";
      tip.style.marginTop = "-1px";

      el.appendChild(head);
      el.appendChild(tip);
      pinElementRef.current = el;
    }

    const head = pinElementRef.current.firstChild;
    const tip = pinElementRef.current.lastChild;
    if (head) {
      head.style.background = isAllowed
        ? "var(--brand-primary)"
        : "var(--brand-warning)";
    }
    if (tip) {
      tip.style.borderTopColor = isAllowed
        ? "var(--brand-primary)"
        : "var(--brand-warning)";
    }

    return pinElementRef.current;
  }

  useEffect(() => {
    let cancelled = false;

    loadMapbox()
      .then((mapboxgl) => {
        if (cancelled) return;
        mapboxRef.current = mapboxgl;
        if (process.env.REACT_APP_MAPBOX_TOKEN) {
          mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;
        }
        setAddressError("");
        setMapsReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setMapsReady(false);
        setAddressError("Mapa nije dostupna.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (inline) return;
    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    const onTouchMove = (event) => {
      if (!modalRef.current) {
        event.preventDefault();
        return;
      }
      if (!modalRef.current.contains(event.target)) {
        event.preventDefault();
      }
    };
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, [inline]);

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
    setStep("details");
  }, [mapsReady, initialAddress]);

  useEffect(() => {
    if (!initialAddress) return;
    setAddressType(initialAddress.address_type || "kuca");
    setHouseNumber(initialAddress.house_number || "");
    setEntranceNumber(initialAddress.entrance_number || "");
    setApartmentNumber(initialAddress.apartment_number || "");
    setFloor(initialAddress.floor || "");
    setEntryCode(initialAddress.entry_code || "");
    setStep("details");
  }, [initialAddress]);

  useEffect(() => {
    if (!mapsReady || initialAddress || pinPosition) return;
    const center = { lat: 45.251919, lng: 19.836985 };
    setPinInZone(isPointInDeliveryZone(center));
    setPinPosition(center);
    setPinMoved(false);
  }, [mapsReady, initialAddress, pinPosition]);

  useEffect(() => {
    pinPositionRef.current = pinPosition;
  }, [pinPosition]);

  useEffect(() => {
    if (!mapsReady || !mapRef.current || !mapboxRef.current) return;
    if (!initialAddress && step !== "details") return;

    const mapboxgl = mapboxRef.current;
    const hasPin = !!pinPosition;
    const center = hasPin
      ? { lat: pinPosition.lat, lng: pinPosition.lng }
      : getNoviSadLocationBias().center;
    const isInZone = hasPin ? isPointInDeliveryZone(center) : true;
    const zoneData = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [DELIVERY_ZONE],
      },
    };

    const ensureSources = (map) => {
      if (!map.getSource("delivery-zone")) {
        map.addSource("delivery-zone", {
          type: "geojson",
          data: zoneData,
        });
        map.addLayer({
          id: "delivery-zone-fill",
          type: "fill",
          source: "delivery-zone",
          paint: {
            "fill-color": "#0f172a",
            "fill-opacity": 0.08,
          },
        });
        map.addLayer({
          id: "delivery-zone-line",
          type: "line",
          source: "delivery-zone",
          paint: {
            "line-color": "#0f172a",
            "line-opacity": 0.8,
            "line-width": 2,
          },
        });
      } else {
        map.getSource("delivery-zone").setData(zoneData);
      }
    };

    const ensureMarker = (map, markerCenter, markerInZone) => {
      if (!markerRef.current) {
        markerRef.current = new mapboxgl.Marker({
          element: createPinContent(markerInZone),
          draggable: mapMode === "full",
          anchor: "bottom",
        })
          .setLngLat([markerCenter.lng, markerCenter.lat])
          .addTo(map);
        markerRef.current.on("dragend", async () => {
          const lngLat = markerRef.current.getLngLat();
          const rawNext = { lat: lngLat.lat, lng: lngLat.lng };
          const next = rawNext;
          const nextInZone = isPointInDeliveryZone(next);
          setPinInZone(nextInZone);
          setPinPosition(next);
          setPinMoved(true);
          if (markerRef.current) {
            markerRef.current.setLngLat([next.lng, next.lat]);
            createPinContent(nextInZone);
          }
          setAddressError(
            nextInZone ? "" : "Pin je van zone dostave. Pomeri ga unutar zone."
          );
          const address = await reverseMapboxGeocode(next);
          if (!address) return;
          setPendingAddress(address);
          if (inputRef.current) {
            inputRef.current.value = formatAddressDisplay(address);
          }
        });
      } else {
        markerRef.current.setLngLat([markerCenter.lng, markerCenter.lat]);
        markerRef.current.setDraggable(mapMode === "full");
        createPinContent(markerInZone);
      }
    };

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new mapboxgl.Map({
        container: mapRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [center.lng, center.lat],
        zoom: 17,
        interactive: mapMode === "full",
      });
      if (mapMode !== "full") {
        mapInstanceRef.current.scrollZoom.disable();
        mapInstanceRef.current.dragPan.disable();
        mapInstanceRef.current.doubleClickZoom.disable();
        mapInstanceRef.current.touchZoomRotate.disable();
        mapInstanceRef.current.keyboard.disable();
      }
      mapInstanceRef.current.on("load", () => {
        mapLoadedRef.current = true;
        const latestPin = pinPositionRef.current;
        const loadCenter = latestPin
          ? { lat: latestPin.lat, lng: latestPin.lng }
          : center;
        const loadInZone = latestPin ? isPointInDeliveryZone(loadCenter) : true;
        mapInstanceRef.current.setCenter([loadCenter.lng, loadCenter.lat]);
        ensureSources(mapInstanceRef.current);
        ensureMarker(mapInstanceRef.current, loadCenter, loadInZone);
        if (!readyNotifiedRef.current && onReady) {
          readyNotifiedRef.current = true;
          onReady();
        }
      });
    } else if (mapLoadedRef.current) {
      mapInstanceRef.current.setCenter([center.lng, center.lat]);
      if (mapMode === "full") {
        mapInstanceRef.current.scrollZoom.enable();
        mapInstanceRef.current.dragPan.enable();
        mapInstanceRef.current.doubleClickZoom.enable();
        mapInstanceRef.current.touchZoomRotate.enable();
        mapInstanceRef.current.keyboard.enable();
      } else {
        mapInstanceRef.current.scrollZoom.disable();
        mapInstanceRef.current.dragPan.disable();
        mapInstanceRef.current.doubleClickZoom.disable();
        mapInstanceRef.current.touchZoomRotate.disable();
        mapInstanceRef.current.keyboard.disable();
      }
      ensureSources(mapInstanceRef.current);
      ensureMarker(mapInstanceRef.current, center, isInZone);
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.resize();
    }

    setPinInZone(isInZone);
  }, [mapsReady, pinPosition, step, initialAddress, mapMode, onReady]);

  function handleInput(e) {
    if (!mapsReady) return;

    const rawValue = e.target.value;
    const value = toLatin(rawValue);
    setAddressError("");
    setPendingAddress("");
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

      const currentRequest = ++requestRef.current;
      let next = await fetchMapboxSuggestions(query);

      if (!next.length && value.length > 4) {
        const fallbackInput = query.slice(0, -1).trim();
        if (fallbackInput.length >= 3) {
          next = await fetchMapboxSuggestions(fallbackInput);
        }
      }

      if (!next.length) {
        const rawInput = value.trim();
        if (rawInput.length >= 3 && rawInput !== query) {
          next = await fetchMapboxSuggestions(rawInput);
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
    if (!suggestion?.place_name || !suggestion?.center) return;

    setSuggestions([]);
    setAddressError("");
    setPendingAddress(suggestion.place_name);
    if (inputRef.current) {
      inputRef.current.value = formatAddressDisplay(suggestion.place_name);
    }
    const next = {
      lat: suggestion.center.lat,
      lng: suggestion.center.lng,
    };
    setPinInZone(isPointInDeliveryZone(next));
    setPinPosition(next);
    setPinMoved(false);
    if (initialAddress) {
      setAddressChanged(true);
    }
    if (!initialAddress) {
      setAddressType("");
    }
  }

  function handleContinueFromAddress() {
    if (!pendingAddress || !pinPosition) return;
    setStep("type");
  }

  function handleMapModeOpen() {
    setMapMode("full");
  }

  function handleMapModeClose() {
    setMapMode("inline");
  }

  async function handleConfirmPin() {
    if (!pinPosition || !pendingAddress) return;
    if (!isPointInDeliveryZone(pinPosition)) {
      setAddressError("Dostava je dostupna samo u zoni dostave.");
      return;
    }

    const isHouse = addressType === "kuca";
    const needsUnit = addressType !== "kuca";
    const missingRequired =
      (isHouse && !houseNumber) ||
      (needsUnit &&
        (!entranceNumber || !apartmentNumber || !floor));

    if (missingRequired) {
      setAddressError("Popunite sva obavezna polja.");
      return;
    }

    const payload = {
      address: pendingAddress,
      lat: pinPosition.lat,
      lng: pinPosition.lng,
      address_type: addressType,
      house_number: isHouse ? houseNumber : null,
      entrance_number: needsUnit ? entranceNumber : null,
      apartment_number: needsUnit ? apartmentNumber : null,
      floor: needsUnit ? floor : null,
      entry_code:
        addressType === "stan" || addressType === "ostalo"
          ? entryCode
          : null,
    };

    if (initialAddress?.id) {
      await updateAddressById({
        id: initialAddress.id,
        ...payload,
      });
    } else {
      await addAddressFromPlace(payload);
    }

    onClose();
  }

  useEffect(() => {
    if (backRequest == null) return;
    if (backRequestRef.current === backRequest) return;
    backRequestRef.current = backRequest;
    if (!initialAddress && step !== "address") {
      setStep(step === "details" ? "type" : "address");
      if (onBackHandled) onBackHandled(true);
      return;
    }
    if (onBackHandled) onBackHandled(false);
  }, [backRequest, initialAddress, onBackHandled, step]);

  const content = (
    <div
      ref={modalRef}
      className={`aa-modal${mapMode === "full" ? " is-map-full" : ""}`}
    >
      {!inline && !force && (
        <button type="button" className="aa-close" onClick={onClose}>
          x
        </button>
      )}
      {step !== "type" && (
        <>
          <h2>
            {step === "details"
              ? "Adresa"
              : initialAddress
                ? "Izmena adrese"
                : "Unesite adresu"}
          </h2>
          {step === "details" && (
            <div className="aa-selected-address">
              {formatAddressDisplay(
                pendingAddress || initialAddress?.address || ""
              )}
            </div>
          )}
        </>
      )}

        {step === "address" && (
          <>
            <div className="aa-search">
              <input
                ref={inputRef}
                className="aa-input"
                placeholder="Naziv ulice i broj"
                onChange={handleInput}
                autoComplete="off"
                disabled={!mapsReady}
              />
            {visibleSuggestions.length > 0 && (
              <div className="aa-suggestions">
                {visibleSuggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelect(s)}
                  >
                    {formatAddressDisplay(s.display_name || s.place_name)}
                  </button>
                ))}
              </div>
            )}

            {loadingSuggestions &&
              visibleSuggestions.length === 0 &&
              !addressError && (
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
            <button
              type="button"
              className="aa-confirm aa-continue"
              onClick={handleContinueFromAddress}
              disabled={!pendingAddress || !pinPosition}
            >
              Nastavi
            </button>
          </>
        )}

        {step === "type" && (
          <div className="aa-type-step is-type">
            <h3>Izaberite tip objekta</h3>
            <div className="aa-type-options">
              {["kuca", "stan", "ostalo"].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`aa-type-btn${
                    addressType === type ? " active" : ""
                  }`}
                  onClick={() => {
                    setAddressType(type);
                    if (!initialAddress) setStep("details");
                  }}
                >
                  {type === "kuca" && "Kuća"}
                  {type === "stan" && "Stan"}
                  {type === "ostalo" && "Ostalo"}
                </button>
              ))}
            </div>
          </div>
        )}

        {(initialAddress || step === "details") && (
          <div className="aa-type-step">
            <h3>Izaberite tip objekta</h3>
            <select
              className="aa-type-select"
              value={addressType}
              onChange={(e) => {
                setAddressType(e.target.value);
              }}
            >
              <option value="kuca">Kuća</option>
              <option value="stan">Stan</option>
              <option value="ostalo">Ostalo</option>
            </select>
          </div>
        )}

        {(initialAddress || step === "details") && (
          <div className="aa-details">
            {addressType === "kuca" && (
              <div className="aa-field">
                <label>Broj kuće</label>
                <input
                  type="text"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                />
              </div>
            )}

            {addressType !== "kuca" && (
              <>
                <div className="aa-field">
                  <label>Broj ulaza</label>
                  <input
                    type="text"
                    value={entranceNumber}
                    onChange={(e) => setEntranceNumber(e.target.value)}
                  />
                </div>
                <div className="aa-field">
                  <label>Broj stana</label>
                  <input
                    type="text"
                    value={apartmentNumber}
                    onChange={(e) => setApartmentNumber(e.target.value)}
                  />
                </div>
                <div className="aa-field">
                  <label>Sprat</label>
                  <input
                    type="text"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                  />
                </div>
              </>
            )}

            {(addressType === "stan" || addressType === "ostalo") && (
              <div className="aa-field">
                <label>Sifra za ulaz (opciono)</label>
                <input
                  type="text"
                  value={entryCode}
                  onChange={(e) => setEntryCode(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {(initialAddress || step === "details") && (
          <div className="aa-map">
            <div className="aa-map-title">Tačna lokacija ulaza</div>
            <div className="aa-map-container">
              {mapMode !== "full" && (
                <button
                  type="button"
                  className="aa-map-action"
                  onClick={handleMapModeOpen}
                >
                  Izaberi na mapi
                </button>
              )}
              <div className="aa-map-frame" ref={mapRef} />
            </div>
            {!mapsReady && (
              <div className="aa-map-subtitle">
                Ucitavam mapu...
              </div>
            )}
            <button
              type="button"
              className="aa-confirm"
              onClick={mapMode === "full" ? handleMapModeClose : handleConfirmPin}
              disabled={
                mapMode === "full"
                  ? !pinInZone
                  : !pinInZone ||
                    ((!pinMoved && (!initialAddress || addressChanged)) &&
                      !detailsChanged) ||
                    (initialAddress &&
                      ((addressType === "kuca" && !houseNumber) ||
                        (addressType !== "kuca" &&
                          (!entranceNumber ||
                            !apartmentNumber ||
                            !floor))))
              }
            >
              {mapMode === "full"
                ? "Nastavi"
                : initialAddress
                  ? "Sacuvaj izmene"
                  : "Potvrdi adresu"}
            </button>
          </div>
        )}
    </div>
  );

  if (inline) {
    return <div className="aa-inline">{content}</div>;
  }

  return <div className="aa-overlay">{content}</div>;
}

export default AddAddressModal;


