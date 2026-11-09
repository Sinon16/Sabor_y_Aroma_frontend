import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const API_BASE_URL = 'http://localhost:8080/api';

export default function Navbar() {
  const { usuario, cerrarSesion, esAdministrador } = useAuth();
  const { obtenerTotalItems } = useCart();
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState([]);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [menuMobileAbierto, setMenuMobileAbierto] = useState(false);
  const dropdownRef = useRef(null);

  const cargarCategorias = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categorias`);
      if (res.ok) {
        const data = await res.json();
        setCategorias(data);
      }
    } catch (err) {
      console.error('Error al consultar categorías en el Navbar:', err);
    }
  };

  useEffect(() => {
    cargarCategorias();

    const manejarCambioCategorias = () => cargarCategorias();
    window.addEventListener('categoryChange', manejarCambioCategorias);

    const manejarClicFuera = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownAbierto(false);
      }
    };
    document.addEventListener('mousedown', manejarClicFuera);

    return () => {
      window.removeEventListener('categoryChange', manejarCambioCategorias);
      document.removeEventListener('mousedown', manejarClicFuera);
    };
  }, []);

  const handleLogout = () => {
    cerrarSesion();
    navigate('/');
    setMenuMobileAbierto(false);
  };

  const handleSeleccionarCategoria = (nombreCat) => {
    setDropdownAbierto(false);
    setMenuMobileAbierto(false);
    if (nombreCat) {
      navigate(`/catalogo?cat=${encodeURIComponent(nombreCat)}`);
    } else {
      navigate('/catalogo');
    }
  };

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDropdownAbierto((prev) => !prev);
  };

  const toggleMenuMobile = () => {
    setMenuMobileAbierto((prev) => !prev);
  };

  return (
    <>
      <header className="main-header">
        <div className="logo">
          <span className="logo-icon">🍔</span>
          <h1>Sabor & Aroma</h1>
        </div>

        {/* Botón Hamburguesa para Mobile/Tablet */}
        <button 
          type="button"
          className="btn-hamburger" 
          onClick={toggleMenuMobile} 
          aria-label="Toggle navigation"
        >
          {menuMobileAbierto ? '✕' : '☰'}
        </button>

        <nav className={`navbar ${menuMobileAbierto ? 'navbar-mobile-active' : ''}`}>
          <ul>
            <li>
              <Link to="/" onClick={() => setMenuMobileAbierto(false)}>Inicio</Link>
            </li>
            <li className="separator">|</li>

            <li className="dropdown-categorias-container" ref={dropdownRef}>
              <div className="dropdown-trigger-wrapper">
                <Link 
                  to="/catalogo" 
                  className="nav-link-categorias" 
                  onClick={() => setMenuMobileAbierto(false)}
                >
                  Categorías
                </Link>
                <button 
                  type="button" 
                  className="btn-flecha-dropdown"
                  onClick={toggleDropdown}
                  title="Desplegar categorías"
                >
                  ▼
                </button>
              </div>

              {dropdownAbierto && (
                <ul className="mini-menu-dropdown">
                  <li>
                    <button type="button" onClick={() => handleSeleccionarCategoria('')}>
                      🍽️ Todas las Categorías
                    </button>
                  </li>
                  {categorias.map((cat) => (
                    <li key={cat.idCategoria}>
                      <button type="button" onClick={() => handleSeleccionarCategoria(cat.nombreCategoria)}>
                        {cat.nombreCategoria}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>

            <li className="separator">|</li>
            <li><Link to="/ofertas" onClick={() => setMenuMobileAbierto(false)}>Ofertas</Link></li>
            <li className="separator">|</li>
            <li><Link to="/nosotros" onClick={() => setMenuMobileAbierto(false)}>Nosotros</Link></li>
            <li className="separator">|</li>
            <li><Link to="/blog" onClick={() => setMenuMobileAbierto(false)}>Blog Culinario</Link></li>
            <li className="separator">|</li>
            <li><Link to="/contacto" onClick={() => setMenuMobileAbierto(false)}>Contacto</Link></li>

            <li className="cart-item-nav">
              <Link to="/carrito" className="cart-btn" onClick={() => setMenuMobileAbierto(false)}>
                🛒 Mi Pedido ({obtenerTotalItems ? obtenerTotalItems() : 0})
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <div className="user-subbar">
        <div className="user-links">
          {usuario ? (
            <>
              <span className="user-welcome">Hola, <strong>{usuario.nombre}</strong></span>
              <span className="separator">|</span>
              {esAdministrador && esAdministrador() && (
                <>
                  <Link to="/admin" className="admin-link">⚙️ Panel Administrador</Link>
                  <span className="separator">|</span>
                </>
              )}
              <button type="button" onClick={handleLogout} className="btn-logout-link">
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Iniciar sesión</Link>
              <span className="separator">|</span>
              <Link to="/registro">Crear cuenta</Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}