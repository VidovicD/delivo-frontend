import React, { useState, useEffect } from 'react';
import './Zakazivanje.css';
import hrana from '../assets/hrana.png';
import paket from '../assets/paket.png';
import kamion from '../assets/kamion.png';

const iconsArray = [paket, hrana, kamion];

function Zakazivanje({ fullPage = false }) {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [formData, setFormData] = useState({
    imePrezime: '',
    email: '',
    telefon: '',
    ulica: '',
    brojZgrade: '',
    sprat: '',
    stan: '',
    napomena: '',
    porudzbina: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const generatePositions = (count) => {
      const positions = [];
      const minDistance = windowWidth < 768 ? 10 : 5;
      let attempts = 0;

      while (positions.length < count && attempts < count * 20) {
        const top = Math.random() * 100;
        const left = Math.random() * 100;

        const isFar = positions.every(
          (pos) => Math.abs(pos.top - top) > minDistance && Math.abs(pos.left - left) > minDistance
        );

        if (isFar) {
          positions.push({
            top,
            left,
            size: Math.random() * 30 + 30,
            opacity: 0.04 + Math.random() * 0.04,
            floatDuration: 3 + Math.random() * 3
          });
        }
        attempts++;
      }

      return positions;
    };

    setPositions(generatePositions(15));
  }, [windowWidth]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'telefon') {
      if (value === '' || /^[+]?[0-9]*$/.test(value)) {
        setFormData({ ...formData, [name]: value });
        if (value.trim() !== '') setErrors({ ...errors, [name]: '' });
      }
    } else {
      setFormData({ ...formData, [name]: value });
      if (value.trim() !== '') setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.imePrezime.trim()) newErrors.imePrezime = "Ime i prezime je obavezno!";
    if (!formData.email.trim()) newErrors.email = "Email je obavezan!";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Unesite validan email!";
    
    if (!formData.telefon.trim()) newErrors.telefon = "Broj telefona je obavezan!";
    else if (!/^\+?[0-9]{6,15}$/.test(formData.telefon)) newErrors.telefon = "Unesite validan broj telefona!";

    if (!formData.ulica.trim()) newErrors.ulica = "Ulica je obavezna!";
    if (!formData.brojZgrade.trim()) newErrors.brojZgrade = "Broj ulice je obavezan!";

    if (!formData.porudzbina.trim()) newErrors.porudzbina = "Detalji porudžbine su obavezni!";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    console.log("Podaci poslati:", formData);
    setSubmitted(true);
    setFormData({
      imePrezime: '',
      email: '',
      telefon: '',
      ulica: '',
      brojZgrade: '',
      sprat: '',
      stan: '',
      napomena: '',
      porudzbina: ''
    });
    setErrors({});
  };

  return (
    <div className={`Zakazivanje ${fullPage ? 'fullPage' : ''}`}>
      {positions.map((pos, i) => {
        const icon = iconsArray[i % iconsArray.length];
        return (
          <img
            key={i}
            src={icon}
            alt={`icon-${i}`}
            className="icon"
            style={{
              top: `${pos.top}%`,
              left: `${pos.left}%`,
              width: `${pos.size}px`,
              height: `${pos.size}px`,
              opacity: pos.opacity,
              animationDuration: `${pos.floatDuration}s`,
              zIndex: 1
            }}
          />
        );
      })}

      <div className="contactFormWrapper">
        {!submitted ? (
          <form className="contactForm" onSubmit={handleSubmit}>
            <h2>Zakažite kurira ili pošaljite upit</h2>
            <h3>Popunite formular i naš tim će Vas uskoro kontaktirati.</h3>

            <label>Ime i prezime*</label>
            <input type="text" name="imePrezime" placeholder="Vaše ime i prezime" value={formData.imePrezime} onChange={handleChange} />
            {errors.imePrezime && <span className="error">{errors.imePrezime}</span>}

            <label>Email*</label>
            <input type="text" name="email" placeholder="primer@email.com" value={formData.email} onChange={handleChange} />
            {errors.email && <span className="error">{errors.email}</span>}

            <label>Broj telefona*</label>
            <input type="tel" name="telefon" placeholder="+381601234567" value={formData.telefon} onChange={handleChange} />
            {errors.telefon && <span className="error">{errors.telefon}</span>}

            <label>Ulica*</label>
            <input type="text" name="ulica" placeholder="Primer: Nemanjina" value={formData.ulica} onChange={handleChange} />
            {errors.ulica && <span className="error">{errors.ulica}</span>}

            <div className="addressRow">
              <div className="addressField">
                <label>Broj ulice*</label>
                <input type="text" name="brojZgrade" placeholder="Primer: 15" value={formData.brojZgrade} onChange={handleChange} />
                {errors.brojZgrade && <span className="error">{errors.brojZgrade}</span>}
              </div>

              <div className="addressField">
                <label>Sprat</label>
                <input type="text" name="sprat" placeholder="Primer: 3" value={formData.sprat} onChange={handleChange} />
              </div>

              <div className="addressField">
                <label>Stan</label>
                <input type="text" name="stan" placeholder="Primer: 12" value={formData.stan} onChange={handleChange} />
              </div>
            </div>

            <label>Dodatne napomene</label>
            <textarea name="napomena" placeholder="Ako imate napomene..." value={formData.napomena} onChange={handleChange} rows="3"></textarea>

            <label>Detalji porudžbine*</label>
            <textarea name="porudzbina" placeholder="Želeo/la bih da poručim iz restorana..." value={formData.porudzbina} onChange={handleChange} rows="6"></textarea>
            {errors.porudzbina && <span className="error">{errors.porudzbina}</span>}

            <button type="submit">Pošalji upit</button>
          </form>
        ) : (
          <div className="contactFormMessage">
            <h3>Vaš upit je uspešno poslat!</h3>
            <p>Hvala Vam na poverenju. Javićemo Vam se uskoro.</p>
            <p><strong>Radno vreme: Pon - Ned, 10:00 – 23:00</strong></p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Zakazivanje;
