import React from "react";
import "./PricingSection.css";

import FloatingIcons from "../../components/floating-icons/FloatingIcons";

import paket from "../../assets/paket.png";
import hrana from "../../assets/hrana.png";
import kamion from "../../assets/kamion.png";

function PricingSection({ scrollToZone }) {
  return (
    <section className="pricing">
      <FloatingIcons
        icons={[paket, hrana, kamion]}
        density="low"
        size="large"
        variant="soft"
      />

      <div className="pricing-section">
        <p className="pricing-section__title">Cenovnik</p>

        <p className="pricing-section__description">
          Cene dostave po zonama i dodatne informacije o uslugama
        </p>

        <div className="pricing-section__zones">
          <div className="pricing-zone" onClick={() => scrollToZone(1)}>
            <span>Zona I</span>
            <span>300 RSD</span>
          </div>

          <div className="pricing-zone" onClick={() => scrollToZone(2)}>
            <span>Zona II</span>
            <span>500 RSD</span>
          </div>

          <div className="pricing-zone" onClick={() => scrollToZone(3)}>
            <span>Zona III</span>
            <span>700 RSD</span>
          </div>
        </div>

        <div className="pricing-section__note">
          <p>Napomena:</p>
          <ul>
            <li>Cena se računa po zoni polazne lokacije i zoni odredišta.</li>
            <li>Ako su zone različite, primenjuje se cena veće zone.</li>
            <li>Cene važe za standardne porudžbine.</li>
            <li>Plaćanje je moguće svim platnim karticama.</li>
            <li>Pošiljke preko 20 kg naplaćuju se dodatno.</li>
            <li>Za pravna lica postoje posebne pogodnosti.</li>
          </ul>

          <p className="pricing-section__date">
            Cenovnik važi do 31. decembra 2026.
          </p>
        </div>
      </div>
    </section>
  );
}

export default PricingSection;
