import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import ScrollToTop from "./components/ScrollToTop";

/* PAGES */
import HomePage from "./pages/home/HomePage";
import PricingPage from "./pages/pricing/PricingPage";
import Services from "./pages/services/ServicesPage";
import LegalPage from "./pages/legal/LegalPage";
import ContactPage from "./pages/contact/ContactPage";
import Blog from "./pages/Blog";
import FAQ from "./pages/FAQ";
import Zaposlenje from "./pages/Zaposlenje";
import Politika from "./pages/Politika";
import Uslovi from "./pages/Uslovi";
import Zakazivanje from "./pages/Zakazivanje";

function Delivo() {
  return (
    <Router>
      <ScrollToTop />
      <Header />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cenovnik" element={<PricingPage />} />
        <Route path="/usluge" element={<Services />} />
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
