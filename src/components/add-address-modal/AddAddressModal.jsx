import { useEffect, useRef, useState } from "react";
import { useAddress } from "../../contexts/AddressContext";
import { loadGoogleMaps } from "../../utils/loadGoogleMaps";

import "./AddAddressModal.css";

function AddAddressModal({ onClose }) {
  const { addAddressFromPlace } = useAddress();

  const inputRef = useRef(null);
  const sessionTokenRef = useRef(null);

  const [mapsReady, setMapsReady] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    loadGoogleMaps().then(() => {
      sessionTokenRef.current =
        new window.google.maps.places.AutocompleteSessionToken();
      setMapsReady(true);
    });
  }, []);

  async function handleInput(e) {
    if (!mapsReady) return;

    const value = e.target.value;

    if (!value) {
      setSuggestions([]);
      return;
    }

    const { suggestions } =
      await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
        {
          input: value,
          sessionToken: sessionTokenRef.current,
          includedRegionCodes: ["RS"],
        }
      );

    setSuggestions(suggestions || []);
  }

  async function handleSelect(suggestion) {
    if (!mapsReady) return;

    const place = suggestion.placePrediction.toPlace();

    await place.fetchFields({
      fields: ["formattedAddress", "location"],
    });

    if (!place.formattedAddress || !place.location) return;

    await addAddressFromPlace({
      address: place.formattedAddress,
      lat: place.location.lat(),
      lng: place.location.lng(),
    });

    onClose();
  }

  return (
    <div className="aa-overlay">
      <div className="aa-modal">
        <h2>Dodavanje adrese</h2>

        <div className="aa-search">
          <input
            ref={inputRef}
            className="aa-input"
            placeholder="Unesite adresu…"
            onChange={handleInput}
            autoComplete="off"
            disabled={!mapsReady}
          />

          {suggestions.length > 0 && (
            <div className="aa-suggestions">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(s)}
                >
                  {s.placePrediction.text.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddAddressModal;
