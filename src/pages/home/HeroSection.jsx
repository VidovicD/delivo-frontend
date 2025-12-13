import React, { useState } from "react";
import { Autocomplete } from "@react-google-maps/api";

import "./HeroSection.css";

import logo from "../../assets/logo.png";
import paket from "../../assets/paket.png";
import hrana from "../../assets/hrana.png";
import kamion from "../../assets/kamion.png";
import pin from "../../assets/pin.png";

import { useNavigate } from "react-router-dom";
import FloatingIcons from "../../components/floating-icons/FloatingIcons";

function HeroSection() {
  const navigate = useNavigate();
  const [autocomplete, setAutocomplete] = useState(null);
  const [address, setAddress] = useState("");

  const onLoad = (auto) => {
    setAutocomplete(auto);
  };

  const onPlaceChanged = () => {
    if (!autocomplete) return;

    const place = autocomplete.getPlace();

    // formatted address
    const formatted = place?.formatted_address;

    // lat/lng ćemo koristiti kasnije (Supabase)

    if (!formatted) return;

    navigate(
      `/restaurants?address=${encodeURIComponent(formatted)}`
    );

  };

  return (
    <section className="hero">
      <FloatingIcons
        icons={[paket, hrana, kamion]}
        density="high"
        size="large"
        variant="soft"
      />

      <div className="hero__logo-wrapper">
        <img
          src={logo}
          alt="Delivo logo"
          className="hero__logo"
        />
      </div>

      <div className="hero__cta">
        <div className="hero__search">
          <img
            src={pin}
            alt="Lokacija"
            className="hero__search-pin"
          />

        <Autocomplete
          onLoad={onLoad}
          onPlaceChanged={onPlaceChanged}
          options={{
            types: ["address"],
            componentRestrictions: { country: "rs" },

            // grubo ograničenje na Novi Sad (bounds)
            bounds: {
              north: 45.30,
              south: 45.20,
              east: 19.95,
              west: 19.75,
            },
            strictBounds: true,
          }}
        >
          <input
            type="text"
            className="hero__search-input"
            placeholder="Unesite adresu isporuke..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Autocomplete>

        </div>
      </div>
    </section>
  );
}

export default HeroSection;
