import React, { useState, useEffect } from 'react';
import { Link, NavLink } from "react-router-dom";

import './Header.css';
import logo from "../../assets/TRANSPARENT.png";

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true); // auto-hide state
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide header effect
  const controlHeader = () => {
    if (window.scrollY > lastScrollY && window.scrollY > 100) {
      // skroluje dole
      setShowHeader(false);
    } else {
      // skroluje gore
      setShowHeader(true);
    }
    setLastScrollY(window.scrollY);
  };

  useEffect(() => {
    window.addEventListener('scroll', controlHeader);
    return () => window.removeEventListener('scroll', controlHeader);
  }, [lastScrollY]);

  // Zatvaranje menija pri resize > 876px
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 876 && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [menuOpen]);

  const getActiveClass = ({ isActive }) => isActive ? "active-link" : "";

  return (
    <>
      {/* Header */}
      <header className={`main-header ${showHeader ? 'visible' : 'hidden'}`}>
        <div className="header-left">
          <NavLink to="/">
            <img src={logo} alt="Logo" className="logo" />
          </NavLink>
        </div>

        <nav className="navigacija">
          <ul>
            <li><Link to="/" onClick={scrollToTop}>Početna</Link></li>
            <li><Link to="/usluge">Usluge</Link></li>
            <li><Link to="/cenovnik">Cenovnik</Link></li>
            <li><Link to="/pravna">Pravna lica</Link></li>
            <li><Link to="/kontakt">Kontakt</Link></li>
          </ul>
        </nav>

        <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </header>

      {/* Overlay menu kao sibling */}
      <nav className={`overlay-menu ${menuOpen ? 'open' : ''}`}>
        <div className="close-btn" onClick={() => setMenuOpen(false)}>×</div>
        <ul>
          <li>
            <NavLink to="/" className={getActiveClass} onClick={() => setMenuOpen(false)}>Početna</NavLink>
          </li>
          <li>
            <NavLink to="/usluge" className={getActiveClass} onClick={() => setMenuOpen(false)}>Usluge</NavLink>
          </li>
          <li>
            <NavLink to="/cenovnik" className={getActiveClass} onClick={() => setMenuOpen(false)}>Cenovnik</NavLink>
          </li>
          <li>
            <NavLink to="/pravna" className={getActiveClass} onClick={() => setMenuOpen(false)}>Pravna lica</NavLink>
          </li>
          <li>
            <NavLink to="/kontakt" className={getActiveClass} onClick={() => setMenuOpen(false)}>Kontakt</NavLink>
          </li>
        </ul>
      </nav>
    </>
  );
}

export default Header;
