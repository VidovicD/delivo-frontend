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
  const pendingProfileKey = "delivo_pending_profile";
  const pendingProfileEmailKey = "delivo_pending_profile_email";

  const [auth, setAuth] = useState({ session: null, ready: false });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authHandoffActive, setAuthHandoffActive] = useState(false);

  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [editAddress, setEditAddress] = useState(null);

  const [addressVersion, setAddressVersion] = useState(0);
  const [passwordFlowActive, setPasswordFlowActive] = useState(false);

  const authInitDoneRef = useRef(false);
  const migrationDoneRef = useRef(false);

  const isEmailRegistrationIncomplete = (nextSession) => {
    if (!nextSession?.user) return false;
    const provider = nextSession.user.app_metadata?.provider;
    const hasGoogleIdentity = nextSession.user.identities?.some(
      (identity) => identity.provider === "google"
    );
    const isGoogleProvider = provider === "google" || hasGoogleIdentity;
    const isEmailProvider = provider === "email" || !provider;
    return (
      isEmailProvider &&
      !isGoogleProvider &&
      nextSession.user.user_metadata?.password_set !== true
    );
  };

  useEffect(() => {
    const open = () => {
      setEditAddress(null);
      setShowAddAddressModal(true);
    };
    const openEdit = (event) => {
      const detail = event?.detail || null;
      setEditAddress(detail);
      setShowAddAddressModal(true);
    };
    window.addEventListener("open-add-address", open);
    window.addEventListener("open-edit-address", openEdit);
    return () => {
      window.removeEventListener("open-add-address", open);
      window.removeEventListener("open-edit-address", openEdit);
    };
  }, []);

  useEffect(() => {
    if (authInitDoneRef.current) return;
    authInitDoneRef.current = true;

    supabase.auth.getSession().then(({ data }) => {
      setAuth({ session: data.session || null, ready: true });
    });
  }, []);

  const handleAuthSuccess = async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session?.user) {
      setShowAuthModal(false);
      return;
    }

    const hasPendingProfile =
      localStorage.getItem(pendingProfileKey) === "true" ||
      isEmailRegistrationIncomplete(session);
    if (hasPendingProfile) {
      setShowAuthModal(false);
      return;
    }

    const guest = getSavedAddresses();
    if (guest.length) {
      setShowAuthModal(false);
      return;
    }

    const existing = await loadUserAddresses(
      supabase,
      session.user.id
    );

    if (!existing.length) {
      setEditAddress(null);
      setAuthHandoffActive(true);
      setShowAddAddressModal(true);
      return;
    }
    setShowAuthModal(false);
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
        const hasPendingProfile =
          localStorage.getItem(pendingProfileKey) === "true";
        const needsRegistration =
          isEmailRegistrationIncomplete(nextSession);

        setAuth({ session: nextSession || null, ready: true });

        if (event === "SIGNED_OUT") {
          localStorage.removeItem(pendingProfileKey);
          localStorage.removeItem(pendingProfileEmailKey);
          clearGuestAddresses();
          migrationDoneRef.current = false;
          navigate("/", { replace: true });
          return;
        }

        if (needsRegistration) {
          localStorage.setItem(pendingProfileKey, "true");
          if (nextSession?.user?.email) {
            localStorage.setItem(
              pendingProfileEmailKey,
              nextSession.user.email
            );
          }
          setAuthMode("register");
          setShowAuthModal(true);
          return;
        }

        if (hasPendingProfile && nextSession?.user) {
          setAuthMode("register");
          setShowAuthModal(true);
          return;
        }
        setShowAuthModal(false);

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

  const registrationIncomplete =
    localStorage.getItem(pendingProfileKey) === "true" ||
    isEmailRegistrationIncomplete(session);

  const layoutLocked =
    passwordFlowActive ||
    needsPassword ||
    showAddAddressModal;

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
          onClose={() => {
            setShowAddAddressModal(false);
            setEditAddress(null);
            setAuthHandoffActive(false);
          }}
          initialAddress={editAddress}
          onReady={() => {
            if (authHandoffActive) {
              setShowAuthModal(false);
              setAuthHandoffActive(false);
            }
          }}
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
                  forceRender={showAuthModal}
                  onAuthOpen={(mode) => {
                    setAuthMode(mode);
                    setShowAuthModal(true);
                  }}
                >
                  <RequireNoAddress
                    session={session}
                    registrationIncomplete={registrationIncomplete}
                    authModalOpen={showAuthModal}
                  >
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
                  forceRender={showAuthModal}
                  onAuthOpen={(mode) => {
                    setAuthMode(mode);
                    setShowAuthModal(true);
                  }}
                >
                  <RequireAddress
                    session={session}
                    passwordFlowActive={passwordFlowActive}
                    registrationIncomplete={registrationIncomplete}
                    authModalOpen={showAuthModal}
                  >
                    <ExplorePage />
                  </RequireAddress>
                </AppLayout>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </>
      )}

      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={async () => {
            if (registrationIncomplete) {
              localStorage.removeItem(pendingProfileKey);
              localStorage.removeItem(pendingProfileEmailKey);
              await supabase.auth.signOut();
            }
            setShowAuthModal(false);
          }}
          onSwitch={setAuthMode}
          onSuccess={handleAuthSuccess}
        />
      )}
    </AddressProvider>
  );
}

export default Delivo;
