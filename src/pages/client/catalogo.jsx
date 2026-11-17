import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../service/api';

export default function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoriaURL = searchParams.get('cat') || 'todas';
  const idURL = searchParams.get('id');

  const { agregarAlCarrito } = useCart();
  const { usuario } = useAuth();

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorBD, setErrorBD] = useState('');

  const [productoDetalle, setProductoDetalle] = useState(null);
  const [mensajeToast, setMensajeToast] = useState('');

  const cargarDatosBD = async () => {
    try {
      setCargando(true);
      setErrorBD('');

      const [resProd, resCat] = await Promise.all([
        apiFetch('/productos'),
        apiFetch('/categorias')
      ]);

      if (!resProd.ok || !resCat.ok) {
        throw new Error('Error de comunicación con Spring Boot.');
      }

      const dataProd = await resProd.json();
      const dataCat = await resCat.json();

      setProductos(dataProd);
      setCategorias(dataCat);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setErrorBD('No se pudo conectar con la base de datos para cargar el menú.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosBD();

    const manejarCambiosBD = () => cargarDatosBD();
    window.addEventListener('categoryChange', manejarCambiosBD);

    return () => {
      window.removeEventListener('categoryChange', manejarCambiosBD);
    };
  }, []);

  useEffect(() => {
    if (productos.length > 0 && idURL) {
      const encontrado = productos.find(p => String(p.id) === String(idURL));
      if (encontrado) {
        setProductoDetalle(encontrado);
      }
    } else if (!idURL) {
      setProductoDetalle(null);
    }
  }, [productos, idURL]);

  const formatearPrecio = (valor) => {
    const num = Number(valor) || 0;
    return num.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
  };

  // Calcula datos de oferta (porcentaje, precio original y precio con descuento)
  const obtenerInfoPrecio = (prod) => {
    const precioOriginal = Number(prod?.precio || 0);
    const porcentajeDesc = Number(prod?.oferta?.porcentajeDescuento || 0);
    const tieneOferta = porcentajeDesc > 0 && porcentajeDesc < 100;
    const precioFinal = tieneOferta
      ? Math.round(precioOriginal * (1 - porcentajeDesc / 100))
      : precioOriginal;

    return {
      tieneOferta,
      porcentajeDesc,
      precioOriginal,
      precioFinal
    };
  };

  const handleAgregarAlPedido = async (producto) => {
    if (!usuario) {
      setMensajeToast('⚠️ Debes iniciar sesión para agregar productos al pedido.');
      setTimeout(() => {
        setMensajeToast('');
        navigate('/login');
      }, 2000);
      return;
    }

    const resultado = await agregarAlCarrito(producto);
    if (resultado?.requiereLogin) {
      setMensajeToast('⚠️ Debes iniciar sesión para agregar productos al pedido.');
      setTimeout(() => {
        setMensajeToast('');
        navigate('/login');
      }, 2000);
      return;
    }

    setMensajeToast(`¡"${producto.nombre}" agregado al pedido!`);
    setTimeout(() => setMensajeToast(''), 3000);
  };

  const verDetalle = (prod) => {
    setProductoDetalle(prod);
    setSearchParams({ id: prod.id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const volverAlListado = () => {
    setProductoDetalle(null);
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const productosFiltrados = (categoriaURL === 'todas' || !categoriaURL)
    ? productos
    : productos.filter(p => {
        const nombreCat = typeof p.categoria === 'object'
          ? p.categoria?.nombreCategoria
          : p.categoria;
        return nombreCat?.trim().toLowerCase() === categoriaURL.trim().toLowerCase();
      });

  const obtenerRecomendados = (idActual) => {
    const disponibles = productos.filter(p => p.id !== idActual);
    return [...disponibles].sort(() => 0.5 - Math.random()).slice(0, 4);
  };

  // Renderizado reutilizable para bloque de precios con o sin descuento
  const renderBloquePrecio = (prod) => {
    const { tieneOferta, porcentajeDesc, precioOriginal, precioFinal } = obtenerInfoPrecio(prod);

    if (!tieneOferta) {
      return <p className="precio">{formatearPrecio(precioOriginal)}</p>;
    }

    return (
      <div className="precio-oferta-box" style={{ margin: '8px 0' }}>
        <span
          className="badge-oferta"
          style={{
            backgroundColor: '#e63946',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            display: 'inline-block',
            marginBottom: '4px'
          }}
        >
          -{porcentajeDesc}% OFF
        </span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span
            style={{
              textDecoration: 'line-through',
              color: '#888',
              fontSize: '0.9rem'
            }}
          >
            {formatearPrecio(precioOriginal)}
          </span>
          <span className="precio" style={{ color: '#2a9d8f', fontWeight: 'bold', margin: 0 }}>
            {formatearPrecio(precioFinal)}
          </span>
        </div>
      </div>
    );
  };

  if (cargando) {
    return (
      <div className="container">
        <main className="main-content text-center-padding">
          <h2>Cargando productos de la base de datos...</h2>
        </main>
      </div>
    );
  }

  if (errorBD) {
    return (
      <div className="container">
        <main className="main-content text-center-padding">
          <div className="alert-error">{errorBD}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="container">
      {mensajeToast && <div className="toast-notificacion">🛒 {mensajeToast}</div>}

      {productoDetalle ? (
        <main className="main-content full-width">
          <div className="back-container margin-bottom-15">
            <button onClick={volverAlListado} className="btn-volver-blog">
              ← Volver al Menú
            </button>
          </div>

          <div className="detalle-container">
            <div className="detalle-imagen">
              <img
                src={productoDetalle.imagen}
                alt={productoDetalle.nombre}
                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Sin+Imagen'; }}
              />
            </div>
            <div className="detalle-info">
              <h2>{productoDetalle.nombre}</h2>

              {(() => {
                const { tieneOferta, porcentajeDesc, precioOriginal, precioFinal } = obtenerInfoPrecio(productoDetalle);
                return tieneOferta ? (
                  <div style={{ margin: '10px 0' }}>
                    <span
                      className="badge-oferta"
                      style={{
                        backgroundColor: '#e63946',
                        color: '#fff',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        marginRight: '10px'
                      }}
                    >
                      -{porcentajeDesc}% OFF
                    </span>
                    <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '1.1rem', marginRight: '10px' }}>
                      {formatearPrecio(precioOriginal)}
                    </span>
                    <span className="precio" style={{ color: '#2a9d8f', fontWeight: 'bold', fontSize: '1.4rem' }}>
                      {formatearPrecio(precioFinal)}
                    </span>
                  </div>
                ) : (
                  <span className="precio">{formatearPrecio(precioOriginal)}</span>
                );
              })()}

              <p>{productoDetalle.descripcion}</p>
              <div>
                <button
                  className="btn-primary"
                  onClick={() => handleAgregarAlPedido(productoDetalle)}
                >
                  Agregar al Pedido
                </button>
              </div>
            </div>
          </div>

          <section className="productos-recomendados margin-top-30">
            <h3>También te podría gustar</h3>
            <div className="productos-grid">
              {obtenerRecomendados(productoDetalle.id).map((rec) => (
                <article key={rec.id} className="hero-banner">
                  <img
                    src={rec.imagen}
                    alt={rec.nombre}
                    onClick={() => verDetalle(rec)}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=Sin+Imagen'; }}
                    className="clickable"
                  />
                  <h3 onClick={() => verDetalle(rec)} className="clickable">
                    {rec.nombre}
                  </h3>
                  {renderBloquePrecio(rec)}
                  <button
                    className="btn-primary"
                    onClick={() => handleAgregarAlPedido(rec)}
                  >
                    Agregar al Pedido
                  </button>
                </article>
              ))}
            </div>
          </section>
        </main>
      ) : (
        <>
          <aside className="sidebar">
            <h3>Categorías</h3>
            <ul>
              <li>
                <a
                  href="#"
                  className={categoriaURL === 'todas' || !categoriaURL ? 'active' : ''}
                  onClick={(e) => { e.preventDefault(); setSearchParams({}); }}
                >
                  🍽️ Todo
                </a>
              </li>
              {categorias.map((cat) => (
                <li key={cat.idCategoria}>
                  <a
                    href="#"
                    className={categoriaURL.toLowerCase() === cat.nombreCategoria.toLowerCase() ? 'active' : ''}
                    onClick={(e) => {
                      e.preventDefault();
                      setSearchParams({ cat: cat.nombreCategoria });
                    }}
                  >
                    {cat.nombreCategoria}
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          <main className="main-content">
            <h2>Nuestro Menú Gastronómico</h2>

            <div className="productos-grid">
              {productosFiltrados.length === 0 ? (
                <p>No hay productos disponibles en esta categoría.</p>
              ) : (
                productosFiltrados.map((p) => (
                  <article key={p.id} className="hero-banner">
                    <img
                      src={p.imagen}
                      alt={p.nombre}
                      onClick={() => verDetalle(p)}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=Sin+Imagen'; }}
                      className="clickable"
                    />
                    <h3 onClick={() => verDetalle(p)} className="clickable">
                      {p.nombre}
                    </h3>
                    {renderBloquePrecio(p)}
                    <button
                      className="btn-primary"
                      onClick={() => handleAgregarAlPedido(p)}
                    >
                      Agregar al Pedido
                    </button>
                  </article>
                ))
              )}
            </div>
          </main>
        </>
      )}
    </div>
  );
}