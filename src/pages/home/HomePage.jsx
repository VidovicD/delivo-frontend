import React from "react";

import HeroSection from "./HeroSection";
import ContactSection from "./ContactSection";

import BlankGradient from "../../components/blank-gradient/BlankGradient";
import FoodSection from "./FoodSection";

function HomePage() {
  return (
    <>
      <HeroSection />
      <ContactSection />
      <FoodSection />
    </>
  );
}

export default HomePage;
