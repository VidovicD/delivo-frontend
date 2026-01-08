import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAddress } from "../../contexts/AddressContext";
import { loadMapbox } from "../../utils/loadMapbox";
import {
  fetchMapboxSuggestions,
  reverseMapboxGeocode,
} from "../../utils/mapboxGeocoding";
import {
  isPointInDeliveryZone,
  matchesNoviSadArea,
  formatAddressDisplay,
  toLatin,
} from "../../utils/addressValidation";

import "./HeroSection.css";

import logo from "../../assets/logobt.png";
import paket from "../../assets/paket.png";
import hrana from "../../assets/hrana.png";
import kamion from "../../assets/kamion.png";
import pin from "../../assets/pin.png";
import mylocation from "../../assets/mylocation.svg";
import closeIcon from "../../assets/close.svg";

import FloatingIcons from "../../components/floating-icons/FloatingIcons";
import LocationConfirmModal from "../../components/location-confirm-modal/LocationConfirmModal";
import LocationErrorModal from "../../components/location-error-modal/LocationErrorModal";

function HeroSection() {
  const navigate = useNavigate();
  const { addAddressFromPlace } = useAddress();

  const inputRef = useRef(null);
  const searchRef = useRef(null);
  const requestRef = useRef(0);
  const debounceRef = useRef(null);
  const cacheRef = useRef(new Map());
  const geoWatchRef = useRef(null);
  const geoTimeoutRef = useRef(null);
  const cacheTtlMs = 5 * 60 * 1000;

  const [mapsReady, setMapsReady] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [addressError, setAddressError] = useState("");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationModalData, setLocationModalData] = useState(null);
  const [locationErrorOpen, setLocationErrorOpen] = useState(false);
  const [locationErrorMessage, setLocationErrorMessage] = useState("");
  const [locationErrorKey, setLocationErrorKey] = useState(0);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const visibleSuggestions = suggestions.filter((s) => {
    const name = `${s.display_name || ""} ${s.place_name || ""}`.toLowerCase();
    return !name.includes("obilaznica");
  });

  useEffect(() => {
    if (!isMobileSearchOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("is-mobile-search-open");
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove("is-mobile-search-open");
    };
  }, [isMobileSearchOpen]);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.value = "";
    setSuggestions([]);
    setAddressError("");
    setLoadingSuggestions(false);
  }, [isMobileSearchOpen]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 480px)");
    const handleChange = () => {
      setIsMobileViewport(media.matches);
      if (media.matches) {
        if (!inputRef.current) return;
        inputRef.current.value = "";
        setSuggestions([]);
        setAddressError("");
        setLoadingSuggestions(false);
        return;
      }
      if (isMobileSearchOpen) {
        setIsMobileSearchOpen(false);
      }
    };
    handleChange();
    if (media.addEventListener) {
      media.addEventListener("change", handleChange);
    } else {
      media.addListener(handleChange);
    }
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", handleChange);
      } else {
        media.removeListener(handleChange);
      }
    };
  }, [isMobileSearchOpen]);

  useEffect(() => {
    if (!isMobileViewport) return;
    if (!inputRef.current) return;
    if (isMobileSearchOpen) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
      return;
    }
    inputRef.current.blur();
  }, [isMobileSearchOpen, isMobileViewport]);

  useEffect(() => {
    loadMapbox()
      .then(() => setMapsReady(true))
      .catch(() => setMapsReady(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (!searchRef.current) return;
      if (searchRef.current.contains(e.target)) return;
      setSuggestions([]);
      setAddressError("");
      setLoadingSuggestions(false);
      setIsLocating(false);
      stopGeoWatch();
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInput(e) {
    if (!mapsReady) return;

    const rawValue = e.target.value;
    const value = toLatin(rawValue);
    setAddressError("");
    setIsLocating(false);

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

  function handleInputFocus() {
    if (!inputRef.current) return;
    if (isMobileViewport && !isMobileSearchOpen) {
      setIsMobileSearchOpen(true);
      inputRef.current.blur();
      return;
    }
    handleInput({ target: { value: inputRef.current.value } });
  }

  function handleInputPointerDown(e) {
    if (!isMobileViewport || isMobileSearchOpen) return;
    e.preventDefault();
    if (inputRef.current) {
      inputRef.current.blur();
    }
    setIsMobileSearchOpen(true);
  }

  function stopGeoWatch() {
    if (geoWatchRef.current !== null) {
      navigator.geolocation.clearWatch(geoWatchRef.current);
      geoWatchRef.current = null;
    }
    if (geoTimeoutRef.current) {
      clearTimeout(geoTimeoutRef.current);
      geoTimeoutRef.current = null;
    }
  }

  function showLocationError(message) {
    setLocationErrorMessage(message);
    setLocationErrorKey((prev) => prev + 1);
    setLocationErrorOpen(true);
  }

  async function handleUseLocation() {
    if (!mapsReady) return;

    stopGeoWatch();

    setLoadingSuggestions(true);
    setIsLocating(true);

    if (!navigator.geolocation) {
      setLoadingSuggestions(false);
      setIsLocating(false);
      return;
    }

    let bestAccuracy = Infinity;
    let gotFirst = false;

    const applyCoords = async (coords) => {
      const lat = coords?.latitude;
      const lng = coords?.longitude;
      if (typeof lat !== "number" || typeof lng !== "number") {
        return false;
      }
      if (!isPointInDeliveryZone({ lat, lng })) {
        showLocationError("Dostava nije dostupna na ovoj lokaciji.");
        return false;
      }

      const placeName = await reverseMapboxGeocode({ lng, lat });
      if (!placeName) {
        return false;
      }

      setSuggestions([]);
      setLocationModalData({ address: placeName, lat, lng });
      setLocationModalOpen(true);
      return true;
    };

    const finishWithError = () => {
      showLocationError("Lokacija nije dostupna.");
      setLoadingSuggestions(false);
      setIsLocating(false);
      stopGeoWatch();
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = pos?.coords;
        const accuracy =
          typeof coords?.accuracy === "number" ? coords.accuracy : Infinity;
        bestAccuracy = accuracy;

        const applied = await applyCoords(coords);
        if (applied) {
          gotFirst = true;
          setLoadingSuggestions(false);
          setIsLocating(false);
        }

        geoWatchRef.current = navigator.geolocation.watchPosition(
          async (nextPos) => {
            const nextCoords = nextPos?.coords;
            const nextAccuracy =
              typeof nextCoords?.accuracy === "number"
                ? nextCoords.accuracy
                : Infinity;
            if (nextAccuracy >= bestAccuracy) return;
            bestAccuracy = nextAccuracy;
            await applyCoords(nextCoords);
          },
          () => {
            if (!gotFirst) {
              finishWithError();
            }
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );

        geoTimeoutRef.current = setTimeout(() => {
          if (geoWatchRef.current !== null) {
            navigator.geolocation.clearWatch(geoWatchRef.current);
            geoWatchRef.current = null;
          }
          if (!gotFirst) {
            finishWithError();
          }
        }, 5000);
      },
      finishWithError,
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }

  async function handleSelect(suggestion) {
    if (!mapsReady) return;

    if (!suggestion?.place_name || !suggestion?.center) return;

    stopGeoWatch();
    setIsMobileSearchOpen(false);

    if (
      !isPointInDeliveryZone({
        lat: suggestion.center.lat,
        lng: suggestion.center.lng,
      })
    ) {
      setAddressError("Dostava je dostupna samo u zoni dostave.");
      setSuggestions([]);
      return;
    }

    await addAddressFromPlace({
      address: suggestion.place_name,
      lat: suggestion.center.lat,
      lng: suggestion.center.lng,
    });

    navigate("/explore", { replace: true });
  }

  return (
    <section className="home">
      <section className="hero">
        <div className="hero__background">
          <FloatingIcons icons={[paket, hrana, kamion]} />
        </div>

        <div className="hero__content">
          <img src={logo} alt="Delivo logo" className="hero__logo" />

          <div className="hero__tagline">
            <h1>Sve na jednom mestu.</h1>
            <p>Dostava svega što vam je potrebno.</p>
          </div>

          <div
            className={`hero__search${
              isMobileSearchOpen ? " hero__search--fullscreen" : ""
            }`}
            ref={searchRef}
            data-loading={loadingSuggestions}
            data-locating={isLocating}
          >
            <button
              className="hero__search-cancel"
              type="button"
              onClick={() => setIsMobileSearchOpen(false)}
              aria-label="Zatvori"
            >
              <img src={closeIcon} alt="" />
            </button>
            <div className="hero__search-row">
              <div className="hero__search-field">
                <img src={pin} alt="" className="hero__search-pin" />
                <input
                  ref={inputRef}
                  className="hero__search-input"
                  placeholder="Unesite adresu isporuke"
                  onChange={handleInput}
                  onFocus={handleInputFocus}
                  onPointerDown={handleInputPointerDown}
                  readOnly={isMobileViewport && !isMobileSearchOpen}
                  tabIndex={isMobileViewport && !isMobileSearchOpen ? -1 : 0}
                  autoComplete="off"
                  disabled={!mapsReady}
                />
                <button
                  className="hero__search-location"
                  type="button"
                  onClick={handleUseLocation}
                >
                  <img src={mylocation} alt="" />
                </button>
              </div>
            </div>
            <button
              className="hero__search-geo"
              type="button"
              onClick={handleUseLocation}
            >
              <img src={mylocation} alt="" className="hero__search-geo-icon" />
              <span className="hero__search-geo-text">
                <span className="hero__search-geo-title">
                  Koristi trenutnu lokaciju
                </span>
                <span className="hero__search-geo-subtitle">Preporuceno</span>
              </span>
            </button>

            {visibleSuggestions.length > 0 && (
              <div className="hero__suggestions">
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

            {addressError && (
              <div className="hero__suggestions">
                <button type="button" disabled>
                  {addressError}
                </button>
              </div>
            )}
          </div>

          <p className="hero__availability">
            Trenutno dostupno u Novom Sadu.
          </p>
        </div>
      </section>
      <LocationConfirmModal
        isOpen={locationModalOpen}
        address={locationModalData?.address}
        coords={
          locationModalData
            ? { lat: locationModalData.lat, lng: locationModalData.lng }
            : null
        }
        onClose={() => {
          setLocationModalOpen(false);
          stopGeoWatch();
        }}
        onConfirm={async ({ address, lat, lng }) => {
          await addAddressFromPlace({ address, lat, lng });
          setLocationModalOpen(false);
          navigate("/explore", { replace: true });
        }}
      />
      <LocationErrorModal
        key={locationErrorKey}
        isOpen={locationErrorOpen}
        message={locationErrorMessage}
        onClose={() => {
          setLocationErrorOpen(false);
          setLocationErrorMessage("");
        }}
      />
    </section>
  );
}

export default HeroSection;






