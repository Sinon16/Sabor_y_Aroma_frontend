import React, { createContext, useContext, useState } from 'react';

const API_BASE_URL = 'http://localhost:8080/api';
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Inicialización síncrona desde localStorage para no perder la sesión al recargar la página
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

  // Iniciar sesión buscando en el backend de Spring Boot por email y contraseña
  const iniciarSesion = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/usuarios`);
      if (!res.ok) {
        throw new Error('No se pudo conectar con el servidor.');
      }

      const usuariosBD = await res.json();
      
      // Busca si existe un usuario con el email y contraseña ingresados
      const usuarioEncontrado = usuariosBD.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (usuarioEncontrado) {
        setUsuario(usuarioEncontrado);
        localStorage.setItem('usuarioActivo', JSON.stringify(usuarioEncontrado));
        return { exito: true, usuario: usuarioEncontrado };
      } else {
        return { exito: false, mensaje: 'Credenciales inválidas. Revisa tu correo y contraseña.' };
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return { exito: false, mensaje: 'Error de conexión con la base de datos.' };
    }
  };

  // Registrar un nuevo usuario en la base de datos H2 mediante Spring Boot
  const registrarUsuario = async (datosNuevoUsuario) => {
    try {
      // 1. Verificar si el email ya existe en la BD
      const resCheck = await fetch(`${API_BASE_URL}/usuarios`);
      if (resCheck.ok) {
        const usuariosExistentes = await resCheck.json();
        const existe = usuariosExistentes.some(
          (u) => u.email.toLowerCase() === datosNuevoUsuario.email.toLowerCase()
        );
        if (existe) {
          return { exito: false, mensaje: 'El correo electrónico ya se encuentra registrado.' };
        }
      }

      // 2. Guardar el nuevo usuario en el backend
      const resCrear = await fetch(`${API_BASE_URL}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: datosNuevoUsuario.nombre,
          email: datosNuevoUsuario.email,
          password: datosNuevoUsuario.password,
          region: datosNuevoUsuario.region || '',
          comuna: datosNuevoUsuario.comuna || '',
          telefono: datosNuevoUsuario.telefono || '',
          esadmin: datosNuevoUsuario.esadmin || false
        })
      });

      if (resCrear.ok) {
        const usuarioCreado = await resCrear.json();
        setUsuario(usuarioCreado);
        localStorage.setItem('usuarioActivo', JSON.stringify(usuarioCreado));
        return { exito: true, usuario: usuarioCreado };
      } else {
        return { exito: false, mensaje: 'No se pudo completar el registro en el servidor.' };
      }
    } catch (error) {
      console.error('Error en el registro de usuario:', error);
      return { exito: false, mensaje: 'Error al conectar con la base de datos.' };
    }
  };

  // Cerrar sesión y limpiar storage
  const cerrarSesion = () => {
    setUsuario(null);
    localStorage.removeItem('usuarioActivo');
  };

  // Verificar rol de Administrador considerando los nombres de las propiedades Java
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
        iniciarSesion,
        registrarUsuario,
        cerrarSesion,
        esAdministrador,

        // Alias para asegurar compatibilidad con código existente
        login: iniciarSesion,
        logout: cerrarSesion,
        isAdmin: esAdministrador
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};