import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import ScrollToTop from "./components/ScrollToTop";

import { supabase } from "./supabaseClient";

/* PAGES */
import HomePage from "./pages/home/HomePage";
import Services from "./pages/services/ServicesPage";
import Blog from "./pages/Blog";
import FAQ from "./pages/FAQ";
import Zaposlenje from "./pages/Zaposlenje";
import Politika from "./pages/Politika";
import Uslovi from "./pages/Uslovi";
import Zakazivanje from "./pages/Zakazivanje";
import ComingSoon from "./pages/coming-soon/ComingSoon";
import RestaurantsPage from "./pages/restaurants/RestaurantsPage";

/* GOOGLE */
import { LoadScript } from "@react-google-maps/api";

/* ADD PASSWORD */
import AddPasswordModal from "./components/add-password/AddPasswordModal";

const libraries = ["places"];

/* 🔑 Layout wrapper da možemo da koristimo useLocation */
function AppLayout({ user, showAddPassword, setShowAddPassword }) {
  const location = useLocation();

  // ❗ sakrivamo globalni header na /restaurants
  const hideHeader = location.pathname.startsWith("/restaurants");

  return (
    <>
      {!hideHeader && <Header user={user} />}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/restaurants" element={<RestaurantsPage />} />
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

      {showAddPassword && (
        <AddPasswordModal onSuccess={() => setShowAddPassword(false)} />
      )}
    </>
  );
}

function Delivo() {
  const [user, setUser] = useState(null);
  const [showAddPassword, setShowAddPassword] = useState(false);

  /* OAuth exchange */
  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    run();
  }, []);

  /* Auth state */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const user = session.user;
          setUser(user);

          const provider = user.app_metadata?.provider;
          const passwordAlreadySet =
            user.user_metadata?.password_set === true;

          if (provider === "google" && !passwordAlreadySet) {
            setShowAddPassword(true);
          }
        }

        if (event === "SIGNED_OUT") {
          setUser(null);
          setShowAddPassword(false);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <LoadScript
      googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_KEY}
      libraries={libraries}
    >
      <Router>
        <ScrollToTop />
        <AppLayout
          user={user}
          showAddPassword={showAddPassword}
          setShowAddPassword={setShowAddPassword}
        />
      </Router>
    </LoadScript>
  );
}

export default Delivo;
