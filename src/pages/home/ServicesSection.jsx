import React from "react";
import "./ServicesSection.css";

import mapa from "../../assets/mapa.png";

function ServicesSection() {
  return (
    <section className="services">
      <div className="services__content">
        <h2 className="services__title">Usluge</h2>

        <p className="services__subtitle">
          <strong>Delivo kurirska služba pruža:</strong>
        </p>

        <ul className="services__list">
          <li><strong>Hrana i piće:</strong> Dostava iz restorana direktno na vašu adresu</li>
          <li><strong>Paketi i pošiljke:</strong> Preuzimanje i isporuka svih vrsta pošiljki</li>
          <li><strong>Namirnice i lekovi:</strong> Kupovina i dostava iz marketa i apoteka</li>
          <li><strong>Dokumenti:</strong> Sigurna i brza isporuka dokumenata</li>
          <li><strong>Autodelovi:</strong> Nabavka i dostava delova po broju šasije</li>
        </ul>

        <p className="services__extra">
          U ponudi imamo <strong>Rent a Car</strong> i <strong>Rent a E-bike</strong>.
        </p>

        <p className="services__extra">
          Sarađujemo sa restoranima, prodavnicama i marketima,
          nudeći pouzdana logistička rešenja.
        </p>
      </div>

      <div className="services__map">
        <div className="services__map-wrapper">
          <img src={mapa} alt="Mapa zone dostave" />
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;
