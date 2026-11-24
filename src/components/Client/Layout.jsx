import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="site-wrapper">
      <Navbar />

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="main-footer">
        <p>&copy; {new Date().getFullYear()} Sabor & Aroma. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}