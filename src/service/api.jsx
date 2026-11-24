export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/**
 * Wrapper sobre fetch que inyecta automáticamente Content-Type y Authorization: Bearer <token>
 */
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Si el token expiró o fue rechazado por Spring Security, limpiar sesión local
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioActivo');
  }

  return response;
}