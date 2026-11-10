import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8080/api';

export default function Dashboard() {
  const [metricas, setMetricas] = useState({
    compras: 0,
    productos: 0,
    usuarios: 0
  });

  const containerRef = useRef(null);
  const location = useLocation();

  // Función que consulta cada endpoint de forma independiente para que si uno tarda, los demás carguen igual
  const cargarMetricas = useCallback(async () => {
    try {
      const [resOrdenes, resProductos, resUsuarios] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/ordenes`, { cache: 'no-store' }),
        fetch(`${API_BASE_URL}/productos`, { cache: 'no-store' }),
        fetch(`${API_BASE_URL}/usuarios`, { cache: 'no-store' })
      ]);

      let totalCompras = 0;
      let totalProductos = 0;
      let totalUsuarios = 0;

      if (resOrdenes.status === 'fulfilled' && resOrdenes.value.ok) {
        const data = await resOrdenes.value.json();
        totalCompras = Array.isArray(data) ? data.length : 0;
      }

      if (resProductos.status === 'fulfilled' && resProductos.value.ok) {
        const data = await resProductos.value.json();
        totalProductos = Array.isArray(data) ? data.length : 0;
      }

      if (resUsuarios.status === 'fulfilled' && resUsuarios.value.ok) {
        const data = await resUsuarios.value.json();
        totalUsuarios = Array.isArray(data) ? data.length : 0;
      }

      setMetricas({
        compras: totalCompras,
        productos: totalProductos,
        usuarios: totalUsuarios
      });
    } catch (error) {
      console.error("Error cargando métricas:", error);
    }
  }, []);

  // 1. Carga al entrar y reintenta automáticamente si aún está en 0
  useEffect(() => {
    cargarMetricas();

    const timerReintento = setTimeout(() => {
      cargarMetricas();
    }, 500);

    // Mantiene los contadores sincronizados con la BD cada 3 segundos
    const intervalo = setInterval(() => {
      cargarMetricas();
    }, 3000);

    return () => {
      clearTimeout(timerReintento);
      clearInterval(intervalo);
    };
  }, [cargarMetricas, location.pathname, location.key]);

  // 2. Detecta cuando AdminLayout cambia este panel de display:none a display:block
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        cargarMetricas();
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [cargarMetricas]);

  return (
    <div ref={containerRef} className="container-fluid py-4">
      <div className="mb-4">
        <h2 className="fw-bold m-0">Panel de control</h2>
        <p className="text-muted">Resumen de las actividades diarias</p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card bg-primary text-white shadow-sm h-100 border-0 rounded-3">
            <div className="card-body d-flex flex-column justify-content-between p-4">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <span className="fs-1 me-3">🛒</span>
                <h2 className="display-5 fw-bold mb-0">{metricas.compras}</h2>
              </div>
              <div className="text-center">
                <h5 className="fw-bold mb-1">Compras Totales</h5>
                <small className="opacity-75">Probabilidad de aumento: 20%</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card bg-success text-white shadow-sm h-100 border-0 rounded-3">
            <div className="card-body d-flex flex-column justify-content-between p-4">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <span className="fs-1 me-3">📦</span>
                <h2 className="display-5 fw-bold mb-0">{metricas.productos}</h2>
              </div>
              <div className="text-center">
                <h5 className="fw-bold mb-1">Productos</h5>
                <small className="opacity-75">Inventario actual</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card bg-warning text-dark shadow-sm h-100 border-0 rounded-3">
            <div className="card-body d-flex flex-column justify-content-between p-4">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <span className="fs-1 me-3">👥</span>
                <h2 className="display-5 fw-bold mb-0">{metricas.usuarios}</h2>
              </div>
              <div className="text-center">
                <h5 className="fw-bold mb-1">Usuarios</h5>
                <small className="opacity-75">Nuevos usuarios</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-6 col-md-3">
          <Link to="/admin" className="text-decoration-none text-dark">
            <div className="card h-100 shadow-sm border-0 text-center p-3 hover-effect">
              <div className="card-body">
                <div className="fs-1 mb-2">📊</div>
                <h6 className="fw-bold">Panel de control</h6>
                <p className="text-muted small mb-0">Visión general de todas las métricas.</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-6 col-md-3">
          <Link to="/admin/ordenes" className="text-decoration-none text-dark">
            <div className="card h-100 shadow-sm border-0 text-center p-3 hover-effect">
              <div className="card-body">
                <div className="fs-1 mb-2">🛒</div>
                <h6 className="fw-bold">Órdenes</h6>
                <p className="text-muted small mb-0">Seguimiento de compras</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-6 col-md-3">
          <Link to="/admin/productos" className="text-decoration-none text-dark">
            <div className="card h-100 shadow-sm border-0 text-center p-3 hover-effect">
              <div className="card-body">
                <div className="fs-1 mb-2">📦</div>
                <h6 className="fw-bold">Productos</h6>
                <p className="text-muted small mb-0">Administrar inventario</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-6 col-md-3">
          <Link to="/admin/categorias" className="text-decoration-none text-dark">
            <div className="card h-100 shadow-sm border-0 text-center p-3 hover-effect">
              <div className="card-body">
                <div className="fs-1 mb-2">📁</div>
                <h6 className="fw-bold">Categorías</h6>
                <p className="text-muted small mb-0">Organizar productos</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-6 col-md-3">
          <Link to="/admin/usuarios" className="text-decoration-none text-dark">
            <div className="card h-100 shadow-sm border-0 text-center p-3 hover-effect">
              <div className="card-body">
                <div className="fs-1 mb-2">👥</div>
                <h6 className="fw-bold">Usuarios</h6>
                <p className="text-muted small mb-0">Gestión de cuentas</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-6 col-md-3">
          <Link to="/admin/reportes" className="text-decoration-none text-dark">
            <div className="card h-100 shadow-sm border-0 text-center p-3 hover-effect">
              <div className="card-body">
                <div className="fs-1 mb-2">📈</div>
                <h6 className="fw-bold">Informes</h6>
                <p className="text-muted small mb-0">Informes de operaciones</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-6 col-md-3">
          <Link to="/admin/perfil" className="text-decoration-none text-dark">
            <div className="card h-100 shadow-sm border-0 text-center p-3 hover-effect">
              <div className="card-body">
                <div className="fs-1 mb-2">👤</div>
                <h6 className="fw-bold">Perfil</h6>
                <p className="text-muted small mb-0">Tu información personal</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-6 col-md-3">
          <Link to="/" className="text-decoration-none text-dark">
            <div className="card h-100 shadow-sm border-0 text-center p-3 hover-effect">
              <div className="card-body">
                <div className="fs-1 mb-2">🏪</div>
                <h6 className="fw-bold">Tienda</h6>
                <p className="text-muted small mb-0">Ver interfaz de cliente.</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}