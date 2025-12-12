import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

import FacebookIcon from "../../assets/facebook.png";
import InstagramIcon from "../../assets/instagram.png";
import TikTokIcon from "../../assets/tiktok.png";
import ViberIcon from "../../assets/viber.png";
import WhatsAppIcon from "../../assets/whatsapp.png";
import FooterLogo from "../../assets/TRANSPARENT.png";

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const Footer = () => {
  const [openSection, setOpenSection] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1400);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1400);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSection = (section) => {
    if (!isMobile) return;
    setOpenSection(openSection === section ? null : section);
  };

  const handleLinkClick = (callback) => {
    if (isMobile) setOpenSection(null);
    if (callback) callback();
  };

  return (
    <footer>
      <div className="footer-top">
        <div className="footer-columns-wrapper">

          {/* Kontakt */}
          <div className="footer-column">
            <h4
              className={openSection === "kontakt" ? "active" : ""}
              onClick={() => toggleSection("kontakt")}
            >
              Kontakt
            </h4>
            <div
              className={`footer-content ${
                isMobile && openSection === "kontakt" ? "open" : ""
              }`}
            >
              <p>Email: info@delivo.com</p>
              <p>Tel: +381 61 180 180 0</p>
              <p>Radno vreme: Pon - Ned<br />10h - 23h </p>
              <p>Adresa: Vuka Karadžića BB</p>
            </div>
          </div>

          {/* Linkovi */}
          <div className="footer-column">
            <h4
              className={openSection === "linkovi" ? "active" : ""}
              onClick={() => toggleSection("linkovi")}
            >
              Linkovi
            </h4>
            <div
              className={`footer-content ${
                isMobile && openSection === "linkovi" ? "open" : ""
              }`}
            >
              <ul>
                <li><Link to="/" onClick={() => handleLinkClick(scrollToTop)}>Početna</Link></li>
                <li><Link to="/usluge" onClick={() => handleLinkClick()}>Usluge</Link></li>
                <li><Link to="/cenovnik" onClick={() => handleLinkClick()}>Cenovnik</Link></li>
                <li><Link to="/pravna" onClick={() => handleLinkClick()}>Pravna lica</Link></li>
                <li><Link to="/kontakt" onClick={() => handleLinkClick()}>Kontakt</Link></li>
              </ul>
            </div>
          </div>

          {/* Korisni linkovi */}
          <div className="footer-column">
            <h4
              className={openSection === "korisni" ? "active" : ""}
              onClick={() => toggleSection("korisni")}
            >
              Korisni linkovi
            </h4>
            <div
              className={`footer-content ${
                isMobile && openSection === "korisni" ? "open" : ""
              }`}
            >
              <ul>
                <li><Link to="/blog" onClick={() => handleLinkClick()}>Blog / Novosti</Link></li>
                <li><Link to="/FAQ" onClick={() => handleLinkClick()}>FAQ / Česta pitanja</Link></li>
                <li><Link to="/zaposlenje" onClick={() => handleLinkClick()}>Zaposlenje</Link></li>
                <li><Link to="/politika" onClick={() => handleLinkClick()}>Politika privatnosti</Link></li>
                <li><Link to="/uslovi" onClick={() => handleLinkClick()}>Uslovi korišćenja</Link></li>
              </ul>
            </div>
          </div>

          {/* Društvene mreže */}
          <div className="footer-column">
            <h4
              className={openSection === "drustvene" ? "active" : ""}
              onClick={() => toggleSection("drustvene")}
            >
              Pratite nas
            </h4>
            <div
              className={`footer-content ${
                isMobile && openSection === "drustvene" ? "open" : ""
              }`}
            >
              <div className="social-icons">
                <a href="https://www.viber.com" target="_blank" rel="noopener noreferrer">
                  <img src={ViberIcon} alt="VIBER" />
                </a>
                <a href="https://www.whatsapp.com" target="_blank" rel="noopener noreferrer">
                  <img src={WhatsAppIcon} alt="WHATSAPP" />
                </a>
                <a href="https://www.instagram.com/delivo.rs" target="_blank" rel="noopener noreferrer">
                  <img src={InstagramIcon} alt="INSTAGRAM" />
                </a>
                <a href="https://www.facebook.com/delivo.rs" target="_blank" rel="noopener noreferrer">
                  <img src={FacebookIcon} alt="FACEBOOK" />
                </a>
                <a href="https://www.tiktok.com/delivo.rs" target="_blank" rel="noopener noreferrer">
                  <img src={TikTokIcon} alt="TIKTOK" />
                </a>
              </div>
              {!isMobile && (
                <div className="footer-logo">
                  <Link to="/" onClick={scrollToTop}>
                    <img src={FooterLogo} alt="Logo" />
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {isMobile && (
        <div className="footer-logo-global">
          <Link to="/" onClick={scrollToTop}>
            <img src={FooterLogo} alt="Logo" />
          </Link>
        </div>
      )}

      <div className="footer-bottom">
        &copy; 2025 Delivo | Sva prava zadržana.
      </div>
    </footer>
  );
};

export default Footer;
