import React, { createContext, useContext, useState } from 'react';
import { apiFetch } from '../service/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(() => {
    try {
      const usuarioGuardado = localStorage.getItem('usuarioActivo');
      return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
    } catch (error) {
      console.error('Error al recuperar la sesión guardada:', error);
      localStorage.removeItem('usuarioActivo');
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  // Iniciar sesión usando apiFetch
  const iniciarSesion = async (email, password) => {
    try {
      const res = await apiFetch('/usuarios/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        setUsuario(data.usuario);
        setToken(data.token);
        localStorage.setItem('usuarioActivo', JSON.stringify(data.usuario));
        localStorage.setItem('token', data.token);
        return { exito: true, usuario: data.usuario, token: data.token };
      } else {
        return {
          exito: false,
          mensaje: data.mensaje || 'Credenciales inválidas. Revisa tu correo y contraseña.',
        };
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return { exito: false, mensaje: 'Error de conexión con el servidor Spring Boot.' };
    }
  };

  // Registrar usuario usando apiFetch
  const registrarUsuario = async (datosNuevoUsuario) => {
    try {
      const resCrear = await apiFetch('/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          nombre: datosNuevoUsuario.nombre,
          email: datosNuevoUsuario.email,
          password: datosNuevoUsuario.password,
          region: datosNuevoUsuario.region || '',
          comuna: datosNuevoUsuario.comuna || '',
          telefono: datosNuevoUsuario.telefono || '',
          esadmin: datosNuevoUsuario.esadmin || false,
        }),
      });

      if (resCrear.ok) {
        return await iniciarSesion(datosNuevoUsuario.email, datosNuevoUsuario.password);
      } else {
        return { exito: false, mensaje: 'El correo electrónico ya está registrado o hubo un error.' };
      }
    } catch (error) {
      console.error('Error en el registro de usuario:', error);
      return { exito: false, mensaje: 'Error al conectar con la base de datos.' };
    }
  };

  // Cerrar sesión y limpiar storage
  const cerrarSesion = () => {
    setUsuario(null);
    setToken(null);
    localStorage.removeItem('usuarioActivo');
    localStorage.removeItem('token');
  };

  // Verificar rol de Administrador
  const esAdministrador = () => {
    if (!usuario) return false;
    return Boolean(
      usuario.esadmin === true ||
      usuario.esadmin === 1 ||
      usuario.esAdmin === true ||
      usuario.esAdmin === 1
    );
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        iniciarSesion,
        registrarUsuario,
        cerrarSesion,
        esAdministrador,
        login: iniciarSesion,
        logout: cerrarSesion,
        isAdmin: esAdministrador,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};