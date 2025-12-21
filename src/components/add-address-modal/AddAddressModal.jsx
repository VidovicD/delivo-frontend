import { useEffect, useRef, useState } from "react";
import { useAddress } from "../../contexts/AddressContext";

import "./AddAddressModal.css";

function AddAddressModal({ onClose }) {
  const { addAddressFromPlace } = useAddress();

  const inputRef = useRef(null);
  const sessionTokenRef = useRef(null);

  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!window.google?.maps?.places) return;

    sessionTokenRef.current =
      new window.google.maps.places.AutocompleteSessionToken();
  }, []);

  async function handleInput(e) {
    const value = e.target.value;

    if (!value) {
      setSuggestions([]);
      return;
    }

    const response =
      await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
        {
          input: value,
          sessionToken: sessionTokenRef.current,
          includedRegionCodes: ["RS"],
        }
      );

    setSuggestions(response.suggestions || []);
  }

  async function handleSelect(suggestion) {
    const place = suggestion.placePrediction.toPlace();

    await place.fetchFields({
      fields: ["formattedAddress", "location"],
    });

    if (!place.formattedAddress || !place.location) return;

    const address = place.formattedAddress;
    const lat = place.location.lat();
    const lng = place.location.lng();

    await addAddressFromPlace({ address, lat, lng });

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
