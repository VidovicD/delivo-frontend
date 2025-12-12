import React, { useEffect, useState } from "react";
import "./LegalPage.css";

import paket from "../../assets/paket.png";
import hrana from "../../assets/hrana.png";
import kamion from "../../assets/kamion.png";

import FloatingIcons from "../../components/floating-icons/FloatingIcons";

const iconsArray = [paket, hrana, kamion];

function LegalPage() {
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [closing, setClosing] = useState(false);
  const [closingSuccess, setClosingSuccess] = useState(false);

  const [shake, setShake] = useState(false);

  const [userType, setUserType] = useState("fizicko");

  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    company: "",
    pib: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setErrors({});
    if (userType === "fizicko") {
      setForm((prev) => ({
        ...prev,
        company: "",
        pib: "",
      }));
    }
  }, [userType]);

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Ime je obavezno!";
    if (!form.email.trim()) newErrors.email = "Email je obavezan!";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Unesite validan email!";

    if (!form.message.trim()) newErrors.message = "Poruka je obavezna!";

    if (userType === "pravno") {
      if (!form.company.trim()) newErrors.company = "Naziv firme je obavezan!";
      if (!form.pib.trim()) newErrors.pib = "PIB je obavezan!";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    setClosing(true);
    setTimeout(() => {
      setShowModal(false);
      setClosing(false);
      setTimeout(() => setShowSuccess(true), 100);
    }, 200);

    setForm({
      name: "",
      email: "",
      message: "",
      company: "",
      pib: "",
    });

    setErrors({});
  };

  const closeModal = () => {
    setClosing(true);
    setTimeout(() => {
      setShowModal(false);
      setClosing(false);
      setErrors({});
    }, 200);
  };

  const closeSuccess = () => {
    setClosingSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setClosingSuccess(false);
    }, 200);
  };

  return (
    <div className="legal-page">
      <FloatingIcons icons={iconsArray} density="normal" variant="soft" />

      <div className="legal-box legal-box--full">
        <h1>Usluge za pravna lica</h1>

        <p className="legal-intro">
          Delivo pruža profesionalne usluge dostave, logistike i kurirskih servisa namenjene pravnim licima.
          Bilo da vam je potrebna svakodnevna dostava, transport robe ili specijalni poslovni aranžmani — naš tim vam stoji na raspolaganju svakog dana.
        </p>

        <div className="legal-list">
          <p>✔ Brza i pouzdana dostava svakog dana</p>
          <p>✔ Posebne cene i mesečni paketi</p>
          <p>✔ Fakturisanje i kompletna poslovna dokumentacija</p>
          <p>✔ Transport hrane, paketa i proizvoda</p>
          <p>✔ Rešenja prilagođena biznis potrebama</p>
        </div>

        <div className="legal-contact">
          <p><strong>Kontakt:</strong></p>
          <p>Email: info@delivo.com</p>
          <p>Telefon: +381 61 180 180 0</p>
          <p>Radno vreme: Pon - Ned, 10:00 – 23:00</p>
        </div>
      </div>

      <div className="legal-row">
        <div className="legal-box legal-box--half">
          <h2>Kako izgleda saradnja?</h2>

          <div className="legal-steps">
            <div>
              <h3>1. Pošaljite upit</h3>
              <p>Dostavite nam osnovne informacije o vašem poslovanju.</p>
            </div>

            <div>
              <h3>2. Pripremamo ponudu</h3>
              <p>Kreiramo personalizovanu cenu i model saradnje.</p>
            </div>

            <div>
              <h3>3. Početak saradnje</h3>
              <p>Potpisujemo ugovor i započinjemo realizaciju saradnje.</p>
            </div>
          </div>
        </div>

        <div className="legal-box legal-box--half">
          <h2>Za koga je namenjeno?</h2>

          <div className="legal-target">
            <p>Ugostiteljski objekti (restorani, kafići, ketering servisi)</p>
            <p>Maloprodajni lanci i specijalizovane prodavnice</p>
            <p>E-commerce brendovi i online prodavnice</p>
            <p>Magacini, distributivni centri i veleprodaje</p>
            <p>Proizvodne i distributivne kompanije</p>
            <p>Mikro, mala, srednja i velika preduzeća</p>
            <p>Prodavnice auto-delova</p>
            <p>Servisi i profesionalne radionice</p>
            <p>Apoteke, drogerije i prodavnice medicinske opreme</p>
          </div>
        </div>
      </div>

      <button className="legal-btn" onClick={() => setShowModal(true)}>
        Pošaljite upit
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className={`modal-box ${closing ? "closing" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`modal-inner ${shake ? "shake" : ""}`}>
              <h2>Pošaljite upit</h2>

              <div className="user-type-toggle">
                <button
                  type="button"
                  className={userType === "fizicko" ? "active" : ""}
                  onClick={() => setUserType("fizicko")}
                >
                  👤 Fizičko lice
                </button>

                <button
                  type="button"
                  className={userType === "pravno" ? "active" : ""}
                  onClick={() => setUserType("pravno")}
                >
                  🏢 Pravno lice
                </button>
              </div>

              <form className="modal-form" onSubmit={handleSubmit} noValidate>
                <input
                  type="text"
                  placeholder="Vaše ime"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                {errors.name && <span className="error">{errors.name}</span>}

                {userType === "pravno" && (
                  <>
                    <input
                      type="text"
                      placeholder="Naziv firme"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                    />
                    {errors.company && <span className="error">{errors.company}</span>}

                    <input
                      type="text"
                      placeholder="PIB"
                      value={form.pib}
                      onChange={(e) => setForm({ ...form, pib: e.target.value })}
                    />
                    {errors.pib && <span className="error">{errors.pib}</span>}
                  </>
                )}

                <input
                  type="email"
                  placeholder="Email adresa"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {errors.email && <span className="error">{errors.email}</span>}

                <textarea
                  placeholder="Vaša poruka"
                  rows="4"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
                {errors.message && <span className="error">{errors.message}</span>}

                <button type="submit" className="modal-send-btn">
                  Pošalji
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="modal-overlay" onClick={closeSuccess}>
          <div
            className={`success-box ${closingSuccess ? "closing" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="success-check">
              <svg viewBox="0 0 52 52">
                <path
                  className="checkmark__path"
                  fill="none"
                  d="M14 27 l10 10 l15 -20"
                />
              </svg>
            </div>

            <h2>Vaš upit je uspešno poslat!</h2>
            <p>Hvala Vam na poverenju. Javićemo Vam se uskoro.</p>
            <p><strong>Radno vreme: Pon - Ned, 10:00 – 23:00</strong></p>

            <button className="success-btn" onClick={closeSuccess}>
              Zatvori
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LegalPage;
