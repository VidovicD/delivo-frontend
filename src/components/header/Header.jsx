import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "./Header.css";

function Header({ session, onAuthOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthenticated = !!session;

  useEffect(() => {
    if (isAuthenticated) return;

    const params = new URLSearchParams(location.search);
    if (params.get("login") !== "1") return;

    const returnTo = params.get("returnTo") || "/restaurants";

    onAuthOpen("login", returnTo);

    params.delete("login");
    params.delete("returnTo");

    const newSearch = params.toString();
    const newUrl =
      location.pathname + (newSearch ? `?${newSearch}` : "");

    window.history.replaceState({}, "", newUrl);
  }, [location, isAuthenticated, onAuthOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  return (
    <header className="header">
      <div />

      <div className="header__right">
        {!isAuthenticated ? (
          <button
            className="header__btn"
            onClick={() =>
              onAuthOpen(
                "login",
                location.pathname === "/"
                  ? "/restaurants"
                  : location.pathname + location.search
              )
            }
          >
            Prijava / Registracija
          </button>
        ) : (
          <button
            className="header__btn header__btn--logout"
            onClick={handleLogout}
          >
            Odjavi se
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
