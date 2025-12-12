import React from "react";
import "./HeroSection.css";

import logo from "../../assets/logo.png";
import paket from "../../assets/paket.png";
import hrana from "../../assets/hrana.png";
import kamion from "../../assets/kamion.png";

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
        <button
          className="hero__button"
          onClick={() => navigate("/zakazivanje")}
        >
          Zakažite kurira online
        </button>
      </div>
    </section>
  );
}

export default HeroSection;
