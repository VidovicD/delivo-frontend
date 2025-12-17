import { useEffect, useState } from "react";
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

    const place = autocomplete.getPlace();
    const formatted = place?.formatted_address;
    const location = place?.geometry?.location;

    if (!formatted || !location) return;

    const lat = location.lat();
    const lng = location.lng();

    localStorage.setItem("delivery_address", formatted);
    localStorage.setItem("delivery_lat", lat.toString());
    localStorage.setItem("delivery_lng", lng.toString());

    navigate(
      `/restaurants?address=${encodeURIComponent(formatted)}&lat=${lat}&lng=${lng}`,
      { replace: true }
    );
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
            <h1>Bilo kad. Bilo gde. Bilo šta.</h1>
            <p>Gradska dostava - Novi Sad</p>
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
                  autoFocus
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
