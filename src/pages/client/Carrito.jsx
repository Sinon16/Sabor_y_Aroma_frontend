import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Carrito() {
  const {
    itemsCarrito,
    cargandoCarrito,
    actualizarCantidad,
    eliminarDelCarrito,
    limpiarCarrito,
    obtenerSubtotal,
    obtenerPrecioTotal,
    aplicarCupon,
    descuentoPorcentaje
  } = useCart();

  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [codigoCupon, setCodigoCupon] = useState('');
  const [mensaje, setMensaje] = useState('');

  const formatearPrecio = (valor) => {
    return Number(valor || 0).toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP'
    });
  };

  const handleAplicarCupon = () => {
    if (!codigoCupon) return;
    const res = aplicarCupon(codigoCupon);
    setMensaje(res.mensaje);
  };

  const handleIrAComprar = () => {
    if (itemsCarrito.length === 0) {
      alert('El carrito está vacío.');
      return;
    }

    const idUsuario = usuario?.id || usuario?.id_usuario || usuario?.usuario_id;

    if (!idUsuario) {
      alert('Debes iniciar sesión para completar tu compra.');
      navigate('/login');
      return;
    }

    navigate('/comprar');
  };

  if (cargandoCarrito) {
    return (
      <div className="container">
        <main className="main-content text-center-padding">
          <h2>Cargando tu pedido...</h2>
        </main>
      </div>
    );
  }

  return (
    <div className="container">
      <main className="main-content full-width">
        <h2>Mi carrito de compras</h2>

        <div className="cart-layout">
          <div className="cart-items" id="cart-items-container">
            {itemsCarrito.length === 0 ? (
              <div className="empty-cart-box">
                <p>Tu carrito está vacío.</p>
                <Link to="/catalogo" className="btn-primary">
                  Ir al Menú
                </Link>
              </div>
            ) : (
              itemsCarrito.map((prod) => (
                <div key={prod.id} className="cart-item">
                  <img
                    src={prod.imagen}
                    alt={prod.nombre}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=Sin+Imagen'; }}
                  />
                  <div className="cart-item-info">
                    <h3>
                      {prod.nombre}
                      {prod.porcentaje_descuento > 0 && (
                        <span className="badge-oferta">
                          -{prod.porcentaje_descuento}% OFF
                        </span>
                      )}
                    </h3>
                    <p>{prod.descripcion}</p>
                  </div>
                  <div className="cart-item-right">
                    {prod.porcentaje_descuento > 0 && prod.precioOriginal && (
                      <span className="precio-tachado">
                        {formatearPrecio(prod.precioOriginal * prod.cantidad)}
                      </span>
                    )}
                    <span className={prod.porcentaje_descuento > 0 ? 'precio-oferta' : 'precio-normal'}>
                      {formatearPrecio(prod.precio * prod.cantidad)}
                    </span>

                    <div className="cart-item-controls">
                      <button type="button" onClick={() => actualizarCantidad(prod.id, prod.cantidad - 1)}>-</button>
                      <input type="text" className="qty-input" value={prod.cantidad} readOnly />
                      <button type="button" onClick={() => actualizarCantidad(prod.id, prod.cantidad + 1)}>+</button>
                      <button 
                        type="button" 
                        onClick={() => eliminarDelCarrito(prod.id)}
                        className="btn-delete-item"
                        title="Eliminar producto"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-summary">
            <div className="cart-summary-row">
              <span>SUBTOTAL:</span>
              <span>{formatearPrecio(obtenerSubtotal())}</span>
            </div>

            {descuentoPorcentaje > 0 && (
              <div className="cupon-aplicado-row">
                <span>CUPÓN (10%):</span>
                <span>-{formatearPrecio(obtenerSubtotal() * descuentoPorcentaje)}</span>
              </div>
            )}

            <div className="cart-summary-total">
              <span>TOTAL:</span>
              <span className="total-price" id="cart-total">
                {formatearPrecio(obtenerPrecioTotal())}
              </span>
            </div>

            <div className="cupon-container">
              <label htmlFor="coupon-code" className="cupon-label">
                Ingrese el cupón de descuento
              </label>
              <div className="cupon-group">
                <input
                  type="text"
                  id="coupon-code"
                  value={codigoCupon}
                  onChange={(e) => setCodigoCupon(e.target.value)}
                  placeholder="SABOR10"
                />
                <button type="button" className="btn-aplicar" onClick={handleAplicarCupon}>
                  APLICAR
                </button>
              </div>
              {mensaje && (
                <p className={descuentoPorcentaje > 0 ? 'cupon-msg-exito' : 'cupon-msg-error'}>
                  {mensaje}
                </p>
              )}
            </div>

            <div className="cart-action-buttons-row">
              <button 
                type="button" 
                className="btn-limpiar-carrito" 
                onClick={limpiarCarrito}
                disabled={itemsCarrito.length === 0}
              >
                Limpiar
              </button>

              <button 
                type="button" 
                className="btn-pay" 
                onClick={handleIrAComprar} 
                disabled={itemsCarrito.length === 0}
              >
                Pagar
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}