import "./Header.css";

function Header({ onAuthOpen }) {
  return (
    <header className="header">
      <div />

      <div className="header__right">
        <button
          className="header__btn"
          onClick={() => onAuthOpen("login")}
        >
          Prijava / Registracija
        </button>
      </div>
    </header>
  );
}

export default Header;
