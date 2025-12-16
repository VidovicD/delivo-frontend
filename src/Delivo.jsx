import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "./supabaseClient";

import "./assets/styles/colors.css";

import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import AuthModal from "./components/auth-modal/AuthModal";
import AddPasswordModal from "./components/add-password/AddPasswordModal";

import HomePage from "./pages/home/HomePage";
import RestaurantsPage from "./pages/restaurants/RestaurantsPage";

function Delivo() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authReturnTo, setAuthReturnTo] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => data.subscription.unsubscribe();
  }, []);

  const needsPassword =
    session?.user &&
    session.user.app_metadata?.provider !== "email" &&
    session.user.user_metadata?.password_set !== true;

  useEffect(() => {
    if (!session) return;

    setShowAuthModal(false);
    setAuthMode(null);

    if (authReturnTo) {
      navigate(authReturnTo, { replace: true });
      setAuthReturnTo(null);
    } else {
      navigate("/restaurants", { replace: true });
    }
  }, [session, authReturnTo, navigate]);

  const hideHeader = location.pathname.startsWith("/restaurants");

  return (
    <>
      {!hideHeader && (
        <Header
          user={user}
          onAuthOpen={(mode, returnTo) => {
            setAuthMode(mode);
            setAuthReturnTo(returnTo || null);
            setShowAuthModal(true);
          }}
        />
      )}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/restaurants" element={<RestaurantsPage />} />
      </Routes>

      <Footer />

      {needsPassword && <AddPasswordModal />}

      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => {
            setShowAuthModal(false);
            setAuthMode(null);
          }}
          onSwitch={setAuthMode}
        />
      )}
    </>
  );
}

export default Delivo;
