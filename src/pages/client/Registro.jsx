import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = 'http://localhost:8080/api';

const estadoInicial = {
  nombre: '',
  email: '',
  confirmarEmail: '',
  password: '',
  confirmarPassword: '',
  telefono: '',
  region: '',
  comuna: ''
};

export default function Registro() {
  const navigate = useNavigate();
  const { iniciarSesion } = useAuth();

  const [formData, setFormData] = useState(estadoInicial);
  const [errors, setErrors] = useState({});
  const [mensajeToast, setMensajeToast] = useState('');
  const [errorServidor, setErrorServidor] = useState('');
  const [obteniendoGeo, setObteniendoGeo] = useState(false);

  const [listaRegiones, setListaRegiones] = useState([]);
  const [listaComunas, setListaComunas] = useState([]);
  const [cargandoRegiones, setCargandoRegiones] = useState(true);

  // 1. Cargar regiones desde Spring Boot
  useEffect(() => {
    const cargarRegionesBD = async () => {
      try {
        setCargandoRegiones(true);
        const res = await fetch(`${API_BASE_URL}/regiones`);
        if (res.ok) {
          const data = await res.json();
          setListaRegiones(data);
        }
      } catch (err) {
        console.error('Error al obtener regiones:', err);
      } finally {
        setCargandoRegiones(false);
      }
    };

    cargarRegionesBD();
  }, []);

  // 2. Cargar comunas por región seleccionada
  useEffect(() => {
    if (!formData.region) {
      setListaComunas([]);
      return;
    }

    const cargarComunasBD = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/comunas?region=${encodeURIComponent(formData.region)}`);
        if (res.ok) {
          const data = await res.json();
          setListaComunas(data);
        }
      } catch (err) {
        console.error('Error al obtener comunas:', err);
      }
    };

    cargarComunasBD();
  }, [formData.region]);

  const autodetectarUbicacion = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta la geolocalización.');
      return;
    }

    setObteniendoGeo(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setFormData((prev) => ({
          ...prev,
          region: 'Región Metropolitana de Santiago',
          comuna: 'Santiago'
        }));
        setObteniendoGeo(false);
        setMensajeToast('📍 Ubicación seleccionada automáticamente.');
        setTimeout(() => setMensajeToast(''), 3000);
      },
      (error) => {
        console.error('Error de geolocalización:', error);
        setObteniendoGeo(false);
        alert('No se pudo acceder a tu ubicación. Selecciona tu región manualmente.');
      }
    );
  };

  const validarCampo = (name, value, currentFormData = formData) => {
    let errorText = '';

    switch (name) {
      case 'nombre': {
        const val = value.trim();
        const regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]{3,}\s+[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,}$/;
        if (!val) {
          errorText = 'El nombre completo es obligatorio.';
        } else if (!regexNombre.test(val)) {
          errorText = 'Debe ingresar nombre y apellido con al menos 3 letras cada uno.';
        }
        break;
      }

      case 'email': {
        const emailVal = value.trim().toLowerCase();
        if (!emailVal) {
          errorText = 'El correo electrónico es obligatorio.';
        } else {
          const esGmail = emailVal.endsWith('@gmail.com');
          const esDuocUC = emailVal.endsWith('@duocuc.cl');
          const esProfesorDuoc = emailVal.endsWith('@profesor.duoc.cl');
          if (!esGmail && !esDuocUC && !esProfesorDuoc) {
            errorText = 'Dominio no permitido. Solo se aceptan correos @gmail.com, @duocuc.cl o @profesor.duoc.cl';
          }
        }
        break;
      }

      case 'confirmarEmail':
        if (value.trim().toLowerCase() !== currentFormData.email.trim().toLowerCase()) {
          errorText = 'Los correos electrónicos no coinciden.';
        }
        break;

      case 'password':
        if (!value) {
          errorText = 'La contraseña es obligatoria.';
        } else if (value.length < 4 || value.length > 10) {
          errorText = 'La contraseña debe tener entre 4 y 10 caracteres.';
        }
        break;

      case 'confirmarPassword':
        if (value !== currentFormData.password) {
          errorText = 'Las contraseñas no coinciden.';
        }
        break;

      case 'region':
        if (!value) errorText = 'Por favor seleccione una región.';
        break;

      case 'comuna':
        if (!value) errorText = 'Por favor seleccione una comuna.';
        break;

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: errorText }));
    return errorText;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };

    if (name === 'region') {
      newFormData.comuna = '';
      setErrors((prev) => ({ ...prev, comuna: '' }));
    }

    setFormData(newFormData);
    validarCampo(name, value, newFormData);
  };

  // 3. Autenticación / Registro con Google Auth Token
  const handleGoogleSuccess = async (credentialResponse) => {
    setErrorServidor('');
    setMensajeToast('');

    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const emailGoogle = decoded.email.toLowerCase();
      const nombreGoogle = decoded.name;

      // Validación de Dominios Permitidos
      const esGmail = emailGoogle.endsWith('@gmail.com');
      const esDuocUC = emailGoogle.endsWith('@duocuc.cl');
      const esProfesorDuoc = emailGoogle.endsWith('@profesor.duoc.cl');

      if (!esGmail && !esDuocUC && !esProfesorDuoc) {
        setErrorServidor(`⛔ El correo Google (${emailGoogle}) no está permitido. Solo se aceptan @gmail.com, @duocuc.cl y @profesor.duoc.cl.`);
        return;
      }

      // Verificar en Spring Boot si la cuenta ya existe
      const resCheck = await fetch(`${API_BASE_URL}/usuarios`);
      let usuarioExiste = false;

      if (resCheck.ok) {
        const usuariosBD = await resCheck.json();
        usuarioExiste = usuariosBD.some((u) => u.email && u.email.toLowerCase() === emailGoogle);
      }

      // SI LA CUENTA YA EXISTE: Muestra alerta roja y se queda en la vista de registro
      if (usuarioExiste) {
        setErrorServidor(`⚠️ El correo "${emailGoogle}" ya se encuentra registrado. Por favor, dirígete a "Iniciar sesión".`);
        return;
      }

      // SI ES NUEVO: Se crea el usuario en Spring Boot, lo logea automáticamente y redirige al inicio
      const esAdminRol = esProfesorDuoc;
      const nuevoUsuario = {
        nombre: nombreGoogle,
        email: emailGoogle,
        password: 'GoogleOAuthUser',
        telefono: '',
        region: formData.region || 'Región Metropolitana de Santiago',
        comuna: formData.comuna || 'Santiago',
        esadmin: esAdminRol
      };

      const resCrear = await fetch(`${API_BASE_URL}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoUsuario)
      });

      if (resCrear.ok) {
        const usuarioCreado = await resCrear.json();
        const rolTexto = esAdminRol ? 'Administrador' : 'Cliente';
        
        // Login automático en el contexto
        await iniciarSesion(usuarioCreado.email, usuarioCreado.password);
        setMensajeToast(`🎉 ¡Cuenta creada con éxito como ${rolTexto}! Redirigiendo...`);

        setTimeout(() => {
          if (esAdminRol) {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }, 1500);
      } else {
        throw new Error('No se pudo completar el registro en la base de datos.');
      }

    } catch (err) {
      console.error('Error al procesar la cuenta de Google:', err);
      setErrorServidor('Ocurrió un problema al validar tu cuenta de Google.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorServidor('');
    setMensajeToast('');

    let nuevosErrores = {};
    Object.keys(formData).forEach((campo) => {
      if (campo !== 'telefono') {
        const err = validarCampo(campo, formData[campo], formData);
        if (err) nuevosErrores[campo] = err;
      }
    });

    if (Object.keys(nuevosErrores).length > 0) return;

    const emailLimpio = formData.email.trim().toLowerCase();
    const esAdministradorRol = emailLimpio.endsWith('@profesor.duoc.cl');

    const nuevoUsuario = {
      nombre: formData.nombre.trim(),
      email: emailLimpio,
      password: formData.password,
      telefono: formData.telefono,
      region: formData.region,
      comuna: formData.comuna,
      esadmin: esAdministradorRol
    };

    try {
      const response = await fetch(`${API_BASE_URL}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoUsuario)
      });

      if (response.ok) {
        const tipoCuenta = esAdministradorRol ? 'Administrador' : 'Cliente';
        setMensajeToast(`🎉 ¡Registro exitoso como ${tipoCuenta}! Redirigiendo al inicio de sesión...`);
        setFormData(estadoInicial);
        setTimeout(() => navigate('/login'), 2200);
      } else {
        setErrorServidor('El correo electrónico ya se encuentra registrado. Por favor inicia sesión.');
      }
    } catch (error) {
      console.error('Error de red:', error);
      setErrorServidor('No se pudo conectar con el servidor Spring Boot.');
    }
  };

  return (
    <div className="login-wrapper">
      {mensajeToast && <div className="toast-notificacion toast-exito">{mensajeToast}</div>}

      <div className="login-card-split login-card-wide">
        <div className="login-image-side">
          <img 
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80" 
            alt="Únete a Sabor & Aroma" 
          />
          <div className="login-image-overlay">
            <h3>¡Únete a Sabor & Aroma!</h3>
            <p>Crea tu cuenta para realizar pedidos de forma rápida y acceder a promociones exclusivas.</p>
          </div>
        </div>

        <div className="login-form-side login-form-side-padded">
          <h2 className="form-title-centered">Registro de Usuario</h2>

          <div className="mb-4 d-flex flex-column align-items-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setErrorServidor('La autenticación con Google falló.')}
              text="signup_with"
              shape="pill"
              locale="es"
            />
            <div className="separator-text mt-3">
              <span>O CON TU CORREO</span>
            </div>
          </div>

          {errorServidor && <div className="alert-error">{errorServidor}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group mb-3">
              <FloatingLabel controlId="nombre" label="NOMBRE COMPLETO">
                <Form.Control
                  type="text"
                  name="nombre"
                  placeholder="Juan Pérez"
                  className={`form-input-dark ${errors.nombre ? 'input-error' : ''}`}
                  value={formData.nombre}
                  onChange={handleChange}
                />
              </FloatingLabel>
              {errors.nombre && <span className="error-message error-message-block">{errors.nombre}</span>}
            </div>

            <div className="form-group mb-3">
              <FloatingLabel controlId="email" label="CORREO">
                <Form.Control
                  type="email"
                  name="email"
                  placeholder="ejemplo@duocuc.cl"
                  className={`form-input-dark ${errors.email ? 'input-error' : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                />
              </FloatingLabel>
              {errors.email && <span className="error-message error-message-block">{errors.email}</span>}
            </div>

            <div className="form-group mb-3">
              <FloatingLabel controlId="confirmarEmail" label="CORREO (Confirmación)">
                <Form.Control
                  type="email"
                  name="confirmarEmail"
                  placeholder="ejemplo@duocuc.cl"
                  className={`form-input-dark ${errors.confirmarEmail ? 'input-error' : ''}`}
                  value={formData.confirmarEmail}
                  onChange={handleChange}
                />
              </FloatingLabel>
              {errors.confirmarEmail && <span className="error-message error-message-block">{errors.confirmarEmail}</span>}
            </div>

            <div className="form-group mb-3">
              <FloatingLabel controlId="password" label="CONTRASEÑA">
                <Form.Control
                  type="password"
                  name="password"
                  placeholder="****"
                  className={`form-input-dark ${errors.password ? 'input-error' : ''}`}
                  value={formData.password}
                  onChange={handleChange}
                />
              </FloatingLabel>
              {errors.password && <span className="error-message error-message-block">{errors.password}</span>}
            </div>

            <div className="form-group mb-3">
              <FloatingLabel controlId="confirmarPassword" label="CONFIRMAR CONTRASEÑA">
                <Form.Control
                  type="password"
                  name="confirmarPassword"
                  placeholder="****"
                  className={`form-input-dark ${errors.confirmarPassword ? 'input-error' : ''}`}
                  value={formData.confirmarPassword}
                  onChange={handleChange}
                />
              </FloatingLabel>
              {errors.confirmarPassword && <span className="error-message error-message-block">{errors.confirmarPassword}</span>}
            </div>

            <div className="form-group mb-3">
              <FloatingLabel controlId="telefono" label="TELÉFONO (opcional)">
                <Form.Control
                  type="tel"
                  name="telefono"
                  placeholder="+56912345678"
                  className="form-input-dark"
                  value={formData.telefono}
                  onChange={handleChange}
                />
              </FloatingLabel>
            </div>

            <div className="mb-2 text-end">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={autodetectarUbicacion}
                disabled={obteniendoGeo}
              >
                {obteniendoGeo ? 'Detectando...' : '📍 Autodetectar mi ubicación'}
              </button>
            </div>

            <div className="form-row-flex mb-3">
              <div className="form-group form-group-flex">
                <FloatingLabel controlId="region" label="Región">
                  <Form.Select
                    name="region"
                    className={`form-input-dark ${errors.region ? 'input-error' : ''}`}
                    value={formData.region}
                    onChange={handleChange}
                    disabled={cargandoRegiones}
                  >
                    <option value="" className="select-option-dark">
                      {cargandoRegiones ? 'Cargando regiones...' : '-- Seleccione la región --'}
                    </option>
                    {listaRegiones.map((reg) => {
                      const nombreReg = typeof reg === 'string' ? reg : reg.nombreRegion || reg.nombre_region;
                      return (
                        <option key={reg.idRegion || reg.id_region || nombreReg} value={nombreReg}>
                          {nombreReg}
                        </option>
                      );
                    })}
                  </Form.Select>
                </FloatingLabel>
                {errors.region && <span className="error-message error-message-block">{errors.region}</span>}
              </div>

              <div className="form-group form-group-flex">
                <FloatingLabel controlId="comuna" label="Comuna">
                  <Form.Select
                    name="comuna"
                    className={`form-input-dark ${errors.comuna ? 'input-error' : ''}`}
                    value={formData.comuna}
                    onChange={handleChange}
                    disabled={!formData.region || listaComunas.length === 0}
                  >
                    <option value="" className="select-option-dark">-- Seleccione la comuna --</option>
                    {listaComunas.map((com) => {
                      const nombreCom = typeof com === 'string' ? com : com.nombreComuna || com.nombre_comuna;
                      return (
                        <option key={com.idComuna || com.id_comuna || nombreCom} value={nombreCom}>
                          {nombreCom}
                        </option>
                      );
                    })}
                  </Form.Select>
                </FloatingLabel>
                {errors.comuna && <span className="error-message error-message-block">{errors.comuna}</span>}
              </div>
            </div>

            <button type="submit" className="btn-primary form-btn">
              Registrarse
            </button>
          </form>

          <p className="form-footer-text">
            ¿Ya tienes una cuenta? <Link to="/login" className="link-bold-primary">Inicia sesión aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
}