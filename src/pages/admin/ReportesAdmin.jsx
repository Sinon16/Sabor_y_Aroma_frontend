
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../service/api';

export default function ReportesAdmin() {
  const [historial, setHistorial] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [errorExcel, setErrorExcel] = useState('');

  // Cargar los reportes desde Spring Boot
  useEffect(() => {
    let activo = true;

    const cargarReportes = async () => {
      try {
        const respuesta = await apiFetch('/reportes', {
          cache: 'no-store'
        });

        if (!respuesta.ok) {
          throw new Error(
            `Error HTTP ${respuesta.status}`
          );
        }

        const datos = await respuesta.json();

        if (activo) {
          setHistorial(
            Array.isArray(datos) ? datos : []
          );
        }
      } catch (error) {
        console.error(
          'Error cargando los reportes:',
          error
        );

        if (activo) {
          setHistorial([]);
        }
      }
    };

    cargarReportes();

    return () => {
      activo = false;
    };
  }, []);

  // Descargar reporte Excel desde Spring Boot
  const descargarExcel = async () => {
    if (loadingExcel) return;

    setLoadingExcel(true);
    setErrorExcel('');

    let urlTemporal = null;
    let enlace = null;

    try {
      const urlPeticion =
        `/reportes/exportar?tipo=${encodeURIComponent(filtroTipo)}`;

      const response = await apiFetch(urlPeticion);

      if (!response.ok) {
        throw new Error(
          `Error HTTP ${response.status} al exportar Excel`
        );
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error('El archivo Excel está vacío');
      }

      urlTemporal = window.URL.createObjectURL(blob);

      enlace = document.createElement('a');
      enlace.href = urlTemporal;
      enlace.download =
        `Reporte_General_Registros_${filtroTipo}.xlsx`;

      enlace.style.display = 'none';

      document.body.appendChild(enlace);
      enlace.click();

    } catch (error) {
      console.error(
        'Error descargando el historial de cambios:',
        error
      );

      setErrorExcel(
        'No se pudo generar el archivo Excel. ' +
        'Comprueba la conexión con el servidor.'
      );

    } finally {
      // Eliminar únicamente el enlace creado
      if (enlace) {
        enlace.remove();
      }

      // Liberar la URL después de iniciar la descarga
      if (urlTemporal) {
        const urlParaLiberar = urlTemporal;

        setTimeout(() => {
          window.URL.revokeObjectURL(urlParaLiberar);
        }, 1000);
      }

      setLoadingExcel(false);
    }
  };

  // Obtener el nombre de la especialidad
  const obtenerEspecialidad = (item) => {
    return (
      item.especialidad ||
      item.estadoReporte?.nombreEstado ||
      item.estadoReporte?.nombre ||
      'Operación'
    );
  };

  // Asignar colores según el estado del reporte
  const getColorEspecialidad = (especialidad) => {
    if (!especialidad) return 'secondary';

    const esp = String(especialidad).toLowerCase();

    if (
      esp.includes('nuevo') ||
      esp.includes('crear') ||
      esp.includes('activo')
    ) {
      return 'success';
    }

    if (
      esp.includes('editar') ||
      esp.includes('actualizar') ||
      esp.includes('pendiente')
    ) {
      return 'warning';
    }

    if (
      esp.includes('eliminar') ||
      esp.includes('borrar') ||
      esp.includes('error')
    ) {
      return 'danger';
    }

    return 'secondary';
  };

  // Filtrar reportes por tipo
  const reportesFiltrados =
    filtroTipo === 'Todos'
      ? historial
      : historial.filter(
          item =>
            (item.tipoReporte || item.tipo_reporte) ===
            filtroTipo
        );

  // Cambiar filtro y limpiar errores anteriores
  const cambiarFiltro = (tipo) => {
    setFiltroTipo(tipo);
    setErrorExcel('');
  };

  return (
    <div
      className="container-fluid py-4 notranslate"
      translate="no"
    >
      {/* Título y botón de exportación */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h2 className="fw-bold m-0">
          Reporte General de Registros.
        </h2>

        <button
          type="button"
          onClick={descargarExcel}
          disabled={
            loadingExcel ||
            reportesFiltrados.length === 0
          }
          className="btn btn-success d-flex align-items-center gap-2 shadow-sm notranslate"
          translate="no"
          style={{
            backgroundColor: loadingExcel
              ? '#6c757d'
              : '#1D6F42',
            border: 'none'
          }}
        >
          {/* El spinner permanece montado */}
          <span
            className="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
            style={{
              visibility: loadingExcel
                ? 'visible'
                : 'hidden',
              width: loadingExcel ? undefined : '0',
              height: loadingExcel ? undefined : '0',
              borderWidth: loadingExcel ? undefined : '0'
            }}
          />

          <span>
            Exportar ({filtroTipo}) a Excel
          </span>
        </button>
      </div>

      {/* Mostrar errores sin alert del navegador */}
      {errorExcel && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {errorExcel}
        </div>
      )}

      {/* Historial de cambios */}
      <div className="card shadow-sm">
        <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center flex-wrap gap-3">
          <h5 className="mb-0">
            Historial de Cambios
          </h5>

          <div
            className="btn-group btn-group-sm"
            role="group"
          >
            <button
              type="button"
              className={`btn ${
                filtroTipo === 'Todos'
                  ? 'btn-primary'
                  : 'btn-outline-light'
              }`}
              onClick={() => cambiarFiltro('Todos')}
            >
              Todos
            </button>

            <button
              type="button"
              className={`btn ${
                filtroTipo === 'Producto'
                  ? 'btn-primary'
                  : 'btn-outline-light'
              }`}
              onClick={() => cambiarFiltro('Producto')}
            >
              Productos
            </button>

            <button
              type="button"
              className={`btn ${
                filtroTipo === 'Usuario'
                  ? 'btn-primary'
                  : 'btn-outline-light'
              }`}
              onClick={() => cambiarFiltro('Usuario')}
            >
              Usuarios
            </button>

            <button
              type="button"
              className={`btn ${
                filtroTipo === 'Categoría'
                  ? 'btn-primary'
                  : 'btn-outline-light'
              }`}
              onClick={() => cambiarFiltro('Categoría')}
            >
              Categorías
            </button>
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
                    const idRep =
                      item.id ??
                      item.idReporte ??
                      idx;

                    const especialidadTexto =
                      obtenerEspecialidad(item);

                    const fechaTexto =
                      !item.fecha ||
                      isNaN(Date.parse(item.fecha))
                        ? item.fecha || 'N/A'
                        : new Date(
                            item.fecha
                          ).toLocaleString('es-CL');

                    return (
                      <tr key={idRep}>
                        <td>
                          <span className="badge bg-secondary">
                            #{idRep}
                          </span>
                        </td>

                        <td className="text-muted small">
                          {fechaTexto}
                        </td>

                        <td className="fw-bold">
                          {item.tipoReporte ||
                            item.tipo_reporte ||
                            'Registro'}
                        </td>

                        <td>
                          <span
                            className={`badge bg-${getColorEspecialidad(
                              especialidadTexto
                            )}`}
                          >
                            {especialidadTexto}
                          </span>
                        </td>

                        <td>
                          {item.descripcion}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center py-4"
                    >
                      No hay reportes para mostrar.
                    </td>
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
