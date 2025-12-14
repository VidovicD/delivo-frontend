import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import "./assets/styles/colors.css";

import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import AddPasswordModal from "./components/add-password/AddPasswordModal";
import AuthModal from "./components/auth-modal/AuthModal";

import { supabase } from "./supabaseClient";

import HomePage from "./pages/home/HomePage";
import RestaurantsPage from "./pages/restaurants/RestaurantsPage";

/* =========================
   APP LAYOUT
========================= */

function AppLayout({
  user,
  showAddPassword,
  setShowAddPassword,
  showAuthModal,
  setShowAuthModal,
  authMode,
  setAuthMode,
}) {
  const { pathname } = useLocation();
  const hideHeader = pathname.startsWith("/restaurants");

  // 🔒 SCROLL LOCK KAD JE MODAL OTVOREN
  useEffect(() => {
    const isAnyModalOpen = showAddPassword || showAuthModal;

    document.documentElement.style.overflow = isAnyModalOpen ? "hidden" : "";
    document.body.style.overflow = isAnyModalOpen ? "hidden" : "";

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [showAddPassword, showAuthModal]);

  return (
    <>
      {!hideHeader && (
        <Header
          user={user}
          onAuthOpen={(mode) => {
            setAuthMode(mode);
            setShowAuthModal(true);
          }}
        />
      )}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/restaurants" element={<RestaurantsPage />} />
      </Routes>

      <Footer />

      {showAddPassword && (
        <AddPasswordModal onSuccess={() => setShowAddPassword(false)} />
      )}

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

/* =========================
   ROOT APP
========================= */

function Delivo() {
  const [user, setUser] = useState(null);

  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  // OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;

    supabase.auth.exchangeCodeForSession(code).then(() => {
      window.history.replaceState({}, document.title, window.location.pathname);
    });
  }, []);

  // Auth init + listener
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;
      setUser(data?.user ?? null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        if (event === "SIGNED_IN" && session?.user) {
          const u = session.user;
          setUser(u);

          if (
            u.app_metadata?.provider === "google" &&
            u.user_metadata?.password_set !== true
          ) {
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
      isMounted = false;
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <Router>
      <AppLayout
        user={user}
        showAddPassword={showAddPassword}
        setShowAddPassword={setShowAddPassword}
        showAuthModal={showAuthModal}
        setShowAuthModal={setShowAuthModal}
        authMode={authMode}
        setAuthMode={setAuthMode}
      />
    </Router>
  );
}

export default Delivo;
