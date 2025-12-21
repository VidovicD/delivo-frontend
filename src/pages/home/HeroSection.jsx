import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAddress } from "../../contexts/AddressContext";

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
            />

            {suggestions.length > 0 && (
              <div className="hero__suggestions">
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

          <p className="hero__availability">
            Trenutno dostupno u Novom Sadu.
          </p>
        </div>
      </section>
    </section>
  );
}

export default HeroSection;
