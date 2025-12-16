import { useMemo, useState, useEffect } from "react";
import "./FloatingIcons.css";

const ICON_COUNT = 50;
const OPACITY_RANGE = [0.03, 0.06];
const SIZE_RANGE = [35, 65];

const MOBILE_SCALE = 0.6;
const MOBILE_BREAKPOINT = 768;

function generateIcons(count) {
  const icons = [];
  const minDistance = 5;
  let attempts = 0;

  while (icons.length < count && attempts < count * 40) {
    const top = Math.random() * 100;
    const left = Math.random() * 100;

    const isFarEnough = icons.every(
      (i) =>
        Math.abs(i.top - top) > minDistance &&
        Math.abs(i.left - left) > minDistance
    );

    if (isFarEnough) {
      icons.push({
        top,
        left,
        size:
          SIZE_RANGE[0] +
          Math.random() * (SIZE_RANGE[1] - SIZE_RANGE[0]),
        opacity:
          OPACITY_RANGE[0] +
          Math.random() *
            (OPACITY_RANGE[1] - OPACITY_RANGE[0]),
        duration: 6 + Math.random() * 6,
      });
    }

    attempts++;
  }

  return icons;
}

function FloatingIcons({ icons = [] }) {
  const [isMobile, setIsMobile] = useState(
    window.innerWidth < MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const onResize = () =>
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const floatingIcons = useMemo(
    () => generateIcons(ICON_COUNT),
    []
  );

  return (
    <div className="floating-icons">
      {floatingIcons.map((iconData, i) => {
        const size = isMobile
          ? iconData.size * MOBILE_SCALE
          : iconData.size;

        return (
          <img
            key={i}
            src={icons[i % icons.length]}
            alt=""
            className="floating-icons__icon"
            style={{
              top: `${iconData.top}%`,
              left: `${iconData.left}%`,
              width: `${size}px`,
              height: `${size}px`,
              opacity: iconData.opacity,
              animationDuration: `${iconData.duration}s`,
            }}
          />
        );
      })}
    </div>
  );
}

export default FloatingIcons;
