import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
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

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authReturnTo, setAuthReturnTo] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === "INITIAL_SESSION") return;

      if (event === "SIGNED_IN") {
        const target =
          authReturnTo && authReturnTo !== "/"
            ? authReturnTo
            : "/restaurants";

        navigate(target, { replace: true });
        setAuthReturnTo(null);
      }

      if (event === "SIGNED_OUT") {
        navigate("/", { replace: true });
      }
    });

    return () => data.subscription.unsubscribe();
  }, [authReturnTo, navigate]);

  const needsPassword =
    session?.user &&
    session.user.app_metadata?.provider === "google" &&
    session.user.user_metadata?.password_set !== true;

  return (
    <>
      <Header
        session={session}
        onAuthOpen={(mode, returnTo) => {
          setAuthMode(mode);
          setAuthReturnTo(returnTo || null);
          setShowAuthModal(true);
        }}
      />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/restaurants"
          element={<RestaurantsPage session={session} />}
        />
      </Routes>

      <Footer />

      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => {
            setShowAuthModal(false);
            setAuthMode(null);
          }}
          onSwitch={setAuthMode}
          onSuccess={async () => {
            const { data } = await supabase.auth.getSession();
            setSession(data.session);
            setUser(data.session?.user ?? null);
            setShowAuthModal(false);
          }}
        />
      )}

      {session && needsPassword && (
        <AddPasswordModal
          onSuccess={async () => {
            const { data } = await supabase.auth.getSession();
            setSession(data.session);
            setUser(data.session?.user ?? null);
          }}
        />
      )}
    </>
  );
}

export default Delivo;
