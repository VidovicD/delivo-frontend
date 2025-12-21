import { useState } from "react";
import { supabase } from "../../supabaseClient";
import "./Header.css";

function Header({ session, authReady, onAuthOpen }) {
  const isAuthenticated = !!session?.user;
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    setOpen(false);
    await supabase.auth.signOut();
  };

  if (!authReady) {
    return (
      <header className="header">
        <div />
        <div className="header__right" />
      </header>
    );
  }

  return (
    <header className="header">
      <div />

      <div className="header__right">
        {!isAuthenticated && (
          <button
            className="header__btn"
            onClick={() => onAuthOpen("login")}
          >
            Prijava / Registracija
          </button>
        )}

        {isAuthenticated && (
          <div className="profile-menu">
            <button
              className="header__btn"
              onClick={() => setOpen((v) => !v)}
            >
              Moj nalog
            </button>

            {open && (
              <div className="profile-menu__dropdown">
                <button onClick={handleLogout}>
                  Odjavi se
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
