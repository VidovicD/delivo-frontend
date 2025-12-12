import React from "react";
import "./ContactPage.css";
import Zakazivanje from "../Zakazivanje";

import paket from "../../assets/paket.png";
import hrana from "../../assets/hrana.png";
import kamion from "../../assets/kamion.png";

import FloatingIcons from "../../components/floating-icons/FloatingIcons";

function Contact() {
  return (
    <div className="contact-page">
      <FloatingIcons
        icons={[paket, hrana, kamion]}
        density="high"
        size="large"
        variant="soft"
      />

      <div className="contact-columns">
        <div className="left-column">
          <div className="contact-box left-box">
            <h1>Novi Sad</h1>

            <p><strong>Email:</strong> info@delivo.com</p>
            <p><strong>Tel:</strong> +381 61 180 180 0</p>

            <p>
              <strong>Radno vreme:</strong><br />
              Pon - Ned<br />
              10h – 23h
            </p>

            <p><strong>Adresa:</strong> Vuka Karadžića BB</p>
          </div>

          <div className="map-wrapper">
            <iframe
              title="Novi Sad mapa"
              width="100%"
              height="606"
              style={{ border: "0", borderRadius: "15px" }}
              loading="lazy"
              allowFullScreen
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d14149.902094923961!2d19.8373946!3d45.2543359!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0"
            />
          </div>
        </div>

        <div className="contact-box right-box">
          <div className="no-scheduling-bg">
            <Zakazivanje fullPage={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
