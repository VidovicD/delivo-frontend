import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useAddress } from "../../contexts/AddressContext";
import { formatAddressDisplay } from "../../utils/addressValidation";
import AddressListModal from "../address-list-modal/AddressListModal";
import logo from "../../assets/logoheader.png";
import "./Header.css";

function Header({ session, authReady, onAuthOpen }) {
  const isAuthenticated = !!session?.user;
  const [open, setOpen] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isExplore = location.pathname === "/explore";
  const isHome = location.pathname === "/";
  const { savedAddresses, activeAddress, setActiveById } = useAddress();

  const handleLogout = async () => {
    setOpen(false);
    await supabase.auth.signOut();
  };

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!authReady) {
    return (
      <header className="header">
        <div />
        <div className="header__right" />
      </header>
    );
  }

  if (isHome) {
    return (
      <header className={`header header--home${scrolled ? " header--scrolled" : ""}`}>
        <div className="header__left" />
        <div className="header__center" />
        <div className="header__right">
          <button className="header__btn" onClick={() => onAuthOpen("login")}>
            Prijava / Registracija
          </button>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`header${scrolled ? " header--scrolled" : ""}${
        isExplore ? " header--explore" : ""
      }`}
    >
      <div className="header__left">
        <img className="header__logo" src={logo} alt="Delivo" />
      </div>

      <div className="header__center">
        <div className="header__search hero__search">
          <span className="header__search-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                d="M11 2a9 9 0 1 0 5.65 16l4.17 4.17a1 1 0 0 0 1.41-1.41L18.06 16.6A9 9 0 0 0 11 2zm0 2a7 7 0 1 1 0 14 7 7 0 0 1 0-14z"
                fill="currentColor"
              />
            </svg>
          </span>
          <input
            className="hero__search-input"
            type="text"
            placeholder="Pretraži Delivo..."
          />
        </div>
      </div>

      <div
        className={`header__right${
          !isAuthenticated && isExplore ? " header__right--guest" : ""
        }${isAuthenticated && isExplore ? " header__right--authed" : ""}`}
      >
        {isExplore && savedAddresses.length > 0 && activeAddress && (
          <div className="address-picker">
            <button
              className="address-picker__trigger"
              type="button"
              onClick={() => setShowAddressModal(true)}
            >
              <span
                className="address-picker__value"
                title={formatAddressDisplay(activeAddress.address)}
              >
                {formatAddressDisplay(activeAddress.address)}
              </span>
              <span className="address-picker__chevron" aria-hidden="true">
                <svg viewBox="0 0 20 10" width="12" height="6">
                  <path
                    d="M1 1l9 8 9-8"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          </div>
        )}

        {!isAuthenticated && (
          <div className="header__actions">
            <button
              className="header__icon-btn"
              type="button"
              aria-label="Moj nalog"
              onClick={() => onAuthOpen("login")}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                <path
                  d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.41 0-8 2.24-8 5v1h16v-1c0-2.76-3.59-5-8-5z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        )}

        {isAuthenticated && (
          <div className="header__actions">
            <div className="profile-menu">
              <button
                className="header__icon-btn"
                type="button"
                aria-label="Moj nalog"
                onClick={() => setOpen((v) => !v)}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                  <path
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.41 0-8 2.24-8 5v1h16v-1c0-2.76-3.59-5-8-5z"
                    fill="currentColor"
                  />
                </svg>
              </button>

              {open && (
                <div className="profile-menu__dropdown">
                  <button type="button" onClick={() => setOpen(false)}>
                    Profil
                  </button>
                  <button type="button" onClick={() => setOpen(false)}>
                    Porudžbine
                  </button>
                  <button type="button" onClick={handleLogout}>
                    Odjavi se
                  </button>
                </div>
              )}
            </div>

            <button className="header__icon-btn" type="button" aria-label="Korpa">
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                <path
                  d="M7 18a2 2 0 1 0 2 2 2 2 0 0 0-2-2zm10 0a2 2 0 1 0 2 2 2 2 0 0 0-2-2zM7.2 14h9.45a1.5 1.5 0 0 0 1.44-1.1l1.68-6.1A1 1 0 0 0 18.81 5H6.21L5.7 3H3a1 1 0 0 0 0 2h1.2l2.4 9.2A2 2 0 0 0 7.2 14z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      <AddressListModal
        isOpen={showAddressModal}
        addresses={savedAddresses}
        activeAddressId={activeAddress?.id}
        onClose={() => setShowAddressModal(false)}
        onSelect={async (address) => {
          await setActiveById(address.id);
          setShowAddressModal(false);
        }}
      />
    </header>
  );
}

export default Header;
