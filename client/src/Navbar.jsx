import React from 'react';
import './Navbar.css';
import logo from './assets/logo.png';

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-logo-area">
        <img src={logo} alt="logo" className="navbar-logo-img" />

        <div>
          <h2 className="navbar-title">מערכת שיבוץ חדרים</h2>
          <p className="navbar-subtitle">
            ניהול חדרים, מערכות ושיבוצים זמניים
          </p>
        </div>
      </div>

      <nav className="navbar-links">
        <a href="#home" className="navbar-link">דף הבית</a>
        <a href="#rooms" className="navbar-link">חדרים</a>
        <a href="#schedule" className="navbar-link">מערכת חדר</a>
        <a href="#allocations" className="navbar-link navbar-link-active">
          שיבוצים
        </a>
      </nav>
    </header>
  );
}

export default Navbar;