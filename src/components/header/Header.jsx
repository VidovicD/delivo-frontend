import React, { useState, useEffect, useCallback } from "react";
import { Link, NavLink } from "react-router-dom";

import "./Header.css";
import logo from "../../assets/TRANSPARENT.png";

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide header on scroll
  const controlHeader = useCallback(() => {
    if (window.scrollY > lastScrollY && window.scrollY > 100) {
      setShowHeader(false);
    } else {
      setShowHeader(true);
    }
    setLastScrollY(window.scrollY);
  }, [lastScrollY]);

  // Scroll listener
  useEffect(() => {
    window.addEventListener("scroll", controlHeader);
    return () => window.removeEventListener("scroll", controlHeader);
  }, [controlHeader]);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 876 && menuOpen) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [menuOpen]);

  const getActiveClass = ({ isActive }) =>
    isActive ? "active-link" : "";

  return (
    <>
      <header className={`main-header ${showHeader ? "visible" : "hidden"}`}>
        <div className="header-left">
          <NavLink to="/" onClick={scrollToTop}>
            <img src={logo} alt="Delivo logo" className="logo" />
          </NavLink>
        </div>

        <nav className="navigacija">
          <ul>
            <li>
              <Link to="/" onClick={scrollToTop}>Početna</Link>
            </li>
            <li>
              <Link to="/usluge">Usluge</Link>
            </li>
            <li>
              <Link to="/cenovnik">Cenovnik</Link>
            </li>
            <li>
              <Link to="/pravna">Pravna lica</Link>
            </li>
            <li>
              <Link to="/kontakt">Kontakt</Link>
            </li>
          </ul>
        </nav>

        <div
          className="hamburger"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <div />
          <div />
          <div />
        </div>
      </header>

      {/* Mobile overlay menu */}
      <nav className={`overlay-menu ${menuOpen ? "open" : ""}`}>
        <div
          className="close-btn"
          onClick={() => setMenuOpen(false)}
        >
          ×
        </div>

        <ul>
          <li>
            <NavLink
              to="/"
              className={getActiveClass}
              onClick={() => setMenuOpen(false)}
            >
              Početna
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/usluge"
              className={getActiveClass}
              onClick={() => setMenuOpen(false)}
            >
              Usluge
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/cenovnik"
              className={getActiveClass}
              onClick={() => setMenuOpen(false)}
            >
              Cenovnik
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/pravna"
              className={getActiveClass}
              onClick={() => setMenuOpen(false)}
            >
              Pravna lica
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/kontakt"
              className={getActiveClass}
              onClick={() => setMenuOpen(false)}
            >
              Kontakt
            </NavLink>
          </li>
        </ul>
      </nav>
    </>
  );
}

export default Header;
