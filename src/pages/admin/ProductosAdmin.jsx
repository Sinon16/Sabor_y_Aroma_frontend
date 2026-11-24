import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { apiFetch } from '../../service/api';

export default function ProductosAdmin() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ofertas, setOfertas] = useState([]);

  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    stock: '',
    categoriaId: '',
    ofertaId: '',
    imagen: '',
    descripcion: ''
  });

  const [editandoId, setEditandoId] = useState(null);
  const [filtroActivo, setFiltroActivo] = useState('todos');
  const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: 'success' });

  const location = useLocation();

  const mostrarMensaje = (mensaje, tipo = 'success') => {
    setToast({ mostrar: true, mensaje, tipo });
    setTimeout(() => setToast({ mostrar: false, mensaje: '', tipo: 'success' }), 3500);
  };

  const getCatId = (c) => c?.idCategoria ?? c?.id ?? '';
  const getCatNombre = (c) => c?.nombreCategoria ?? c?.nombre ?? '';

  const getOfertaId = (o) => o?.idOferta ?? o?.id ?? '';
  const getOfertaPorcentaje = (o) => o?.porcentajeDescuento ?? o?.porcentaje ?? o?.descuento ?? 0;
  const getOfertaNombre = (o) => o?.nombreOferta ?? o?.descripcion ?? o?.nombre ?? `Promo ${getOfertaPorcentaje(o)}% OFF`;

  const normalizarImagen = (ruta) => {
    if (!ruta) return 'https://via.placeholder.com/40?text=Sin+Img';
    if (ruta.startsWith('http') || ruta.startsWith('data:') || ruta.startsWith('/')) {
      return ruta;
    }
    return `/${ruta}`;
  };

  const cargarDatos = async () => {
    try {
      const [resProd, resCat, resOfe] = await Promise.all([
        apiFetch('/productos', { cache: 'no-store' }),
        apiFetch('/categorias', { cache: 'no-store' }),
        apiFetch('/ofertas', { cache: 'no-store' })
      ]);

      if (resProd.ok) setProductos(await resProd.json());
      if (resCat.ok) setCategorias(await resCat.json());
      if (resOfe.ok) setOfertas(await resOfe.json());
    } catch (error) {
      mostrarMensaje('Error de conexión con el servidor.', 'danger');
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [location.pathname, location.key]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, imagen: `img/${file.name}` });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = editandoId ? `/productos/${editandoId}` : '/productos';
      const method = editandoId ? 'PUT' : 'POST';

      const idCatNum = Number(formData.categoriaId);
      const categoriaSeleccionada = categorias.find(
        c => Number(getCatId(c)) === idCatNum
      );

      const idOfNum = formData.ofertaId ? Number(formData.ofertaId) : null;
      const ofertaSeleccionada = idOfNum
        ? ofertas.find(o => Number(getOfertaId(o)) === idOfNum)
        : null;

      const datosAEnviar = {
        ...(editandoId ? { id: Number(editandoId) } : {}),
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precio: parseInt(formData.precio, 10) || 0,
        stock: parseInt(formData.stock, 10) || 0,
        imagen: formData.imagen || 'img/comida.jpg',
        categoria: categoriaSeleccionada
          ? { ...categoriaSeleccionada, id: idCatNum, idCategoria: idCatNum }
          : { id: idCatNum, idCategoria: idCatNum },
        oferta: ofertaSeleccionada
          ? { ...ofertaSeleccionada, id: idOfNum, idOferta: idOfNum }
          : null
      };

      const response = await apiFetch(endpoint, {
        method: method,
        body: JSON.stringify(datosAEnviar)
      });

      if (response.ok) {
        await cargarDatos();
        limpiarFormulario();
        mostrarMensaje(editandoId ? '✅ Producto actualizado con éxito' : '✅ Producto creado con éxito');
      } else {
        mostrarMensaje(`❌ Error ${response.status} al guardar el producto.`, 'danger');
      }
    } catch (error) {
      mostrarMensaje('⚠️ Error de conexión con el backend.', 'danger');
    }
  };

  const handleEdit = (prod) => {
    setFormData({
      nombre: prod.nombre || '',
      precio: prod.precio || '',
      stock: prod.stock !== undefined ? prod.stock : 0,
      categoriaId: getCatId(prod.categoria) ? String(getCatId(prod.categoria)) : '',
      ofertaId: prod.oferta ? String(getOfertaId(prod.oferta)) : '',
      imagen: prod.imagen || '',
      descripcion: prod.descripcion || ''
    });
    setEditandoId(prod.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const limpiarFormulario = () => {
    setFormData({
      nombre: '',
      precio: '',
      stock: '',
      categoriaId: '',
      ofertaId: '',
      imagen: '',
      descripcion: ''
    });
    setEditandoId(null);
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
  };

  const handleDelete = async (id, nombre) => {
    if (window.confirm(`¿Seguro que deseas eliminar "${nombre}"?`)) {
      try {
        const response = await apiFetch(`/productos/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          cargarDatos();
          mostrarMensaje(`🗑️ "${nombre}" eliminado.`, 'warning');
        } else {
          mostrarMensaje(`❌ Error ${response.status}: No se pudo eliminar.`, 'danger');
        }
      } catch (error) {
        mostrarMensaje('Error de conexión.', 'danger');
      }
    }
  };

  const ofertaActivaForm = ofertas.find(o => String(getOfertaId(o)) === String(formData.ofertaId));
  const porcentajeActivo = ofertaActivaForm ? Number(getOfertaPorcentaje(ofertaActivaForm)) : 0;
  const precioFinalCalculado = formData.precio && porcentajeActivo > 0
    ? Math.round(Number(formData.precio) * (1 - porcentajeActivo / 100))
    : null;

  // Igual que la versión anterior: mostrar todos o solo stock crítico (10 o menos).
  const productosFiltrados = filtroActivo === 'criticos'
    ? productos.filter(producto => Number(producto.stock) <= 10)
    : productos;

  return (
    <div className="container-fluid py-4 position-relative">
      {toast.mostrar && (
        <div className={`alert alert-${toast.tipo} position-fixed top-0 end-0 m-3 shadow-lg z-3`} style={{ zIndex: 1050 }}>
          {toast.mensaje}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold m-0">Gestión de Inventario</h2>
        {editandoId && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={limpiarFormulario}>
            Cancelar Edición
          </button>
        )}
      </div>

      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-dark text-white">
              <h5 className="card-title mb-0">{editandoId ? 'Editar Producto' : 'Nuevo Producto'}</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Nombre del Producto</label>
                  <input
                    type="text"
                    className="form-control"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="row mb-3">
                  <div className="col">
                    <label className="form-label">Precio Normal ($)</label>
                    <input type="number" className="form-control" name="precio" value={formData.precio} onChange={handleChange} required />
                  </div>
                  <div className="col">
                    <label className="form-label">Stock (Cant.)</label>
                    <input type="number" className="form-control" name="stock" value={formData.stock} onChange={handleChange} required />
                  </div>
                </div>

                <div className="mb-3 p-3 bg-light rounded border">
                  <label className="form-label fw-bold text-primary mb-1">Oferta / Descuento</label>
                  <select className="form-select" name="ofertaId" value={formData.ofertaId} onChange={handleChange}>
                    <option value="">Sin oferta (Precio Normal)</option>
                    {ofertas.map((of) => {
                      const idOf = getOfertaId(of);
                      const porc = getOfertaPorcentaje(of);
                      return (
                        <option key={idOf} value={idOf}>
                          🔥 {porc}% OFF — {getOfertaNombre(of)}
                        </option>
                      );
                    })}
                  </select>
                  {precioFinalCalculado !== null && (
                    <div className="mt-2 small text-success fw-bold">
                      Precio con descuento ({porcentajeActivo}% OFF): ${precioFinalCalculado.toLocaleString('es-CL')}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Categoría</label>
                  <select className="form-select" name="categoriaId" value={formData.categoriaId} onChange={handleChange} required>
                    <option value="">Seleccione una categoría...</option>
                    {categorias.map(cat => {
                      const idCat = getCatId(cat);
                      return (
                        <option key={idCat} value={idCat}>{getCatNombre(cat)}</option>
                      );
                    })}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Imagen del Producto</label>
                  <input type="file" id="fileInput" className="form-control" accept="image/*" onChange={handleImageChange} />
                  {formData.imagen && (
                    <div className="mt-2 text-center">
                      <img
                        src={normalizarImagen(formData.imagen)}
                        alt="Preview"
                        style={{ height: '80px', objectFit: 'contain' }}
                        className="img-thumbnail"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/80?text=Preview'; }}
                      />
                      <div className="small text-muted mt-1">{formData.imagen}</div>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label">Descripción</label>
                  <textarea className="form-control" name="descripcion" rows="2" value={formData.descripcion} onChange={handleChange}></textarea>
                </div>

                <div className="d-grid">
                  <button type="submit" className={`btn ${editandoId ? 'btn-warning' : 'btn-success'}`}>
                    {editandoId ? 'Actualizar Producto' : 'Guardar Producto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="mb-0">Lista de Inventario</h5>
              <div className="btn-group" role="group" aria-label="Filtro de inventario">
                <button
                  type="button"
                  className={`btn ${filtroActivo === 'todos' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFiltroActivo('todos')}
                >
                  Todos los Productos
                </button>
                <button
                  type="button"
                  className={`btn ${filtroActivo === 'criticos' ? 'btn-danger' : 'btn-outline-danger'}`}
                  onClick={() => setFiltroActivo('criticos')}
                >
                  Stock Crítico (≤ 10)
                </button>
              </div>
            </div>
            <div className="card-body p-0 p-md-3">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Img</th>
                      <th>Nombre</th>
                      <th>Categoría</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th>Oferta</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          {filtroActivo === 'criticos'
                            ? 'No hay productos con stock crítico.'
                            : 'No hay productos en el inventario.'}
                        </td>
                      </tr>
                    ) : (
                      productosFiltrados.map(prod => {
                        const porcOferta = prod.oferta ? getOfertaPorcentaje(prod.oferta) : 0;
                        return (
                          <tr key={prod.id}>
                            <td>
                              <img
                                src={normalizarImagen(prod.imagen)}
                                alt={prod.nombre}
                                style={{ width: '42px', height: '42px', objectFit: 'cover' }}
                                className="rounded border"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/42?text=Img'; }}
                              />
                            </td>
                            <td className="fw-bold">{prod.nombre}</td>
                            <td>
                              <span className="badge bg-secondary">
                                {getCatNombre(prod.categoria) || 'Sin Categoría'}
                              </span>
                            </td>
                            <td>${Number(prod.precio).toLocaleString('es-CL')}</td>
                            <td>
                              <span className={`badge ${Number(prod.stock) <= 10 ? 'bg-danger' : 'bg-success'}`}>
                                {prod.stock ?? 0} u.
                              </span>
                            </td>
                            <td>
                              {prod.oferta && porcOferta > 0 ? (
                                <span className="badge bg-danger">🔥 {porcOferta}% OFF</span>
                              ) : (
                                <span className="text-muted small">Normal</span>
                              )}
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button onClick={() => handleEdit(prod)} className="btn btn-outline-primary">Editar</button>
                                <button onClick={() => handleDelete(prod.id, prod.nombre)} className="btn btn-outline-danger">Eliminar</button>
                              </div>
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
      </div>
    </div>
  );
}