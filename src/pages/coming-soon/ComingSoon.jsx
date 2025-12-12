import React from "react";
import "./ComingSoon.css";

import hrana from "../../assets/hrana.png";
import paket from "../../assets/paket.png";
import kamion from "../../assets/kamion.png";

import FloatingIcons from "../../components/floating-icons/FloatingIcons";

function ComingSoon({ title = "Stranica u izradi!" }) {
  return (
    <div className="coming-soon-page">
      <FloatingIcons
        icons={[paket, hrana, kamion]}
        density="high"
        size="large"
        variant="soft"
      />

      <h1>{title}</h1>
      <p>Ova stranica je trenutno u izradi. Uskoro će biti dostupna.</p>
    </div>
  );
}

export default ComingSoon;
