import { useEffect, useState } from "react";
import "./MaintenanceOverlay.css";

import logo from "../../assets/logobt.png";
import paket from "../../assets/paket.png";
import hrana from "../../assets/hrana.png";
import kamion from "../../assets/kamion.png";

import FloatingIcons from "../floating-icons/FloatingIcons";

const ACCESS_KEY = "delivo_access_granted";
const ACCESS_PASSWORD = "260424";
const TARGET_DATE = new Date("2026-04-01T00:00:00");

function MaintenanceOverlay() {
  const [password, setPassword] = useState("");
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const interval = setInterval(() => {
      const now = new Date();
      const diff = TARGET_DATE - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  function handleKeyDown(e) {
    if (e.key !== "Enter") return;

    if (password === ACCESS_PASSWORD) {
      localStorage.setItem(ACCESS_KEY, "true");
      window.location.reload();
    }
  }

  return (
    <div className="maintenance-overlay">
      <div className="maintenance-background">
        <FloatingIcons icons={[paket, hrana, kamion]} />
      </div>

      <div className="maintenance-modal">
        <div className="maintenance-top">
          <img src={logo} alt="Delivo logo" className="maintenance-logo" />

          <h1>Delivo uskoro stiže u Novi Sad!</h1>

          <p className="maintenance-text">
            Trenutno završavamo tehničke i operativne pripreme kako bismo
            obezbedili stabilan i pouzdan rad platforme od prvog dana.
          </p>
        </div>

        <div className="maintenance-center">
          <div className="maintenance-timer">
            <div>
              <strong>{timeLeft.days}</strong>
              <span>dana</span>
            </div>
            <div>
              <strong>{timeLeft.hours}</strong>
              <span>sati</span>
            </div>
            <div>
              <strong>{timeLeft.minutes}</strong>
              <span>minuta</span>
            </div>
            <div>
              <strong>{timeLeft.seconds}</strong>
              <span>sekundi</span>
            </div>
          </div>

          <p className="maintenance-date">
            Početak rada: 1. april 2026.
          </p>
        </div>

        <div className="maintenance-bottom">
          <input
            type="password"
            placeholder="Unesite pristupnu šifru"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>

        <p className="visually-hidden">
        Delivo je platforma za dostavu u Novom Sadu. Uskoro dostupno.
        </p>

      </div>
    </div>
  );
}

export default MaintenanceOverlay;

//* NE ZABORAVI INDEX HTML SKINUTI <meta name="robots" content="noindex, nofollow" /> *//
