import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

// URL Base del Backend Spring Boot
const API_BASE_URL = 'http://localhost:8080/api';

export default function Ofertas() {
  const navigate = useNavigate();
  const { agregarAlCarrito } = useCart();
  const { usuario } = useAuth();

  const [productosOferta, setProductosOferta] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensajeToast, setMensajeToast] = useState('');

  useEffect(() => {
    const cargarOfertas = async () => {
      try {
        setCargando(true);
        const res = await fetch(`${API_BASE_URL}/productos`);
        if (res.ok) {
          const data = await res.json();
          // Filtra productos que contengan un objeto de oferta con descuento mayor a 0
          const enOferta = data.filter(p => {
            const porcentaje = p.oferta?.porcentajeDescuento || p.porcentaje_descuento;
            return Number(porcentaje) > 0;
          });
          setProductosOferta(enOferta);
        }
      } catch (err) {
        console.error('Error al consultar ofertas en Spring Boot:', err);
      } finally {
        setCargando(false);
      }
    };

    cargarOfertas();
  }, []);

  const formatearPrecio = (valor) => {
    return Number(valor || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
  };

  const obtenerPorcentaje = (producto) => {
    return Number(producto.oferta?.porcentajeDescuento || producto.porcentaje_descuento || 0);
  };

  const calcularPrecioOferta = (precioBase, porcentaje) => {
    if (!porcentaje || porcentaje <= 0) return precioBase;
    return Math.round(precioBase * (1 - porcentaje / 100));
  };

  const handleAgregarAlPedido = async (producto) => {
    if (!usuario) {
      setMensajeToast('⚠️ Debes iniciar sesión para agregar ofertas al pedido.');
      setTimeout(() => {
        setMensajeToast('');
        navigate('/login');
      }, 2000);
      return;
    }

    const resultado = await agregarAlCarrito(producto);
    if (resultado?.requiereLogin) {
      setMensajeToast('⚠️ Debes iniciar sesión para realizar pedidos.');
      setTimeout(() => {
        setMensajeToast('');
        navigate('/login');
      }, 2000);
      return;
    }

    setMensajeToast(`¡"${producto.nombre}" en oferta agregado al pedido!`);
    setTimeout(() => setMensajeToast(''), 3000);
  };

  if (cargando) {
    return (
      <div className="container">
        <main className="main-content text-center-padding">
          <h2>Cargando ofertas del menú...</h2>
        </main>
      </div>
    );
  }

  return (
    <div className="container">
      {mensajeToast && <div className="toast-notificacion">🛒 {mensajeToast}</div>}

      <main className="main-content full-width">
        <h2 className="title-ofertas">🔥 Ofertas & Descuentos Especiales</h2>
        <p className="subtitle-ofertas">Disfruta de nuestros platillos seleccionados con descuentos exclusivos.</p>

        {productosOferta.length === 0 ? (
          <div className="text-center-padding">
            <p>No hay productos en oferta en este momento.</p>
          </div>
        ) : (
          <div className="productos-grid">
            {productosOferta.map((p) => {
              const porcentajeDesc = obtenerPorcentaje(p);
              const precioConDescuento = calcularPrecioOferta(p.precio, porcentajeDesc);

              return (
                <article key={p.id} className="hero-banner card-oferta">
                  {/* Etiqueta destacada de descuento */}
                  <div className="badge-descuento">
                    -{porcentajeDesc}% OFF
                  </div>

                  <img 
                    src={p.imagen} 
                    alt={p.nombre} 
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=Sin+Imagen'; }}
                  />

                  <h3>{p.nombre}</h3>
                  <p className="descripcion-corta">{p.descripcion}</p>

                  <div className="precios-oferta-box">
                    <span className="precio-tachado">{formatearPrecio(p.precio)}</span>
                    <span className="precio-oferta-destacado">{formatearPrecio(precioConDescuento)}</span>
                  </div>

                  <button 
                    className="btn-primary" 
                    onClick={() => handleAgregarAlPedido(p)}
                  >
                    Agregar al Pedido
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}