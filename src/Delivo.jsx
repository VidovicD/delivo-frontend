import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useJsApiLoader } from "@react-google-maps/api";
import { supabase } from "./supabaseClient";
import { AddressProvider } from "./contexts/AddressContext";

import "./assets/styles/colors.css";

import AppLayout from "./components/layout/AppLayout";
import AuthModal from "./components/auth-modal/AuthModal";
import AddPasswordModal from "./components/add-password-modal/AddPasswordModal";

import HomePage from "./pages/home/HomePage";
import ExplorePage from "./pages/explore/ExplorePage";

import RequireAddress from "./components/require-address/RequireAddress";

import { clearGuestAddresses } from "./utils/deliveryAddress";

const libraries = ["places"];

function Delivo() {
  const navigate = useNavigate();

  const { isLoaded: mapsReady } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY,
    libraries,
  });

  const [auth, setAuth] = useState({ session: null, ready: false });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [addressVersion, setAddressVersion] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuth({ session: data.session || null, ready: true });
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        setAuth({ session: nextSession || null, ready: true });
        setShowAuthModal(false);

        if (event === "SIGNED_OUT") {
          clearGuestAddresses();
          navigate("/", { replace: true });
        }

        if (
          (event === "SIGNED_IN" || event === "SIGNED_UP") &&
          nextSession?.user
        ) {
          clearGuestAddresses();
          setAddressVersion((v) => v + 1);
          navigate("/explore", { replace: true });
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  const session = auth.session;
  const authReady = auth.ready;

  useEffect(() => {
    if (!authReady) return;
    if (!session?.user) return;

    if (window.location.pathname === "/") {
      navigate("/explore", { replace: true });
    }
  }, [authReady, session, navigate]);

  if (!mapsReady || !authReady) {
    return null;
  }

  const needsPassword =
    session?.user &&
    session.user.identities?.some((i) => i.provider === "google") &&
    !session.user.user_metadata?.password_set;

  return (
    <AddressProvider
      session={session}
      addressVersion={addressVersion}
      authReady={authReady}
    >
      <Routes>
        <Route
          path="/"
          element={
            <AppLayout
              session={session}
              authReady={authReady}
              onAuthOpen={(mode) => {
                setAuthMode(mode);
                setShowAuthModal(true);
              }}
            >
              <HomePage />
            </AppLayout>
          }
        />

        <Route
          path="/explore"
          element={
            <AppLayout
              session={session}
              authReady={authReady}
              onAuthOpen={(mode) => {
                setAuthMode(mode);
                setShowAuthModal(true);
              }}
            >
              <RequireAddress>
                <ExplorePage />
              </RequireAddress>
            </AppLayout>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSwitch={setAuthMode}
        />
      )}

      {session && needsPassword && (
        <AddPasswordModal
          onSuccess={() => {
            setAddressVersion((v) => v + 1);
          }}
        />
      )}
    </AddressProvider>
  );
}

export default Delivo;
