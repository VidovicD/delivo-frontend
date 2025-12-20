import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "./Header.css";

function Header({ session, authReady, onAuthOpen }) {
  const navigate = useNavigate();
  const isAuthenticated = !!session?.user;
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();

    localStorage.removeItem("delivery_address");
    localStorage.removeItem("delivery_lat");
    localStorage.removeItem("delivery_lng");
    localStorage.removeItem("current_delivery_id");
    localStorage.removeItem("guest_saved_addresses_v1");

    window.location.replace("/");
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
