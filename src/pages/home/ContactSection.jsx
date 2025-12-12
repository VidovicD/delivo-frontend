import React from "react";
import "./ContactSection.css";

import viber from "../../assets/viber.png";
import whatsapp from "../../assets/whatsapp.png";
import instagram from "../../assets/instagram.png";
import facebook from "../../assets/facebook.png";
import tiktok from "../../assets/tiktok.png";

function ContactSection() {
  return (
    <section className="contact">
      <p className="contact__text">Zakaži kurira pozivom na:</p>

      <p className="contact__phone">061/180-180-0</p>

      <p className="contact__text">ili Viber/WhatsApp/SMS</p>

      <div className="contact__socials">
        <a href="https://www.viber.com" target="_blank" rel="noopener noreferrer">
          <img src={viber} alt="Viber" />
        </a>
        <a href="https://www.whatsapp.com" target="_blank" rel="noopener noreferrer">
          <img src={whatsapp} alt="WhatsApp" />
        </a>
        <a href="https://www.instagram.com/delivo.rs" target="_blank" rel="noopener noreferrer">
          <img src={instagram} alt="Instagram" />
        </a>
        <a href="https://www.facebook.com/delivo.rs" target="_blank" rel="noopener noreferrer">
          <img src={facebook} alt="Facebook" />
        </a>
        <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer">
          <img src={tiktok} alt="TikTok" />
        </a>
      </div>
    </section>
  );
}

export default ContactSection;
