import React, { useEffect, useState } from "react";
import "./Header.css";

import logo from "../../assets/TRANSPARENT.png";
import userIcon from "../../assets/user.png";

import AuthModal from "../auth-modal/AuthModal";

import { supabase } from "../../supabaseClient";

function Header({ user }) {
  const [visible, setVisible] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const onScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setVisible(false);
      } else {
        setVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openLogin = () => {
    setAuthMode("login");
    setShowAuthModal(true);
  };

  const openRegister = () => {
    setAuthMode("register");
    setShowAuthModal(true);
  };

  return (
  <>
    <header className={`header ${visible ? "visible" : "hidden"}`}>
      <div className="header__left">
        <img src={logo} alt="Delivo logo" className="header__logo" />
      </div>

      <div className="header__right">
        {/* DESKTOP */}
        <div className="header__auth-desktop">
          {user ? (
            <button
              className="header__btn header__btn--logout"
              onClick={async () => {
                await supabase.auth.signOut();
              }}
            >
              Odloguj se
            </button>
          ) : (
            <>
              <button
                className="header__btn header__btn--login"
                onClick={openLogin}
              >
                Prijavi se
              </button>

              <button
                className="header__btn header__btn--register"
                onClick={openRegister}
              >
                Registruj se
              </button>
            </>
          )}
        </div>

        {/* MOBILE */}
        <div className="header__auth-mobile">
          {user ? (
            <img
              src={userIcon}
              alt="Logout"
              className="header__user-icon"
              onClick={async () => {
                await supabase.auth.signOut();
              }}
            />
          ) : (
            <img
              src={userIcon}
              alt="Prijava / Registracija"
              className="header__user-icon"
              onClick={openLogin}
            />
          )}
        </div>
      </div>
    </header>
    {showAuthModal && (
      <AuthModal
        mode={authMode}
        onClose={() => setShowAuthModal(false)}
        onSwitch={(mode) => setAuthMode(mode)}
      />
    )}
  </>
);
}

export default Header;
