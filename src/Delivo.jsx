import { useEffect, useRef, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

import "./assets/styles/colors.css";

import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import AuthModal from "./components/auth-modal/AuthModal";
import AddPasswordModal from "./components/add-password/AddPasswordModal";

import HomePage from "./pages/home/HomePage";
import RestaurantsPage from "./pages/restaurants/RestaurantsPage";

import {
  syncGuestAddressesToUser,
  loadUserAddresses,
  clearGuestAddresses,
} from "./utils/deliveryAddress";

function Delivo() {
  const navigate = useNavigate();
  const redirectLock = useRef(false);

  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const [addressVersion, setAddressVersion] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setAuthReady(true);
        setShowAuthModal(false);

        if (!session?.user) {
          redirectLock.current = false;
          return;
        }

        if (redirectLock.current) return;
        redirectLock.current = true;

        const userId = session.user.id;

        if (event === "SIGNED_UP") {
          await syncGuestAddressesToUser(supabase, userId);
          const list = await loadUserAddresses(supabase, userId);

          if (list?.length) {
            const a = list[0];
            navigate(
              `/restaurants?address=${encodeURIComponent(a.address)}&lat=${a.lat}&lng=${a.lng}`,
              { replace: true }
            );
          }

          setAddressVersion((v) => v + 1);
          return;
        }

        if (event === "SIGNED_IN") {
          clearGuestAddresses();
          const list = await loadUserAddresses(supabase, userId);

          if (list?.length) {
            const a = list[0];
            navigate(
              `/restaurants?address=${encodeURIComponent(a.address)}&lat=${a.lat}&lng=${a.lng}`,
              { replace: true }
            );
          }

          setAddressVersion((v) => v + 1);
          return;
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  const needsPassword =
    session?.user &&
    session.user.identities?.some(
      (i) => i.provider === "google"
    ) &&
    !session.user.user_metadata?.password_set;

  return (
    <>
      <Header
        session={session}
        authReady={authReady}
        onAuthOpen={(mode) => {
          setAuthMode(mode);
          setShowAuthModal(true);
        }}
      />

      <Routes>
        <Route
          path="/"
          element={<HomePage session={session} />}
        />

        <Route
          path="/restaurants"
          element={
            <RestaurantsPage
              key={addressVersion}
              session={session}
              addressVersion={addressVersion}
            />
          }
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
        />
      )}

      {session && needsPassword && (
        <AddPasswordModal
          onSuccess={async () => {
            const { data } = await supabase.auth.getSession();
            setSession(data.session);
          }}
        />
      )}
    </>
  );
}

export default Delivo;
