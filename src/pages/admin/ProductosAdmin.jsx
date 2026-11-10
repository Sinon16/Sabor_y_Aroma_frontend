import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8080/api';

export default function ProductosAdmin() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '', precio: '', stock: '', categoriaId: '', imagen: '', descripcion: '', enOferta: '0', precioOferta: ''
  });
  
  const [editandoId, setEditandoId] = useState(null);
  const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: 'success' });
  
  const location = useLocation();

  const mostrarMensaje = (mensaje, tipo = 'success') => {
    setToast({ mostrar: true, mensaje, tipo });
    setTimeout(() => setToast({ mostrar: false, mensaje: '', tipo: 'success' }), 3000);
  };

  const cargarDatos = async () => {
    try {
      const [resProd, resCat] = await Promise.all([
        fetch(`${API_BASE_URL}/productos`, { cache: 'no-store' }),
        fetch(`${API_BASE_URL}/categorias`, { cache: 'no-store' })
      ]);

      if (resProd.ok) setProductos(await resProd.json());
      if (resCat.ok) setCategorias(await resCat.json());
    } catch (error) {
      mostrarMensaje('Error de conexión con el servidor.', 'danger');
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [location.key]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'enOferta' && value === '0') {
      setFormData({ ...formData, enOferta: '0', precioOferta: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imagen: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editandoId 
        ? `${API_BASE_URL}/productos/${editandoId}` 
        : `${API_BASE_URL}/productos`;
      
      const method = editandoId ? 'PUT' : 'POST';

      const categoriaSeleccionada = categorias.find(
        c => String(c.idCategoria) === String(formData.categoriaId)
      );

      const datosAEnviar = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: parseInt(formData.precio, 10) || 0,
        stock: parseInt(formData.stock, 10) || 0,
        imagen: formData.imagen,
        categoria: categoriaSeleccionada ? { idCategoria: categoriaSeleccionada.idCategoria } : null,
        oferta: formData.enOferta === '1' ? { idOferta: 1 } : null
      };

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosAEnviar)
      });

      if (response.ok) {
        cargarDatos();
        limpiarFormulario();
        mostrarMensaje(editandoId ? '✅ Producto actualizado con éxito' : '✅ Producto creado con éxito');
      } else {
        mostrarMensaje('❌ Error al guardar el producto.', 'danger');
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
      categoriaId: prod.categoria?.idCategoria || '',
      imagen: prod.imagen || '',
      descripcion: prod.descripcion || '',
      enOferta: prod.oferta ? '1' : '0',
      precioOferta: prod.oferta?.porcentajeDescuento || ''
    });
    setEditandoId(prod.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const limpiarFormulario = () => {
    setFormData({ nombre: '', precio: '', stock: '', categoriaId: '', imagen: '', descripcion: '', enOferta: '0', precioOferta: '' });
    setEditandoId(null);
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
  };

  const handleDelete = async (id, nombre) => {
    if (window.confirm(`¿Seguro que deseas eliminar "${nombre}"?`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/productos/${id}`, { method: 'DELETE' });
        if (response.ok) {
          cargarDatos();
          mostrarMensaje(`🗑️ "${nombre}" eliminado.`, 'warning');
        } else {
          mostrarMensaje('❌ Error al eliminar.', 'danger');
        }
      } catch (error) {
        mostrarMensaje('Error de conexión.', 'danger');
      }
    }
  };

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
                  <input type="text" className="form-control" name="nombre" value={formData.nombre} onChange={handleChange} required />
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

                <div className="row mb-3 p-2 bg-light rounded border mx-0">
                  <div className="col-12">
                    <label className="form-label fw-bold text-primary">¿Está en Oferta?</label>
                    <select className="form-select" name="enOferta" value={formData.enOferta} onChange={handleChange}>
                      <option value="0">No</option>
                      <option value="1">Sí (Aplicar Promo)</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Categoría</label>
                  <select className="form-select" name="categoriaId" value={formData.categoriaId} onChange={handleChange} required>
                    <option value="">Seleccione una categoría...</option>
                    {categorias.map(cat => (
                      <option key={cat.idCategoria} value={cat.idCategoria}>{cat.nombreCategoria}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Imagen del Producto</label>
                  <input type="file" id="fileInput" className="form-control" accept="image/*" onChange={handleImageChange} />
                  {formData.imagen && (
                    <div className="mt-2 text-center">
                      <img src={formData.imagen} alt="Preview" style={{ height: '80px', objectFit: 'contain' }} className="img-thumbnail" />
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
                    {productos.length === 0 ? (
                      <tr><td colSpan="7" className="text-center py-4">No hay productos en el inventario.</td></tr>
                    ) : (
                      productos.map(prod => (
                        <tr key={prod.id}>
                          <td>
                            <img src={prod.imagen || 'https://via.placeholder.com/40'} alt={prod.nombre} style={{ width: '40px', height: '40px', objectFit: 'cover' }} className="rounded" />
                          </td>
                          <td className="fw-bold">{prod.nombre}</td>
                          <td><span className="badge bg-secondary">{prod.categoria?.nombreCategoria || 'Sin Categoría'}</span></td>
                          <td>${Number(prod.precio).toLocaleString('es-CL')}</td>
                          <td>
                            <span className={`badge ${prod.stock > 5 ? 'bg-success' : prod.stock > 0 ? 'bg-warning text-dark' : 'bg-danger'}`}>
                              {prod.stock !== undefined ? prod.stock : 0} u.
                            </span>
                          </td>
                          <td>
                            {prod.oferta ? (
                              <span className="badge bg-danger">🔥 {prod.oferta.porcentajeDescuento}% OFF</span>
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
                      ))
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