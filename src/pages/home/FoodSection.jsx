import React, { useRef, useEffect } from "react";
import "./FoodSection.css";

import paket from "../../assets/paket.png";
import hrana from "../../assets/hrana.png";
import kamion from "../../assets/kamion.png";
import FloatingIcons from "../../components/floating-icons/FloatingIcons";

import restaurants from "../../data/restaurants";

const COPIES = 4;

/* 🎯 PRAVE VREDNOSTI */
const AUTOPLAY_SPEED = 0.35;   // px po frame-u (SPORO)
const DRAG_MULTIPLIER = 0.02;  // koliko drag utiče
const FRICTION = 0.99;         // inertia usporavanje

function FoodSection() {
  const trackRef = useRef(null);

  const pos = useRef(0);
  const dragVelocity = useRef(0);
  const startX = useRef(0);
  const isDragging = useRef(false);
  const rafId = useRef(null);

  const items = Array.from({ length: COPIES }, () => restaurants).flat();

    useEffect(() => {
    const animate = () => {
        const track = trackRef.current;
        if (!track) return;

        const width = track.scrollWidth / COPIES;

        if (!isDragging.current) {
        pos.current += AUTOPLAY_SPEED;
        }

        pos.current += dragVelocity.current;
        dragVelocity.current *= FRICTION;

        const visualX =
        ((pos.current % width) + width) % width - width;

        track.style.transform = `translateX(${visualX}px)`;

        rafId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(rafId.current);
    }, []);

  /* POINTER EVENTS */

  const onPointerDown = (e) => {
    isDragging.current = true;
    startX.current = e.clientX;
    dragVelocity.current = 0;
    trackRef.current.setPointerCapture(e.pointerId);
  };

    const onPointerMove = (e) => {
    if (!isDragging.current) return;

    const dx = e.clientX - startX.current;
    startX.current = e.clientX;

    // 🔥 direktan drag
    pos.current += dx;

    // 🔥 brzina samo za inertia
    dragVelocity.current = dx * DRAG_MULTIPLIER;
    };

  const onPointerUp = (e) => {
    isDragging.current = false;
    trackRef.current.releasePointerCapture(e.pointerId);
  };

  return (
    <section className="food-section">
      {/* BACKGROUND ICONS */}
      <div className="food-bg-wrapper">
        <div className="food-bg">
          <FloatingIcons
            icons={[paket, hrana, kamion]}
            density="low"
            size="large"
            variant="soft"
          />
        </div>
      </div>

      {/* VIEWPORT */}
      <div className="food-viewport">
        <div
        className="food-track"
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        >
        {items.map((r, i) => (
        <div className="food-card" key={`${r.id}-${i}`}>
        <img src={r.image} alt={r.name} draggable={false} />
        </div>
        ))}
        </div>
      </div>
    </section>
  );
}

export default FoodSection;
