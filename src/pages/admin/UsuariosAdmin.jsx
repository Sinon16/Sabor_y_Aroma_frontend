import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { apiFetch } from '../../service/api';

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [regionesBD, setRegionesBD] = useState([]);
  const [comunasBD, setComunasBD] = useState([]);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    region: '',
    comuna: '',
    esadmin: '0'
  });

  const [editandoId, setEditandoId] = useState(null);
  const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: 'success' });

  const location = useLocation();

  const mostrarMensaje = (mensaje, tipo = 'success') => {
    setToast({ mostrar: true, mensaje, tipo });
    setTimeout(() => setToast({ mostrar: false, mensaje: '', tipo: 'success' }), 3000);
  };

  const getRegId = (r) => r?.idRegion ?? r?.id ?? '';
  const getRegNombre = (r) => r?.nombreRegion ?? r?.nombre ?? '';

  const getComId = (c) => c?.idComuna ?? c?.id ?? '';
  const getComNombre = (c) => c?.nombreComuna ?? c?.nombre ?? '';
  const getComRegionNombre = (c) => {
    if (c?.region && typeof c.region === 'object') {
      return getRegNombre(c.region);
    }
    const idRel = c?.regionId ?? c?.idRegion ?? c?.id_region;
    if (idRel !== undefined) {
      const regEncontrada = regionesBD.find(r => String(getRegId(r)) === String(idRel));
      if (regEncontrada) return getRegNombre(regEncontrada);
    }
    return '';
  };

  const cargarDatos = async () => {
    try {
      const [resUsu, resReg, resCom] = await Promise.all([
        apiFetch('/usuarios', { cache: 'no-store' }),
        apiFetch('/regiones', { cache: 'no-store' }),
        apiFetch('/comunas', { cache: 'no-store' })
      ]);

      if (resUsu.ok) setUsuarios(await resUsu.json());
      if (resReg.ok) setRegionesBD(await resReg.json());
      if (resCom.ok) setComunasBD(await resCom.json());
    } catch (error) {
      mostrarMensaje('Error de conexión al cargar datos desde la BD.', 'danger');
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [location.pathname, location.key]);

  const comunasFiltradas = formData.region
    ? comunasBD.filter(c => {
        const nomReg = getComRegionNombre(c);
        return nomReg ? nomReg.toLowerCase() === formData.region.toLowerCase() : true;
      })
    : [];

  const handleRegionChange = (e) => {
    const regionSeleccionada = e.target.value;
    setFormData({ ...formData, region: regionSeleccionada, comuna: '' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = editandoId ? `/usuarios/${editandoId}` : '/usuarios';
      const method = editandoId ? 'PUT' : 'POST';

      const usuarioOriginal = editandoId ? usuarios.find(u => u.id === editandoId) : null;

      const payload = {
        ...(editandoId ? { id: editandoId } : {}),
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password ? formData.password : (usuarioOriginal?.password || ''),
        region: formData.region,
        comuna: formData.comuna,
        esadmin: formData.esadmin === '1'
      };

      const response = await apiFetch(endpoint, {
        method: method,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        cargarDatos();
        limpiarFormulario();
        mostrarMensaje(editandoId ? '✅ Usuario actualizado' : '✅ Usuario creado');
      } else {
        mostrarMensaje('❌ Error al guardar el usuario en la BD.', 'danger');
      }
    } catch (error) {
      mostrarMensaje('⚠️ Error de conexión con el backend.', 'danger');
    }
  };

  const handleEdit = (usuario) => {
    const nombreComunaUsu = typeof usuario.comuna === 'object'
      ? getComNombre(usuario.comuna)
      : (usuario.comuna || '');

    let nombreRegionUsu = typeof usuario.region === 'object'
      ? getRegNombre(usuario.region)
      : (usuario.region || '');

    if (!nombreRegionUsu && nombreComunaUsu) {
      const comObj = comunasBD.find(c => getComNombre(c).toLowerCase() === nombreComunaUsu.toLowerCase());
      if (comObj) {
        nombreRegionUsu = getComRegionNombre(comObj);
      }
    }

    setFormData({
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      password: '',
      region: nombreRegionUsu,
      comuna: nombreComunaUsu,
      esadmin: (usuario.esadmin === true || usuario.esadmin === 1 || usuario.esAdmin === true) ? '1' : '0'
    });

    setEditandoId(usuario.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const limpiarFormulario = () => {
    setFormData({ nombre: '', email: '', password: '', region: '', comuna: '', esadmin: '0' });
    setEditandoId(null);
  };

  const handleDelete = async (id, nombre) => {
    if (window.confirm(`¿Seguro que deseas eliminar al usuario "${nombre}"?`)) {
      try {
        const response = await apiFetch(`/usuarios/${id}`, { method: 'DELETE' });
        if (response.ok) {
          cargarDatos();
          mostrarMensaje(`🗑️ "${nombre}" eliminado.`, 'warning');
        } else {
          mostrarMensaje('❌ No se pudo eliminar. Puede tener órdenes asociadas.', 'danger');
        }
      } catch (error) {
        mostrarMensaje('Error de red al intentar eliminar.', 'danger');
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
        <h2 className="fw-bold m-0">Gestión de Usuarios</h2>
        {editandoId && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={limpiarFormulario}>
            Cancelar / Cerrar
          </button>
        )}
      </div>

      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-dark text-white">
              <h5 className="card-title mb-0">{editandoId ? 'Editar Usuario' : 'Nuevo Usuario'}</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input type="text" className="form-control" name="nombre" value={formData.nombre} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Correo electrónico</label>
                  <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Contraseña {editandoId && '(Opcional)'}</label>
                  <input type="password" className="form-control" name="password" value={formData.password} onChange={handleChange} required={!editandoId} placeholder="******" />
                </div>

                <div className="row mb-3">
                  <div className="col">
                    <label className="form-label">Región</label>
                    <select className="form-select" name="region" value={formData.region} onChange={handleRegionChange} required>
                      <option value="">Seleccione...</option>
                      {regionesBD.map(reg => {
                        const idR = getRegId(reg);
                        const nomR = getRegNombre(reg);
                        return (
                          <option key={idR} value={nomR}>{nomR}</option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="col">
                    <label className="form-label">Comuna</label>
                    <select className="form-select" name="comuna" value={formData.comuna} onChange={handleChange} required disabled={!formData.region}>
                      <option value="">Seleccione...</option>
                      {comunasFiltradas.map(com => {
                        const idC = getComId(com);
                        const nomC = getComNombre(com);
                        return (
                          <option key={idC} value={nomC}>{nomC}</option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label">Rol del Usuario</label>
                  <select className="form-select" name="esadmin" value={formData.esadmin} onChange={handleChange}>
                    <option value="0">Cliente Normal</option>
                    <option value="1">Administrador</option>
                  </select>
                </div>
                <div className="d-grid gap-2">
                  <button type="submit" className={`btn ${editandoId ? 'btn-warning' : 'btn-success'}`}>
                    {editandoId ? 'Actualizar Usuario' : 'Crear Usuario'}
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
                      <th>Correo</th>
                      <th>Comuna</th>
                      <th>Rol</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-4">No hay usuarios registrados.</td></tr>
                    ) : (
                      usuarios.map(usuario => {
                        const comunaTexto = typeof usuario.comuna === 'object'
                          ? getComNombre(usuario.comuna)
                          : (usuario.comuna || 'N/A');
                        const esRolAdmin = usuario.esadmin === true || usuario.esadmin === 1 || usuario.esAdmin === true;

                        return (
                          <tr key={usuario.id}>
                            <td><span className="badge bg-secondary">{usuario.id}</span></td>
                            <td className="fw-bold">{usuario.nombre}</td>
                            <td>{usuario.email}</td>
                            <td>{comunaTexto}</td>
                            <td>
                              <span className={`badge ${esRolAdmin ? 'bg-primary' : 'bg-info text-dark'}`}>
                                {esRolAdmin ? 'Administración' : 'Cliente'}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button onClick={() => handleEdit(usuario)} className="btn btn-outline-primary">Editar</button>
                                <button onClick={() => handleDelete(usuario.id, usuario.nombre)} className="btn btn-outline-danger">Eliminar</button>
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