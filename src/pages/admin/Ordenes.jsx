import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8080/api';

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [estadosDisponibles, setEstadosDisponibles] = useState([]);
  const [usuariosMap, setUsuariosMap] = useState({});
  const [productosMap, setProductosMap] = useState({});
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);
  const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: 'success' });
  
  const location = useLocation();

  const mostrarMensaje = (mensaje, tipo = 'success') => {
    setToast({ mostrar: true, mensaje, tipo });
    setTimeout(() => setToast({ mostrar: false, mensaje: '', tipo: 'success' }), 3000);
  };

  // Helpers universales para leer tanto objetos JPA anidados como IDs planos
  const getEstId = (estObj) => estObj?.idEstadoOrden ?? estObj?.idEstado ?? estObj?.id ?? '';
  const getEstNombre = (estObj) => estObj?.nombreEstado ?? estObj?.nombre ?? estObj?.estado ?? '';

  const obtenerEstadoDeOrden = (orden) => {
    if (orden?.estadoOrden && typeof orden.estadoOrden === 'object') {
      return {
        id: getEstId(orden.estadoOrden),
        nombre: getEstNombre(orden.estadoOrden) || 'Pendiente'
      };
    }
    if (orden?.estado && typeof orden.estado === 'object') {
      return {
        id: getEstId(orden.estado),
        nombre: getEstNombre(orden.estado) || 'Pendiente'
      };
    }
    const nombreTexto = typeof orden?.estado === 'string' ? orden.estado : 'Pendiente';
    const encontrado = estadosDisponibles.find(
      e => getEstNombre(e).toLowerCase() === nombreTexto.toLowerCase()
    );
    return {
      id: encontrado ? getEstId(encontrado) : nombreTexto,
      nombre: nombreTexto
    };
  };

  const obtenerClienteDeOrden = (orden) => {
    // 1. Si Spring Boot envía el objeto usuario anidado dentro de la orden
    if (orden?.usuario && typeof orden.usuario === 'object') {
      return {
        id: orden.usuario.id ?? orden.usuario.idUsuario,
        nombre: orden.usuario.nombre || `Usuario #${orden.usuario.id}`,
        email: orden.usuario.email || 'Sin correo'
      };
    }
    // 2. Si envía solo el ID (usuarioId o usuario_id)
    const uId = orden?.usuarioId ?? orden?.usuario_id ?? orden?.idUsuario;
    if (uId !== undefined && usuariosMap[uId]) {
      return {
        id: uId,
        nombre: usuariosMap[uId].nombre,
        email: usuariosMap[uId].email || 'Sin correo'
      };
    }
    return {
      id: uId ?? 'N/A',
      nombre: orden?.nombre_cliente || (uId ? `Usuario #${uId}` : 'Cliente Registrado'),
      email: orden?.email_cliente || 'Sin correo'
    };
  };

  const obtenerNombreProducto = (item) => {
    // 1. Si Spring Boot envía el objeto producto anidado dentro de DetalleOrden
    if (item?.producto && typeof item.producto === 'object') {
      return item.producto.nombre || item.producto.nombreProducto || `Producto #${item.producto.id}`;
    }
    // 2. Si envía productoId o producto_id
    const pId = item?.productoId ?? item?.producto_id ?? item?.idProducto;
    if (pId !== undefined && productosMap[pId]) {
      return productosMap[pId].nombre;
    }
    return item?.producto_nombre || item?.nombreProducto || `Producto #${pId ?? item?.id}`;
  };

  const cargarDatos = async () => {
    try {
      const [resOrd, resEst, resUsu, resProd] = await Promise.all([
        fetch(`${API_BASE_URL}/ordenes`, { cache: 'no-store' }),
        fetch(`${API_BASE_URL}/ordenes/estados`, { cache: 'no-store' }),
        fetch(`${API_BASE_URL}/usuarios`, { cache: 'no-store' }),
        fetch(`${API_BASE_URL}/productos`, { cache: 'no-store' })
      ]);

      if (resOrd.ok) setOrdenes(await resOrd.json());
      if (resEst.ok) setEstadosDisponibles(await resEst.json());
      
      if (resUsu.ok) {
        const listaUsu = await resUsu.json();
        const mapaU = {};
        listaUsu.forEach(u => { mapaU[u.id ?? u.idUsuario] = u; });
        setUsuariosMap(mapaU);
      }

      if (resProd.ok) {
        const listaProd = await resProd.json();
        const mapaP = {};
        listaProd.forEach(p => { mapaP[p.id ?? p.idProducto] = p; });
        setProductosMap(mapaP);
      }
    } catch (error) {
      mostrarMensaje('Error al cargar las órdenes desde el servidor.', 'danger');
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [location.pathname, location.key]);

  const verDetalles = async (orden) => {
    setOrdenSeleccionada(orden);
    setCargandoDetalles(true);
    try {
      const idOrden = orden.id ?? orden.idOrden;
      const response = await fetch(`${API_BASE_URL}/detalle-ordenes/orden/${idOrden}`, { cache: 'no-store' });
      if (response.ok) {
        setDetalles(await response.json());
      } else {
        setDetalles([]);
      }
    } catch (error) {
      mostrarMensaje('Error al cargar los detalles de la orden.', 'danger');
    } finally {
      setCargandoDetalles(false);
    }
  };

  const cambiarEstado = async (orden, valorSeleccionado) => {
    const idOrden = orden.id ?? orden.idOrden;

    // Busca el objeto de estado completo en la lista traída de /api/ordenes/estados
    const estadoObj = estadosDisponibles.find(
      e => String(getEstId(e)) === String(valorSeleccionado) || getEstNombre(e) === valorSeleccionado
    );

    const nombreNuevoEstado = estadoObj ? getEstNombre(estadoObj) : valorSeleccionado;

    try {
      // Mantenemos todas las propiedades originales de la orden (incluido usuario) y actualizamos estadoOrden y estado
      const payload = {
        ...orden,
        estado: nombreNuevoEstado,
        estadoOrden: estadoObj ? estadoObj : { nombreEstado: nombreNuevoEstado }
      };

      const response = await fetch(`${API_BASE_URL}/ordenes/${idOrden}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const ordenActualizada = await response.json().catch(() => payload);
        setOrdenes(prev =>
          prev.map(o => (o.id ?? o.idOrden) === idOrden ? { ...o, ...ordenActualizada, estado: nombreNuevoEstado, estadoOrden: estadoObj || o.estadoOrden } : o)
        );
        mostrarMensaje(`✅ Orden #${idOrden} actualizada a "${nombreNuevoEstado}"`);
      } else {
        mostrarMensaje('❌ No se pudo actualizar el estado en el servidor.', 'danger');
      }
    } catch (error) {
      mostrarMensaje('Error de red al actualizar el estado.', 'danger');
    }
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return 'N/A';
    return new Date(fechaISO).toLocaleDateString('es-CL');
  };

  const badgeColor = (nombreEstado) => {
    const est = (nombreEstado || '').toLowerCase();
    if (est.includes('pendiente')) return 'bg-warning text-dark';
    if (est.includes('preparaci')) return 'bg-primary text-white';
    if (est.includes('camino')) return 'bg-info text-dark';
    if (est.includes('entregado') || est.includes('completado')) return 'bg-success text-white';
    if (est.includes('cancelado') || est.includes('rechazado')) return 'bg-danger text-white';
    return 'bg-secondary text-white';
  };

  // Si el endpoint /api/ordenes/estados aún no devuelve filas, usamos la lista por defecto
  const listaOpcionesEstado = estadosDisponibles.length > 0
    ? estadosDisponibles
    : [
        { id: 1, nombreEstado: 'Pendiente' },
        { id: 2, nombreEstado: 'En Preparación' },
        { id: 3, nombreEstado: 'En Camino' },
        { id: 4, nombreEstado: 'Entregado' },
        { id: 5, nombreEstado: 'Completado' },
        { id: 6, nombreEstado: 'Rechazado' }
      ];

  const clienteModal = ordenSeleccionada ? obtenerClienteDeOrden(ordenSeleccionada) : null;

  return (
    <div className="container-fluid py-4 position-relative">
      
      {toast.mostrar && (
        <div className={`alert alert-${toast.tipo} position-fixed top-0 end-0 m-3 shadow-lg z-3`} style={{ zIndex: 1050 }}>
          {toast.mensaje}
        </div>
      )}

      {ordenSeleccionada && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header bg-dark text-white">
                  <h5 className="modal-title">Detalles de la Orden #{ordenSeleccionada.id ?? ordenSeleccionada.idOrden}</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setOrdenSeleccionada(null)}></button>
                </div>
                
                <div className="modal-body">
                  <div className="row mb-3">
                    <div className="col-sm-6">
                      <p className="mb-1">
                        <strong>Cliente:</strong> {clienteModal?.nombre}
                      </p>
                      <p className="mb-1">
                        <strong>Email:</strong> {clienteModal?.email}
                      </p>
                    </div>
                    <div className="col-sm-6 text-sm-end">
                      <p className="mb-1"><strong>Fecha:</strong> {formatearFecha(ordenSeleccionada.fecha)}</p>
                      <p className="mb-1"><strong>Total Pagado:</strong> ${Number(ordenSeleccionada.total).toLocaleString('es-CL')}</p>
                    </div>
                  </div>
                  
                  <h6 className="fw-bold border-bottom pb-2">Productos comprados</h6>
                  
                  {cargandoDetalles ? (
                    <div className="text-center py-4"><div className="spinner-border text-primary" role="status"></div></div>
                  ) : detalles.length === 0 ? (
                    <p className="text-muted">No se encontraron productos para esta orden.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Producto</th>
                            <th className="text-center">Cantidad</th>
                            <th className="text-end">Precio Unit.</th>
                            <th className="text-end">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detalles.map((item, idx) => {
                            const precioUnit = Number(
                              item.precioUnitario ?? item.precio_unitario ?? item.producto?.precio ?? 0
                            );
                            return (
                              <tr key={item.id ?? item.idDetalleOrden ?? idx}>
                                <td className="fw-semibold">{obtenerNombreProducto(item)}</td>
                                <td className="text-center">{item.cantidad}</td>
                                <td className="text-end">${precioUnit.toLocaleString('es-CL')}</td>
                                <td className="text-end fw-bold">${(item.cantidad * precioUnit).toLocaleString('es-CL')}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setOrdenSeleccionada(null)}>Cerrar</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <h2 className="mb-4 fw-bold">Gestión de Órdenes</h2>

      <div className="card shadow-sm">
        <div className="card-header bg-white">
          <h5 className="mb-0">Historial de Compras</h5>
        </div>
        <div className="card-body p-0 p-md-3">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>N° Orden</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ordenes.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-4 text-muted">No hay órdenes registradas.</td></tr>
                ) : (
                  ordenes.map((orden, index) => {
                    const idOrden = orden.id ?? orden.idOrden ?? index;
                    const infoEstado = obtenerEstadoDeOrden(orden);
                    const infoCliente = obtenerClienteDeOrden(orden);

                    return (
                      <tr key={idOrden}>
                        <td><span className="badge bg-secondary">#{idOrden}</span></td>
                        <td className="fw-semibold">{infoCliente.nombre}</td>
                        <td>{formatearFecha(orden.fecha)}</td>
                        <td className="fw-bold">${Number(orden.total).toLocaleString('es-CL')}</td>
                        <td>
                          <select 
                            className={`form-select form-select-sm fw-bold ${badgeColor(infoEstado.nombre)}`} 
                            value={infoEstado.id || infoEstado.nombre} 
                            onChange={(e) => cambiarEstado(orden, e.target.value)}
                            style={{ width: '165px', border: 'none', cursor: 'pointer' }}
                          >
                            {listaOpcionesEstado.map((est, i) => {
                              const valId = getEstId(est) || getEstNombre(est);
                              const textoEst = getEstNombre(est);
                              return (
                                <option key={valId || i} value={valId} className="bg-white text-dark">
                                  {textoEst}
                                </option>
                              );
                            })}
                          </select>
                        </td>
                        <td>
                          <button onClick={() => verDetalles(orden)} className="btn btn-sm btn-outline-primary">
                            Ver detalles
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
    </div>
  );
}