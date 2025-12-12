import "./BlankGradient.css";

import paket from "../../assets/paket.png";
import hrana from "../../assets/hrana.png";
import kamion from "../../assets/kamion.png";

import FloatingIcons from "../floating-icons/FloatingIcons";

function BlankGradient({
  height = "250px",
  variant = "primary",
  withIcons = false,
}) {
  return (
    <section
      className={`blank-gradient ${variant}`}
      style={{ height }}
    >
      {withIcons && (
        <FloatingIcons
          icons={[paket, hrana, kamion]}
          density="low"
          size="large"
          variant="soft"
        />
      )}
    </section>
  );
}

export default BlankGradient;
