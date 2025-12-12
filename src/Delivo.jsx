import React, { useRef } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";

import ScrollToTop from "./components/ScrollToTop";

import HeroSection from "./pages/home/HeroSection";
import ContactSection from "./pages/home/ContactSection";
import AboutSection from "./pages/home/AboutSection";
import ServicesSection from "./pages/home/ServicesSection";

import PricingSection from "./pages/pricing/PricingSection";
import DeliveryZones from "./pages/pricing/DeliveryZones";
import PricingPage from "./pages/pricing/PricingPage";

import BlankGradient from "./components/blank-gradient/BlankGradient";

import Usluge from "./pages/Usluge";
import LegalPage from "./pages/legal/LegalPage";
import ContactPage from "./pages/contact/ContactPage";
import Blog from "./pages/Blog";
import FAQ from "./pages/FAQ";
import Zaposlenje from "./pages/Zaposlenje";
import Politika from "./pages/Politika";
import Uslovi from "./pages/Uslovi";
import Zakazivanje from "./pages/Zakazivanje";

function Delivo() {
  const zonesRef = useRef(null);

  const scrollToZone = (zone) => {
    zonesRef.current?.scrollToZone(zone);
  };

  return (
    <Router>
      <ScrollToTop />
      <Header />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <HeroSection />
              <ContactSection />
              <AboutSection />
              <ServicesSection />

              <PricingSection scrollToZone={scrollToZone} />
              <DeliveryZones ref={zonesRef} />

              <BlankGradient withIcons />
            </>
          }
        />

        <Route path="/cenovnik" element={<PricingPage />} />
        <Route path="/usluge" element={<Usluge />} />
        <Route path="/pravna" element={<LegalPage />} />
        <Route path="/kontakt" element={<ContactPage />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/zaposlenje" element={<Zaposlenje />} />
        <Route path="/politika" element={<Politika />} />
        <Route path="/uslovi" element={<Uslovi />} />
        <Route path="/zakazivanje" element={<Zakazivanje />} />
      </Routes>

      <Footer />
    </Router>
  );
}

export default Delivo;
