import React, { useRef } from "react";
import "./PricingPage.css";

import PricingSection from "./PricingSection";
import DeliveryZones from "./DeliveryZones";
import PricingMap from "./PricingMap";

function PricingPage() {
  const zonesRef = useRef(null);

  return (
    <>
      {/* 1️⃣ CENOVNIK */}
      <PricingSection
        scrollToZone={(zone) =>
          zonesRef.current?.scrollToZone(zone)
        }
      />

      {/* 2️⃣ ZONE */}
      <DeliveryZones ref={zonesRef} />

      {/* 3️⃣ MAPA */}
      <PricingMap />
    </>
  );
}

export default PricingPage;
