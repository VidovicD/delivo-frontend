import React, { useRef } from "react";

import HeroSection from "./HeroSection";
import ContactSection from "./ContactSection";

import BlankGradient from "../../components/blank-gradient/BlankGradient";

function HomePage() {
  return (
    <>
      <HeroSection />
      <ContactSection />

      <BlankGradient withIcons />
    </>
  );
}

export default HomePage;
