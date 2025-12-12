import React, { useMemo, useState, useEffect } from "react";
import "./FloatingIcons.css";

/* 🔢 koliko ikonica */
const DENSITY_COUNT = {
  low: 8,
  normal: 14,
  high: 22,
};

/* 🌫️ jačina */
const VARIANT_OPACITY = {
  soft: [0.04, 0.07],
  medium: [0.08, 0.12],
  strong: [0.15, 0.2],
};

/* 📐 osnovne veličine */
const SIZE_RANGE = {
  small: [18, 28],
  medium: [30, 55],
  large: [55, 85],
};

/* 📱 mobile scale */
const MOBILE_SCALE = 0.6; // 1/3 manje
const MOBILE_BREAKPOINT = 768;

function generatePositions(count) {
  const positions = [];
  const minDistance = 14;
  let attempts = 0;

  while (positions.length < count && attempts < count * 40) {
    const top = Math.random() * 100;
    const left = Math.random() * 100;

    const isFarEnough = positions.every(
      (p) =>
        Math.abs(p.top - top) > minDistance &&
        Math.abs(p.left - left) > minDistance
    );

    if (isFarEnough) {
      positions.push({ top, left });
    }

    attempts++;
  }

  return positions;
}

function FloatingIcons({
  icons = [],
  density = "normal",
  variant = "soft",
  size = "medium",
}) {
  const count = DENSITY_COUNT[density] ?? DENSITY_COUNT.normal;
  const opacityRange = VARIANT_OPACITY[variant] ?? VARIANT_OPACITY.soft;
  const [minSize, maxSize] = SIZE_RANGE[size] ?? SIZE_RANGE.medium;

  /* 📱 responsive state */
  const [isMobile, setIsMobile] = useState(
    window.innerWidth < MOBILE_BREAKPOINT
  );

  /* 👂 resize listener */
  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* 📍 pozicije se NE menjaju na resize (bitno!) */
  const positions = useMemo(() => generatePositions(count), [count]);

  return (
    <div className="floating-icons">
      {positions.map((pos, i) => {
        const icon = icons[i % icons.length];

        const baseSize =
          minSize + Math.random() * (maxSize - minSize);

        const iconSize = isMobile
          ? baseSize * MOBILE_SCALE
          : baseSize;

        const opacity =
          opacityRange[0] +
          Math.random() * (opacityRange[1] - opacityRange[0]);

        const duration = 6 + Math.random() * 6;

        return (
          <img
            key={i}
            src={icon}
            alt=""
            className="floating-icons__icon"
            style={{
              top: `${pos.top}%`,
              left: `${pos.left}%`,
              width: `${iconSize}px`,
              height: `${iconSize}px`,
              opacity,
              animationDuration: `${duration}s`,
            }}
          />
        );
      })}
    </div>
  );
}

export default FloatingIcons;
