import { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { AddressProvider } from "./contexts/AddressContext";

import MaintenanceOverlay from "./components/maintenance-overlay/MaintenanceOverlay";

import "./assets/styles/colors.css";

import AppLayout from "./components/layout/AppLayout";
import AuthModal from "./components/auth-modal/AuthModal";
import AddPasswordModal from "./components/add-password-modal/AddPasswordModal";
import AddAddressModal from "./components/add-address-modal/AddAddressModal";

import HomePage from "./pages/home/HomePage";
import ExplorePage from "./pages/explore/ExplorePage";

import RequireAddress from "./components/require-address/RequireAddress";
import RequireNoAddress from "./components/require-address/RequireNoAddress";

import {
  clearGuestAddresses,
  getSavedAddresses,
  loadUserAddresses,
  syncGuestAddressesToUser,
} from "./utils/deliveryAddress";

function Delivo() {
  const navigate = useNavigate();

  const [auth, setAuth] = useState({ session: null, ready: false });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const [showAddAddressModal, setShowAddAddressModal] = useState(false);

  const [addressVersion, setAddressVersion] = useState(0);
  const [passwordFlowActive, setPasswordFlowActive] = useState(false);

  const authInitDoneRef = useRef(false);
  const migrationDoneRef = useRef(false);

  useEffect(() => {
    const open = () => setShowAddAddressModal(true);
    window.addEventListener("open-add-address", open);
    return () => window.removeEventListener("open-add-address", open);
  }, []);

  useEffect(() => {
    if (authInitDoneRef.current) return;
    authInitDoneRef.current = true;

    supabase.auth.getSession().then(({ data }) => {
      setAuth({ session: data.session || null, ready: true });
    });
  }, []);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
        setAuth({ session: nextSession || null, ready: true });
        setShowAuthModal(false);

        if (event === "SIGNED_OUT") {
          clearGuestAddresses();
          migrationDoneRef.current = false;
          navigate("/", { replace: true });
          return;
        }

        if (
          !migrationDoneRef.current &&
          nextSession?.user &&
          (event === "SIGNED_IN" || event === "INITIAL_SESSION")
        ) {
          migrationDoneRef.current = true;

          const guest = getSavedAddresses();
          if (!guest.length) return;

          const existing = await loadUserAddresses(
            supabase,
            nextSession.user.id
          );

          if (existing.length) {
            clearGuestAddresses();
            return;
          }

          await syncGuestAddressesToUser(
            supabase,
            nextSession.user.id
          );

          setAddressVersion((v) => v + 1);
          navigate("/explore", { replace: true });
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  const hasAccess =
    localStorage.getItem("delivo_access_granted") === "true";

  if (!hasAccess) {
    return <MaintenanceOverlay />;
  }

  if (!auth.ready) return null;

  const session = auth.session;

  const needsPassword =
    session?.user &&
    session.user.identities?.some((i) => i.provider === "google") &&
    !session.user.user_metadata?.password_set;

  const layoutLocked =
    passwordFlowActive || needsPassword || showAddAddressModal;

  return (
    <AddressProvider
      session={session}
      addressVersion={addressVersion}
      authReady={auth.ready}
    >
      {layoutLocked && session && needsPassword && (
        <AddPasswordModal
          onOpen={() => setPasswordFlowActive(true)}
          onSuccess={() => {
            setAddressVersion((v) => v + 1);
            setPasswordFlowActive(false);
            navigate("/explore", { replace: true });
          }}
          onClose={() => setPasswordFlowActive(false)}
        />
      )}

      {layoutLocked && showAddAddressModal && (
        <AddAddressModal
          onClose={() => setShowAddAddressModal(false)}
        />
      )}

      {!layoutLocked && (
        <>
          <Routes>
            <Route
              path="/"
              element={
                <AppLayout
                  session={session}
                  authReady={auth.ready}
                  layoutBlocked={layoutLocked}
                  onAuthOpen={(mode) => {
                    setAuthMode(mode);
                    setShowAuthModal(true);
                  }}
                >
                  <RequireNoAddress session={session}>
                    <HomePage />
                  </RequireNoAddress>
                </AppLayout>
              }
            />

            <Route
              path="/explore"
              element={
                <AppLayout
                  session={session}
                  authReady={auth.ready}
                  layoutBlocked={layoutLocked}
                  onAuthOpen={(mode) => {
                    setAuthMode(mode);
                    setShowAuthModal(true);
                  }}
                >
                  <RequireAddress session={session}>
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
        </>
      )}
    </AddressProvider>
  );
}

export default Delivo;
