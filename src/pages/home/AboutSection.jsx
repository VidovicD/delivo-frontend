import React from "react";
import "./AboutSection.css";

import paket from "../../assets/paket.png";
import hrana from "../../assets/hrana.png";
import kamion from "../../assets/kamion.png";

import FloatingIcons from "../../components/floating-icons/FloatingIcons";

function AboutSection() {
  return (
    <section className="about">
      <FloatingIcons
        icons={[paket, hrana, kamion]}
        density="low"
        size="large"
        variant="soft"
      />

      <h2 className="about__title">Ukratko o nama</h2>

      <p className="about__text">
        <strong>Delivo</strong> je pouzdana i brza kurirska služba u{" "}
        <strong>Novom Sadu i okolini</strong>.
        <br /><br />
        Dostavljamo pakete, hranu, dokumenta i robu svakodnevne potrebe – brzo,
        sigurno i bez komplikacija.
        <br /><br />
        Koristimo ekološka vozila i električne bicikle i sarađujemo sa pravnim
        licima, nudeći fleksibilna rešenja za moderno poslovanje.
      </p>
    </section>
  );
}

export default AboutSection;
