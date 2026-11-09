import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = 'http://localhost:8080/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();

  const redirigirSegunRol = (usuario) => {
    const esAdmin = Boolean(
      usuario.esadmin === true || 
      usuario.esadmin === 1 || 
      usuario.esAdmin === true || 
      usuario.esAdmin === 1 ||
      usuario.email?.toLowerCase().endsWith('@profesor.duoc.cl')
    );

    if (esAdmin) {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const resultado = await iniciarSesion(email, password);

      if (resultado.exito) {
        redirigirSegunRol(resultado.usuario);
      } else {
        setError(resultado.mensaje || 'Correo o contraseña incorrectos.');
      }
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError('No se pudo conectar con el servidor Spring Boot.');
    } finally {
      setCargando(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setCargando(true);

    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const emailGoogle = decoded.email.toLowerCase();

      // Validación estricta de dominios permitidos
      const esGmail = emailGoogle.endsWith('@gmail.com');
      const esDuocUC = emailGoogle.endsWith('@duocuc.cl');
      const esProfesorDuoc = emailGoogle.endsWith('@profesor.duoc.cl');

      if (!esGmail && !esDuocUC && !esProfesorDuoc) {
        setError(`⛔ El dominio del correo (${emailGoogle}) no está permitido. Usa un correo @gmail.com, @duocuc.cl o @profesor.duoc.cl.`);
        setCargando(false);
        return;
      }

      // Buscar usuario en Spring Boot
      const resCheck = await fetch(`${API_BASE_URL}/usuarios`);
      let usuarioBD = null;

      if (resCheck.ok) {
        const usuarios = await resCheck.json();
        usuarioBD = usuarios.find((u) => u.email && u.email.toLowerCase() === emailGoogle);
      }

      if (!usuarioBD) {
        setError('Tu cuenta de Google no se encuentra registrada. Por favor dirígete a la pestaña de registro.');
        setCargando(false);
        return;
      }

      // Autenticar la sesión en el contexto global
      const resLogin = await iniciarSesion(usuarioBD.email, usuarioBD.password);
      
      if (resLogin.exito) {
        redirigirSegunRol(resLogin.usuario || usuarioBD);
      } else {
        setError('No se pudo validar el usuario en la base de datos.');
      }
    } catch (err) {
      console.error('Error autenticando con Google en Login:', err);
      setError('Ocurrió un error al autenticar la cuenta de Google.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card-split">
        <div className="login-image-side">
          <img 
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80" 
            alt="Gastronomía Sabor & Aroma" 
          />
          <div className="login-image-overlay">
            <h3>¡Bienvenido a Sabor & Aroma!</h3>
            <p>Accede para disfrutar de promociones exclusivas y gestionar tus pedidos.</p>
          </div>
        </div>

        <div className="login-form-side">
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
            Iniciar Sesión
          </h2>

          <div className="mb-4 d-flex flex-column align-items-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('La autenticación con Google falló.')}
              text="signin_with"
              shape="pill"
              locale="es"
            />
            <div className="separator-text mt-3">
              <span>O CON TU CORREO</span>
            </div>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <FloatingLabel controlId="email" label="Correo Electrónico">
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@duocuc.cl"
                  required
                />
              </FloatingLabel>
            </div>

            <div className="form-group mb-3">
              <FloatingLabel controlId="password" label="Contraseña">
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </FloatingLabel>
            </div>

            <button type="submit" className="btn-primary form-btn" disabled={cargando}>
              {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="form-footer-text">
            ¿No tienes una cuenta? <Link to="/registro" className="link-bold-primary">Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
}