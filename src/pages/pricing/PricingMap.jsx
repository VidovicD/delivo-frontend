import React from "react";
import "./PricingMap.css";

import FloatingIcons from "../../components/floating-icons/FloatingIcons";

import paket from "../../assets/paket.png";
import hrana from "../../assets/hrana.png";
import kamion from "../../assets/kamion.png";
import mapafull from "../../assets/mapafull.png";

function PricingMap() {
  return (
    <section className="pricing-map-section">
      <FloatingIcons
        icons={[paket, hrana, kamion]}
        density="low"
        size="large"
        variant="soft"
      />

      <div className="pricing-map-wrapper">
        <img
          src={mapafull}
          alt="Mapa zona dostave"
          className="pricing-map-img"
        />
      </div>
    </section>
  );
}

export default PricingMap;
