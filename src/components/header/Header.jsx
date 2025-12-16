import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./Header.css";

function Header({ user, onAuthOpen }) {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.get("login") === "1") {
      const returnTo = params.get("returnTo");

      onAuthOpen("login", returnTo);

      params.delete("login");
      params.delete("returnTo");

      const newSearch = params.toString();
      const newUrl =
        location.pathname + (newSearch ? `?${newSearch}` : "");

      window.history.replaceState({}, "", newUrl);
    }
  }, [location, onAuthOpen]);

  return (
    <header className="header">
      <div />

      <div className="header__right">
        {!user && (
          <button
            className="header__btn"
            onClick={() => onAuthOpen("login")}
          >
            Prijava / Registracija
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
