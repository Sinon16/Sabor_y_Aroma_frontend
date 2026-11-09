import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8080/api';

export default function Comprar() {
  const { itemsCarrito, obtenerPrecioTotal, limpiarCarrito } = useCart();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [estadoPago, setEstadoPago] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [numOrdenGenerada, setNumOrdenGenerada] = useState('');

  const [resumenPedido, setResumenPedido] = useState([]);
  const [totalPedido, setTotalPedido] = useState(0);

  const [formData, setFormData] = useState({
    nombre: usuario?.nombre?.split(' ')[0] || '',
    apellidos: usuario?.nombre?.split(' ').slice(1).join(' ') || '',
    correo: usuario?.email || '',
    calle: '',
    departamento: '',
    region: usuario?.region || '',
    comuna: usuario?.comuna || '',
    indicaciones: ''
  });

  const [listaRegiones, setListaRegiones] = useState([]);
  const [listaComunas, setListaComunas] = useState([]);

  // Guardar copia del carrito para la vista de resumen tras la compra
  useEffect(() => {
    if (itemsCarrito.length > 0 && estadoPago === null) {
      setResumenPedido(itemsCarrito);
      setTotalPedido(obtenerPrecioTotal());
    }
  }, [itemsCarrito, obtenerPrecioTotal, estadoPago]);

  // Cargar lista de regiones desde Spring Boot
  useEffect(() => {
    const cargarRegiones = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/regiones`);
        if (res.ok) {
          const data = await res.json();
          setListaRegiones(data);
        }
      } catch (err) {
        console.error('Error al cargar regiones desde Spring Boot:', err);
      }
    };
    cargarRegiones();
  }, []);

  // Cargar comunas filtradas por región desde Spring Boot
  useEffect(() => {
    if (!formData.region) {
      setListaComunas([]);
      return;
    }
    const cargarComunas = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/comunas?region=${encodeURIComponent(formData.region)}`);
        if (res.ok) {
          const data = await res.json();
          setListaComunas(data);
        }
      } catch (err) {
        console.error('Error al cargar comunas desde Spring Boot:', err);
      }
    };
    cargarComunas();
  }, [formData.region]);

  const formatearPrecio = (valor) => {
    return Number(valor || 0).toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP'
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePagoExitoso = async () => {
    const idUsuario = usuario?.id || usuario?.idUsuario || usuario?.id_usuario;
    if (!idUsuario) {
      alert('Debes estar autenticado para finalizar la compra.');
      navigate('/login');
      return;
    }

    try {
      setProcesando(true);

      // Estructura adaptada a la entidad DetalleOrden / Producto de JPA
      const detallesFormateados = resumenPedido.map((item) => ({
        cantidad: item.cantidad,
        precioUnitario: item.precio,
        producto: {
          id: Number(item.id || item.producto_id || item.producto?.id)
        }
      }));

      // Payload JSON completo coincidente con la entidad Orden de Spring Boot
      const ordenPayload = {
        total: totalPedido,
        usuario: {
          id: Number(idUsuario)
        },
        estadoOrden: {
          idEstado: 1 // Estado inicial: Pendiente
        },
        detalles: detallesFormateados,
        // DTOs planos para compatibilidad adicional
        usuarioId: Number(idUsuario),
        items: detallesFormateados
      };

      const res = await fetch(`${API_BASE_URL}/ordenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ordenPayload)
      });

      if (res.ok) {
        const data = await res.json();
        const idGenerado = data.id || data.idOrden || Math.floor(100000 + Math.random() * 900000);
        setNumOrdenGenerada(idGenerado);
        await limpiarCarrito();
        setEstadoPago(1);
      } else {
        const errText = await res.text();
        console.error('Error al guardar la orden en Spring Boot:', errText);
        alert('Hubo un problema al registrar la orden en la base de datos.');
      }
    } catch (error) {
      console.error('Error procesando pago exitoso en Spring Boot:', error);
      alert('No se pudo conectar con el servidor.');
    } finally {
      setProcesando(false);
    }
  };

  const handlePagoFallido = () => {
    setNumOrdenGenerada(Math.floor(10000000 + Math.random() * 90000000));
    setEstadoPago(2);
  };

  // VISTA 1: PAGO CORRECTO
  if (estadoPago === 1) {
    return (
      <div className="checkout-container">
        <div className="checkout-card">
          <div className="checkout-header-success">
            <h2>✅ Se ha realizado la compra. nro #{numOrdenGenerada}</h2>
            <span className="order-code-badge">Código orden: ORDER{numOrdenGenerada}</span>
          </div>
          <p className="checkout-subtitle">Detalle de la transacción realizada</p>

          <div className="checkout-section">
            <div className="form-row-responsive form-row-3">
              <div className="form-group">
                <label>Nombre*</label>
                <input type="text" value={formData.nombre} readOnly className="input-readonly" />
              </div>
              <div className="form-group">
                <label>Apellidos*</label>
                <input type="text" value={formData.apellidos} readOnly className="input-readonly" />
              </div>
              <div className="form-group">
                <label>Correo*</label>
                <input type="text" value={formData.correo} readOnly className="input-readonly" />
              </div>
            </div>
          </div>

          <div className="checkout-section">
            <h3>Dirección de entrega de los productos</h3>
            <div className="form-row-responsive form-row-2">
              <div className="form-group">
                <label>Calle*</label>
                <input type="text" value={formData.calle || 'Dirección registrada'} readOnly className="input-readonly" />
              </div>
              <div className="form-group">
                <label>Departamento (opcional)</label>
                <input type="text" value={formData.departamento || 'N/A'} readOnly className="input-readonly" />
              </div>
            </div>

            <div className="form-row-responsive form-row-2">
              <div className="form-group">
                <label>Región*</label>
                <input type="text" value={formData.region} readOnly className="input-readonly" />
              </div>
              <div className="form-group">
                <label>Comuna*</label>
                <input type="text" value={formData.comuna} readOnly className="input-readonly" />
              </div>
            </div>

            {formData.indicaciones && (
              <div className="form-group">
                <label>Indicaciones para la entrega (opcional)</label>
                <textarea value={formData.indicaciones} readOnly className="input-readonly" rows="2" />
              </div>
            )}
          </div>

          <div className="checkout-table-wrapper">
            <table className="checkout-table">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {resumenPedido.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <img src={item.imagen} alt={item.nombre} className="thumb-table" />
                    </td>
                    <td>{item.nombre}</td>
                    <td>{formatearPrecio(item.precio)}</td>
                    <td>{item.cantidad}</td>
                    <td>{formatearPrecio(item.precio * item.cantidad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="checkout-total-banner">
            Total pagado: {formatearPrecio(totalPedido)}
          </div>

          <div className="checkout-actions-row">
            <button type="button" className="btn-boleta-pdf" onClick={() => alert('Descargando boleta PDF...')}>
              Imprimir boleta en PDF
            </button>
            <button type="button" className="btn-boleta-email" onClick={() => alert('Boleta enviada a tu correo.')}>
              Enviar boleta por email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VISTA 2: PAGO INCORRECTO
  if (estadoPago === 2) {
    return (
      <div className="checkout-container">
        <div className="checkout-card">
          <div className="checkout-header-error">
            <h2>❌ No se pudo realizar el pago. nro #{numOrdenGenerada}</h2>
          </div>
          <p className="checkout-subtitle">Detalle de compra</p>

          <div className="text-center-padding">
            <button type="button" className="btn-reintentar-pago" onClick={() => setEstadoPago(null)}>
              VOLVER A REALIZAR EL PAGO
            </button>
          </div>

          <div className="checkout-section">
            <div className="form-row-responsive form-row-3">
              <div className="form-group">
                <label>Nombre*</label>
                <input type="text" value={formData.nombre} readOnly className="input-readonly" />
              </div>
              <div className="form-group">
                <label>Apellidos*</label>
                <input type="text" value={formData.apellidos} readOnly className="input-readonly" />
              </div>
              <div className="form-group">
                <label>Correo*</label>
                <input type="text" value={formData.correo} readOnly className="input-readonly" />
              </div>
            </div>
          </div>

          <div className="checkout-section">
            <h3>Dirección de entrega de los productos</h3>
            <div className="form-row-responsive form-row-2">
              <div className="form-group">
                <label>Calle*</label>
                <input type="text" value={formData.calle || 'Dirección no completada'} readOnly className="input-readonly" />
              </div>
              <div className="form-group">
                <label>Departamento (opcional)</label>
                <input type="text" value={formData.departamento || 'N/A'} readOnly className="input-readonly" />
              </div>
            </div>

            <div className="form-row-responsive form-row-2">
              <div className="form-group">
                <label>Región*</label>
                <input type="text" value={formData.region} readOnly className="input-readonly" />
              </div>
              <div className="form-group">
                <label>Comuna*</label>
                <input type="text" value={formData.comuna} readOnly className="input-readonly" />
              </div>
            </div>
          </div>

          <div className="checkout-table-wrapper">
            <table className="checkout-table">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {resumenPedido.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <img src={item.imagen} alt={item.nombre} className="thumb-table" />
                    </td>
                    <td>{item.nombre}</td>
                    <td>{formatearPrecio(item.precio)}</td>
                    <td>{item.cantidad}</td>
                    <td>{formatearPrecio(item.precio * item.cantidad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="checkout-total-banner">
            Total a pagar: {formatearPrecio(totalPedido)}
          </div>
        </div>
      </div>
    );
  }

  // VISTA FORMULARIO PRINCIPAL
  return (
    <div className="checkout-container">
      <div className="checkout-card">
        <div className="checkout-main-header">
          <div>
            <h2>Carrito de compra</h2>
            <p className="checkout-subtitle">Completa la siguiente información</p>
          </div>
          <div className="badge-total-pagar">
            Total a pagar: {formatearPrecio(totalPedido)}
          </div>
        </div>

        <div className="checkout-table-wrapper">
          <table className="checkout-table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {resumenPedido.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '1rem' }}>
                    No hay productos en el pedido. <Link to="/catalogo">Ir al Menú</Link>
                  </td>
                </tr>
              ) : (
                resumenPedido.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <img src={item.imagen} alt={item.nombre} className="thumb-table" />
                    </td>
                    <td>{item.nombre}</td>
                    <td>{formatearPrecio(item.precio)}</td>
                    <td>{item.cantidad}</td>
                    <td>{formatearPrecio(item.precio * item.cantidad)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="checkout-section">
          <h3>Información del cliente</h3>
          <p className="checkout-subtitle">Completa la siguiente información</p>

          <div className="form-row-responsive form-row-2">
            <div className="form-group">
              <label htmlFor="nombre">Nombre*</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                className="form-input-dark"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="apellidos">Apellidos*</label>
              <input
                type="text"
                id="apellidos"
                name="apellidos"
                className="form-input-dark"
                value={formData.apellidos}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="correo">Correo*</label>
            <input
              type="email"
              id="correo"
              name="correo"
              className="form-input-dark"
              value={formData.correo}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="checkout-section">
          <h3>Dirección de entrega de los productos</h3>
          <p className="checkout-subtitle">Ingrese dirección de forma detallada</p>

          <div className="form-row-responsive form-row-2">
            <div className="form-group">
              <label htmlFor="calle">Calle*</label>
              <input
                type="text"
                id="calle"
                name="calle"
                className="form-input-dark"
                value={formData.calle}
                onChange={handleChange}
                placeholder="Ej: Av. Principal 1234"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="departamento">Departamento (opcional)</label>
              <input
                type="text"
                id="departamento"
                name="departamento"
                className="form-input-dark"
                value={formData.departamento}
                onChange={handleChange}
                placeholder="Ej: 603"
              />
            </div>
          </div>

          <div className="form-row-responsive form-row-2">
            <div className="form-group">
              <label htmlFor="region">Región*</label>
              <select
                id="region"
                name="region"
                className="form-input-dark"
                value={formData.region}
                onChange={handleChange}
              >
                <option value="">-- Seleccione la región --</option>
                {listaRegiones.map((reg) => {
                  const nom = typeof reg === 'string' ? reg : reg.nombreRegion || reg.nombre_region || reg.nombre;
                  return <option key={nom} value={nom}>{nom}</option>;
                })}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="comuna">Comuna*</label>
              <select
                id="comuna"
                name="comuna"
                className="form-input-dark"
                value={formData.comuna}
                onChange={handleChange}
                disabled={!formData.region}
              >
                <option value="">-- Seleccione la comuna --</option>
                {listaComunas.map((com) => {
                  const nom = typeof com === 'string' ? com : com.nombreComuna || com.nombre_comuna || com.nombre;
                  return <option key={nom} value={nom}>{nom}</option>;
                })}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="indicaciones">Indicaciones para la entrega (opcional)</label>
            <textarea
              id="indicaciones"
              name="indicaciones"
              className="form-input-dark"
              rows="3"
              value={formData.indicaciones}
              onChange={handleChange}
              placeholder="Ej.: Entre calles, color del edificio, no tiene timbre."
            />
          </div>
        </div>

        <div className="payment-test-actions">
          <div className="payment-btn-box">
            <span className="payment-label-success">Pago correcto</span>
            <button
              type="button"
              className="btn-pago-verde"
              onClick={handlePagoExitoso}
              disabled={procesando || resumenPedido.length === 0}
            >
              {procesando ? 'PROCESANDO...' : `Pagar ahora ${formatearPrecio(totalPedido)}`}
            </button>
          </div>

          <div className="payment-btn-box">
            <span className="payment-label-error">Pago incorrecto</span>
            <button
              type="button"
              className="btn-pago-rojo"
              onClick={handlePagoFallido}
              disabled={procesando || resumenPedido.length === 0}
            >
              Pagar ahora {formatearPrecio(totalPedido)}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}