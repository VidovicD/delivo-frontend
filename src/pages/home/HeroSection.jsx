import { useState, useEffect } from "react";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";

import "./HeroSection.css";

import logo from "../../assets/logobt.png";
import paket from "../../assets/paket.png";
import hrana from "../../assets/hrana.png";
import kamion from "../../assets/kamion.png";
import pin from "../../assets/pin.png";

import FloatingIcons from "../../components/floating-icons/FloatingIcons";

const LIBRARIES = ["places"];

function HeroSection() {
  const navigate = useNavigate();
  const [autocomplete, setAutocomplete] = useState(null);
  const [address, setAddress] = useState("");

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY,
    libraries: LIBRARIES,
  });

  useEffect(() => {
    const images = [logo, paket, hrana, kamion];
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

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

          <div className="hero__tagline">
            <h1>O čemu danas razmišljaš?</h1>
            <p>Mi smo već krenuli.</p>
          </div>

          <div className="hero__search">
            <img src={pin} alt="" className="hero__search-pin" />

            {isLoaded ? (
              <Autocomplete
                onLoad={setAutocomplete}
                onPlaceChanged={onPlaceChanged}
                options={{
                  types: ["address"],
                  componentRestrictions: { country: "rs" },
                }}
              >
                <input
                  className="hero__search-input"
                  placeholder="Unesite adresu isporuke..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </Autocomplete>
            ) : (
              <input
                className="hero__search-input"
                placeholder="Unesite adresu isporuke..."
                disabled
              />
            )}
          </div>
        </div>
      </section>
    </section>
  );
}

export default HeroSection;
