import React from "react";
import "./FoodSection.css";

import paket from "../../assets/paket.png";
import hrana from "../../assets/hrana.png";
import kamion from "../../assets/kamion.png";
import FloatingIcons from "../../components/floating-icons/FloatingIcons";

import restaurants from "../../data/restaurants";

function FoodSection() {
  return (
    <section className="food-section">
      <FloatingIcons
        icons={[paket, hrana, kamion]}
        density="low"
        size="large"
        variant="soft"
      />

      <div className="food-track">
        {restaurants.map((r) => (
          <div className="food-card" key={r.id}>
            <img src={r.image} alt={r.name} draggable={false} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default FoodSection;
