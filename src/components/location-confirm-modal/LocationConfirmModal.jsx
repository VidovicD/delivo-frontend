import { useEffect, useRef, useState } from "react";
import { loadMapbox } from "../../utils/loadMapbox";
import { reverseMapboxGeocode } from "../../utils/mapboxGeocoding";
import {
  DELIVERY_ZONE,
  formatAddressDisplay,
  isPointInDeliveryZone,
} from "../../utils/addressValidation";
import "./LocationConfirmModal.css";
import closeIcon from "../../assets/close.svg";

function LocationConfirmModal({ isOpen, address, coords, onClose, onConfirm }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const mapboxRef = useRef(null);
  const lastCoordsRef = useRef(null);
  const pinElementRef = useRef(null);
  const propLat = coords?.lat;
  const propLng = coords?.lng;

  const [currentAddress, setCurrentAddress] = useState(address || "");
  const [currentCoords, setCurrentCoords] = useState(coords || null);
  const [pinInZone, setPinInZone] = useState(true);

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

      const tail = document.createElement("div");
      tail.style.width = "0";
      tail.style.height = "0";
      tail.style.borderLeft = "6px solid transparent";
      tail.style.borderRight = "6px solid transparent";
      tail.style.borderTop = "10px solid #ffb60f";
      tail.style.position = "absolute";
      tail.style.left = "50%";
      tail.style.bottom = "0";
      tail.style.transform = "translate(-50%, 6px)";

      head.appendChild(dot);
      el.appendChild(head);
      el.appendChild(tail);

      pinElementRef.current = el;
    }

    const head = pinElementRef.current.children[0];
    const tail = pinElementRef.current.children[1];
    const color = isAllowed ? "#ffb60f" : "#ef4444";
    head.style.background = color;
    tail.style.borderTopColor = color;
    return pinElementRef.current;
  }

  useEffect(() => {
    if (!isOpen) return;
    setCurrentAddress(address || "");
    if (typeof propLat !== "number" || typeof propLng !== "number") {
      setCurrentCoords(null);
      return;
    }
    setCurrentCoords((prev) => {
      if (prev && prev.lat === propLat && prev.lng === propLng) {
        return prev;
      }
      return { lat: propLat, lng: propLng };
    });
    setPinInZone(isPointInDeliveryZone({ lat: propLat, lng: propLng }));
  }, [isOpen, address, propLat, propLng]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    markerRef.current = null;
    lastCoordsRef.current = null;
    pinElementRef.current = null;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !currentCoords || !mapRef.current) return;

    const { lat, lng } = currentCoords;
    if (typeof lat !== "number" || typeof lng !== "number") return;
    setPinInZone(isPointInDeliveryZone({ lat, lng }));

    loadMapbox()
      .then((mapboxgl) => {
        mapboxRef.current = mapboxgl;

        if (!mapInstanceRef.current) {
          const map = new mapboxgl.Map({
            container: mapRef.current,
            style: "mapbox://styles/mapbox/streets-v12",
            center: [lng, lat],
            zoom: 17,
            interactive: true,
          });

          map.addControl(
            new mapboxgl.NavigationControl({ showCompass: false }),
            "bottom-right"
          );

          const zoneData = {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [DELIVERY_ZONE],
            },
          };

          map.on("load", () => {
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
            }
            map.resize();
          });

          const marker = new mapboxgl.Marker({
            element: createPinContent(isPointInDeliveryZone({ lat, lng })),
            draggable: true,
            anchor: "bottom",
          })
            .setLngLat([lng, lat])
            .addTo(map);

          marker.on("dragend", async () => {
            const pos = marker.getLngLat();
            const nextCoords = { lat: pos.lat, lng: pos.lng };
            lastCoordsRef.current = nextCoords;
            setCurrentCoords(nextCoords);
            map.setCenter([nextCoords.lng, nextCoords.lat]);
            const inZone = isPointInDeliveryZone(nextCoords);
            setPinInZone(inZone);
            createPinContent(inZone);
            const nextAddress = await reverseMapboxGeocode(nextCoords);
            if (nextAddress) {
              setCurrentAddress(nextAddress);
            }
          });

          mapInstanceRef.current = map;
          markerRef.current = marker;
        } else {
          const last = lastCoordsRef.current;
          if (!last || last.lat !== lat || last.lng !== lng) {
            mapInstanceRef.current.setCenter([lng, lat]);
            markerRef.current.setLngLat([lng, lat]);
            createPinContent(isPointInDeliveryZone({ lat, lng }));
            lastCoordsRef.current = { lat, lng };
            setPinInZone(isPointInDeliveryZone({ lat, lng }));
          }
        }
      })
      .catch(() => {});
  }, [isOpen, currentCoords]);

  if (!isOpen) return null;

  return (
    <div className="lc-overlay">
      <div className="lc-modal">
        <button className="lc-close" type="button" onClick={onClose}>
          <img src={closeIcon} alt="" />
        </button>
        <h2>Da li je ovo tačna lokacija za dostavu?</h2>
        <div className="lc-subtitle">Proveri pin na mapi i potvrdi adresu.</div>
        <div className="lc-address">
          {formatAddressDisplay(currentAddress)}
        </div>
        <div className="lc-map">
          <div className="lc-map-frame" ref={mapRef} />
        </div>
        {!pinInZone && (
          <div className="lc-zone-warning">
            Pin je van zone dostave. Pomeri ga unutar zone.
          </div>
        )}
        <button
          className="lc-confirm"
          type="button"
          disabled={!pinInZone}
          onClick={() => {
            if (!currentCoords || !currentAddress) return;
            onConfirm({ address: currentAddress, ...currentCoords });
          }}
        >
          Potvrdi lokaciju dostave
        </button>
      </div>
    </div>
  );
}

export default LocationConfirmModal;
