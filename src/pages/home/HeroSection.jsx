import React from "react";
import "./HeroSection.css";

import logo from "../../assets/logo.png";
import paket from "../../assets/paket.png";
import hrana from "../../assets/hrana.png";
import kamion from "../../assets/kamion.png";
import pin from "../../assets/pin.png";
import magnifier from "../../assets/magnifier.png";

import { useNavigate } from "react-router-dom";
import FloatingIcons from "../../components/floating-icons/FloatingIcons";

function HeroSection() {
  const navigate = useNavigate();

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

          <input
            type="text"
            className="hero__search-input"
            placeholder="Unesite adresu isporuke..."
          />

          <button
            className="hero__search-button"
            onClick={() => navigate("/zakazivanje")}
          >
            <img
              src={magnifier}
              alt="Pretraga"
              className="hero__search-magnifier"
            />
          </button>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
