import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8080/api';

export default function CategoriasAdmin() {
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: 'success' });
  
  const location = useLocation();

  const mostrarMensaje = (mensaje, tipo = 'success') => {
    setToast({ mostrar: true, mensaje, tipo });
    setTimeout(() => setToast({ mostrar: false, mensaje: '', tipo: 'success' }), 3000);
  };

  const obtenerCategorias = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categorias`, { cache: 'no-store' });
      if (response.ok) {
        setCategorias(await response.json());
      }
    } catch (error) {
      mostrarMensaje('Error al cargar categorías.', 'danger');
    }
  };

  useEffect(() => {
    obtenerCategorias();
  }, [location.key]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editandoId 
        ? `${API_BASE_URL}/categorias/${editandoId}` 
        : `${API_BASE_URL}/categorias`;
      
      const method = editandoId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombreCategoria: nombre })
      });

      if (response.ok) {
        obtenerCategorias();
        setNombre('');
        setEditandoId(null);
        mostrarMensaje(editandoId ? '✅ Categoría actualizada' : '✅ Categoría creada');
        window.dispatchEvent(new Event('categoryChange'));
      } else {
        mostrarMensaje('❌ Error: No se pudo guardar la categoría', 'danger');
      }
    } catch (error) {
      mostrarMensaje('⚠️ Error de conexión.', 'danger');
    }
  };

  const handleEdit = (cat) => {
    setNombre(cat.nombreCategoria || cat.nombre || '');
    setEditandoId(cat.idCategoria || cat.id);
  };

  const handleDelete = async (id, nombreCat) => {
    if (window.confirm(`¿Seguro que deseas eliminar la categoría "${nombreCat}"?`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/categorias/${id}`, { method: 'DELETE' });
        if (response.ok) {
          obtenerCategorias();
          mostrarMensaje(`🗑️ "${nombreCat}" eliminada.`, 'warning');
          window.dispatchEvent(new Event('categoryChange'));
        } else {
          mostrarMensaje('❌ No se puede eliminar porque tiene productos asociados.', 'danger');
        }
      } catch (error) {
        mostrarMensaje('Error al eliminar.', 'danger');
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
        <h2 className="fw-bold m-0">Gestión de Categorías</h2>
        {editandoId && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setEditandoId(null); setNombre(''); }}>
            Cancelar Edición
          </button>
        )}
      </div>

      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-dark text-white">
              <h5 className="card-title mb-0">{editandoId ? 'Editar Categoría' : 'Nueva Categoría'}</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Nombre de la Categoría</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={nombre} 
                    onChange={(e) => setNombre(e.target.value)} 
                    placeholder="Ej: Bebidas, Postres..." 
                    required 
                  />
                </div>
                <div className="d-grid">
                  <button type="submit" className={`btn ${editandoId ? 'btn-warning' : 'btn-success'}`}>
                    {editandoId ? 'Actualizar' : 'Guardar Categoría'}
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
                      <th>ID</th>
                      <th>Nombre</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.length === 0 ? (
                      <tr><td colSpan="3" className="text-center py-4">No hay categorías registradas.</td></tr>
                    ) : (
                      categorias.map(cat => {
                        const idCat = cat.idCategoria || cat.id;
                        const nomCat = cat.nombreCategoria || cat.nombre;
                        return (
                          <tr key={idCat}>
                            <td><span className="badge bg-secondary">{idCat}</span></td>
                            <td className="fw-bold">{nomCat}</td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                <button onClick={() => handleEdit(cat)} className="btn btn-outline-primary">Editar</button>
                                <button onClick={() => handleDelete(idCat, nomCat)} className="btn btn-outline-danger">Eliminar</button>
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