import { useState } from "react";
import { Autocomplete } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";

import "./HeroSection.css";

import logo from "../../assets/logo.png";
import paket from "../../assets/paket.png";
import hrana from "../../assets/hrana.png";
import kamion from "../../assets/kamion.png";
import pin from "../../assets/pin.png";

import FloatingIcons from "../../components/floating-icons/FloatingIcons";

function HeroSection() {
  const navigate = useNavigate();
  const [autocomplete, setAutocomplete] = useState(null);
  const [address, setAddress] = useState("");

  const onPlaceChanged = () => {
    if (!autocomplete) return;

    const formatted = autocomplete.getPlace()?.formatted_address;
    if (!formatted) return;

    navigate(`/restaurants?address=${encodeURIComponent(formatted)}`);
  };

  return (
    <section className="home">
      <section className="hero">
        <div className="hero__background">
          <FloatingIcons icons={[paket, hrana, kamion]} />
        </div>

        <div className="hero__content">
          <img src={logo} alt="Delivo logo" className="hero__logo" />

          {/* TAGLINE */}
          <div className="hero__tagline">
            <h1>DELIVO</h1>
            <p>Isporuka bez čekanja.</p>
          </div>

          {/* SEARCH */}
          <div className="hero__search">
            <img src={pin} alt="" className="hero__search-pin" />

            <Autocomplete
              onLoad={setAutocomplete}
              onPlaceChanged={onPlaceChanged}
              options={{
                types: ["address"],
                componentRestrictions: { country: "rs" },
                strictBounds: true,
                bounds: {
                  north: 45.3,
                  south: 45.2,
                  east: 19.95,
                  west: 19.75,
                },
              }}
            >
              <input
                className="hero__search-input"
                placeholder="Unesite adresu isporuke..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Autocomplete>
          </div>
        </div>
      </section>

      <section className="home__next"></section>
    </section>
  );
}

export default HeroSection;
