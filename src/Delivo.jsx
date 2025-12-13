import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import ScrollToTop from "./components/ScrollToTop";

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

/* PAGES */
import HomePage from "./pages/home/HomePage";
/*import PricingPage from "./pages/pricing/PricingPage";*/
import Services from "./pages/services/ServicesPage";
/*import LegalPage from "./pages/legal/LegalPage";*/
/*import ContactPage from "./pages/contact/ContactPage";*/
import Blog from "./pages/Blog";
import FAQ from "./pages/FAQ";
import Zaposlenje from "./pages/Zaposlenje";
import Politika from "./pages/Politika";
import Uslovi from "./pages/Uslovi";
import Zakazivanje from "./pages/Zakazivanje";
import ComingSoon from "./pages/coming-soon/ComingSoon";

function Delivo() {
  const [user, setUser] = useState(null);

  useEffect(() => {
  // 1️⃣ Provera odmah pri učitavanju
  supabase.auth.getUser().then(({ data }) => {
    setUser(data.user);
  });

  // 2️⃣ Slušanje login / logout promena
  const { data: authListener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setUser(session?.user ?? null);
    }
  );

  return () => {
    authListener.subscription.unsubscribe();
  };
}, []);

  return (
    <Router>
      <ScrollToTop />
      <Header user={user} />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/izrada" element={<ComingSoon />} />
        <Route path="/cenovnik" element={<ComingSoon />} />
        <Route path="/usluge" element={<Services />} />
        <Route path="/pravna" element={<ComingSoon />} />
        <Route path="/kontakt" element={<ComingSoon />} />
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
