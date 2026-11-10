import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8080/api';

export default function ReportesAdmin() {
  const [historial, setHistorial] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('Todos');

  // Llama a Spring Boot para traer los reportes
  useEffect(() => {
    fetch(`${API_BASE_URL}/reportes`)
      .then(respuesta => respuesta.json())
      .then(datos => setHistorial(datos))
      .catch(error => console.error("Error cargando la base de datos:", error));
  }, []);

  const getColorEspecialidad = (especialidad) => {
    if (!especialidad) return 'secondary';
    const esp = especialidad.toLowerCase();
    if (esp.includes('nuevo') || esp.includes('crear')) return 'success';
    if (esp.includes('editar') || esp.includes('actualizar')) return 'warning';
    if (esp.includes('eliminar') || esp.includes('borrar')) return 'danger';
    return 'secondary';
  };

  const reportesFiltrados = filtroTipo === 'Todos' 
    ? historial 
    : historial.filter(item => item.tipoReporte === filtroTipo || item.tipo_reporte === filtroTipo);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold m-0">Reporte General de Registros.</h2>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Historial de Cambios</h5>
          
          <div className="btn-group btn-group-sm" role="group">
             <button type="button" className={`btn ${filtroTipo === 'Todos' ? 'btn-primary' : 'btn-outline-light'}`} onClick={() => setFiltroTipo('Todos')}>Todos</button>
             <button type="button" className={`btn ${filtroTipo === 'Producto' ? 'btn-primary' : 'btn-outline-light'}`} onClick={() => setFiltroTipo('Producto')}>Productos</button>
             <button type="button" className={`btn ${filtroTipo === 'Usuario' ? 'btn-primary' : 'btn-outline-light'}`} onClick={() => setFiltroTipo('Usuario')}>Usuarios</button>
             <button type="button" className={`btn ${filtroTipo === 'Categoría' ? 'btn-primary' : 'btn-outline-light'}`} onClick={() => setFiltroTipo('Categoría')}>Categorías</button>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Tipo de Reporte</th>
                  <th>Especialidad</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {reportesFiltrados.length > 0 ? (
                  reportesFiltrados.map((item) => (
                    <tr key={item.id}>
                      <td><span className="badge bg-secondary">#{item.id}</span></td>
                      <td className="text-muted small">{new Date(item.fecha).toLocaleString('es-CL')}</td>
                      <td className="fw-bold">{item.tipoReporte || item.tipo_reporte || 'Registro'}</td>
                      <td>
                        <span className={`badge bg-${getColorEspecialidad(item.especialidad)}`}>
                          {item.especialidad || 'Operación'}
                        </span>
                      </td>
                      <td>{item.descripcion}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">No hay reportes en la base de datos.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}