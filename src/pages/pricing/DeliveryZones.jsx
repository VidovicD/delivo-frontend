import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import "./DeliveryZones.css";

const DeliveryZones = forwardRef((props, ref) => {
  const zone1Ref = useRef(null);
  const zone2Ref = useRef(null);
  const zone3Ref = useRef(null);

  const [highlightZone, setHighlightZone] = useState(null);

  useImperativeHandle(ref, () => ({
    scrollToZone(zone) {
      const target =
        zone === 1 ? zone1Ref.current :
        zone === 2 ? zone2Ref.current :
        zone3Ref.current;

      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightZone(zone);
      setTimeout(() => setHighlightZone(null), 700);
    }
  }));

  return (
    <section className="delivery-zones">
      <div className="delivery-zones__inner">
        <h2>Zone dostave</h2>

        <div ref={zone1Ref} className={`zone ${highlightZone === 1 ? "highlight" : ""}`}>
          <h3>Zona I – Gradske zone</h3>
          <p>
            Stari grad, Podbara, Grbavica, Liman, Sajmište, Banatić,
            Rotkvarija, Salajka, Jugovićevo, Bistrica, Telep,
            Detelinara, Avijacija, Adamovićevo naselje,
            Ribarsko ostrvo i Radna zona sever 2 i 3.
          </p>
        </div>

        <div ref={zone2Ref} className={`zone ${highlightZone === 2 ? "highlight" : ""}`}>
          <h3>Zona II</h3>
          <p>
            Veternik, Veternička rampa, Adice, Kamenjar, Sajlovo, Klisa,
            Šangaj, Radna zona sever 1 i 4, Petrovaradin, Mišeluk,
            Alibegovac, Sremska Kamenica i Kamenička Ada.
          </p>
        </div>

        <div ref={zone3Ref} className={`zone ${highlightZone === 3 ? "highlight" : ""}`}>
          <h3>Zona III</h3>
          <p>
            Futog, Rumenka, Ledinci, Rakovac, Bukovac,
            Sremski Karlovci i Kać.
          </p>
        </div>
      </div>
    </section>
  );
});

export default DeliveryZones;
