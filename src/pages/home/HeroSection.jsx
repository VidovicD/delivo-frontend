import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAddress } from "../../contexts/AddressContext";
import { loadMapbox } from "../../utils/loadMapbox";
import { fetchMapboxSuggestions } from "../../utils/mapboxGeocoding";
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

import FloatingIcons from "../../components/floating-icons/FloatingIcons";

function HeroSection() {
  const navigate = useNavigate();
  const { addAddressFromPlace } = useAddress();

  const inputRef = useRef(null);
  const requestRef = useRef(0);
  const debounceRef = useRef(null);
  const cacheRef = useRef(new Map());
  const cacheTtlMs = 5 * 60 * 1000;

  const [mapsReady, setMapsReady] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [addressError, setAddressError] = useState("");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const visibleSuggestions = suggestions.filter((s) => {
    const name = `${s.display_name || ""} ${s.place_name || ""}`.toLowerCase();
    return !name.includes("obilaznica");
  });

  useEffect(() => {
    loadMapbox()
      .then(() => setMapsReady(true))
      .catch(() => setMapsReady(false));
  }, []);

  function handleInput(e) {
    if (!mapsReady) return;

    const rawValue = e.target.value;
    const value = toLatin(rawValue);
    setAddressError("");

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

          <div className="hero__search">
            <img src={pin} alt="" className="hero__search-pin" />

            <input
              ref={inputRef}
              className="hero__search-input"
              placeholder="Unesite adresu isporuke…"
              onChange={handleInput}
              autoComplete="off"
              disabled={!mapsReady}
            />

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

            {loadingSuggestions &&
              visibleSuggestions.length === 0 &&
              !addressError && (
              <div className="hero__suggestions">
                <button type="button" disabled>
                  Trazim adrese...
                </button>
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
    </section>
  );
}

export default HeroSection;

