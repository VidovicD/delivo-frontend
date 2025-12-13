import { useState } from "react";
import "./Header.css";

import AuthModal from "../auth-modal/AuthModal";

function Header() {
  const [authMode, setAuthMode] = useState(null);

  return (
    <>
      <header className="header">
        <div />

        <div className="header__right">
          <button
            className="header__btn"
            onClick={() => setAuthMode("login")}
          >
            Prijava / Registracija
          </button>
        </div>
      </header>

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSwitch={setAuthMode}
        />
      )}
    </>
  );
}

export default Header;
