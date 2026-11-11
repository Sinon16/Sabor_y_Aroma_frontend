import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8080/api';

export default function ReportesAdmin() {
  const [historial, setHistorial] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [loadingExcel, setLoadingExcel] = useState(false);

  // Llama a Spring Boot para traer los reportes de la tabla
  useEffect(() => {
    fetch(`${API_BASE_URL}/reportes`, { cache: 'no-store' })
      .then(respuesta => respuesta.json())
      .then(datos => setHistorial(Array.isArray(datos) ? datos : []))
      .catch(error => console.error("Error cargando la base de datos:", error));
  }, []);

  // Descarga el archivo Excel generado por Spring Boot usando fetch nativo
  const descargarExcel = async () => {
    setLoadingExcel(true);
    try {
      const urlPeticion = `${API_BASE_URL}/reportes/exportar?tipo=${encodeURIComponent(filtroTipo)}`;
      const response = await fetch(urlPeticion);

      if (!response.ok) {
        throw new Error('Error al generar el archivo Excel en el servidor');
      }

      // Convertimos la respuesta binaria en un Blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Simulamos el click para descargar el archivo .xlsx
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_General_Registros_${filtroTipo}.xlsx`);
      document.body.appendChild(link);
      link.click();

      // Limpiamos memoria
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error descargando el historial de cambios:", error);
      alert("No se pudo generar el reporte en Excel. Verifica que el backend esté corriendo.");
    } finally {
      setLoadingExcel(false);
    }
  };

  const obtenerEspecialidad = (item) => {
    return item.especialidad || item.estadoReporte?.nombreEstado || item.estadoReporte?.nombre || 'Operación';
  };

  const getColorEspecialidad = (especialidad) => {
    if (!especialidad) return 'secondary';
    const esp = especialidad.toLowerCase();
    if (esp.includes('nuevo') || esp.includes('crear') || esp.includes('activo')) return 'success';
    if (esp.includes('editar') || esp.includes('actualizar') || esp.includes('pendiente')) return 'warning';
    if (esp.includes('eliminar') || esp.includes('borrar') || esp.includes('error')) return 'danger';
    return 'secondary';
  };

  const reportesFiltrados = filtroTipo === 'Todos'
    ? historial
    : historial.filter(item => (item.tipoReporte || item.tipo_reporte) === filtroTipo);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold m-0">Reporte General de Registros.</h2>

        <button
          onClick={descargarExcel}
          disabled={loadingExcel || reportesFiltrados.length === 0}
          className="btn btn-success d-flex align-items-center gap-2 shadow-sm"
          style={{ backgroundColor: loadingExcel ? '#6c757d' : '#1D6F42', border: 'none' }}
        >
          {loadingExcel ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              Generando...
            </>
          ) : (
            <>
              <span></span> Exportar ({filtroTipo}) a Excel
            </>
          )}
        </button>
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
                  reportesFiltrados.map((item, idx) => {
                    const idRep = item.id ?? item.idReporte ?? idx;
                    const especialidadTexto = obtenerEspecialidad(item);
                    return (
                      <tr key={idRep}>
                        <td><span className="badge bg-secondary">#{idRep}</span></td>
                        <td className="text-muted small">
                          {!item.fecha || isNaN(Date.parse(item.fecha)) ? (item.fecha || 'N/A') : new Date(item.fecha).toLocaleString('es-CL')}
                        </td>
                        <td className="fw-bold">{item.tipoReporte || item.tipo_reporte || 'Registro'}</td>
                        <td>
                          <span className={`badge bg-${getColorEspecialidad(especialidadTexto)}`}>
                            {especialidadTexto}
                          </span>
                        </td>
                        <td>{item.descripcion}</td>
                      </tr>
                    );
                  })
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