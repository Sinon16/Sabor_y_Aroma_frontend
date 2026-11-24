import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import * as AuthContext from '../../context/AuthContext.jsx';
import { apiFetch } from '../../service/api';
import Registro from '../../pages/client/Registro.jsx';

vi.mock('../../service/api', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(),
}));

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess }) => (
    <button
      type="button"
      onClick={() => onSuccess({ credential: 'fake-google-register-token' })}
    >
      Registrarse con Google
    </button>
  ),
}));

describe('Vista de Registro', () => {
  let mockIniciarSesion;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mockIniciarSesion = vi.fn(async () => {
      localStorage.setItem('token', 'jwt-token-google-registro');
      return { exito: true };
    });

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      iniciarSesion: mockIniciarSesion,
    });

    apiFetch.mockImplementation((endpoint, options) => {
      if (endpoint === '/regiones') {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      if (endpoint === '/usuarios' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 10,
            nombre: 'Ana Gómez',
            email: 'ana@gmail.com',
            password: 'GoogleOAuthUser',
          }),
        });
      }
      if (endpoint === '/usuarios') {
        return Promise.resolve({
          ok: true,
          json: async () => [], // El usuario aún no existe
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    });
  });

  it('Debe permitir completar los campos del formulario de registro correctamente', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Registro />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/regiones');
    });

    const nombreInput = screen.getByLabelText(/nombre completo/i);
    const emailInput = screen.getByLabelText(/^correo$/i);
    const confirmarEmailInput = screen.getByLabelText(/correo \(confirmación\)/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const confirmarPasswordInput = screen.getByLabelText(/confirmar contraseña/i);

    await user.type(nombreInput, 'Juan Pérez');
    await user.type(emailInput, 'juan.perez@duocuc.cl');
    await user.type(confirmarEmailInput, 'juan.perez@duocuc.cl');
    await user.type(passwordInput, '123456');
    await user.type(confirmarPasswordInput, '123456');

    expect(nombreInput).toHaveValue('Juan Pérez');
    expect(emailInput).toHaveValue('juan.perez@duocuc.cl');
    expect(confirmarEmailInput).toHaveValue('juan.perez@duocuc.cl');
    expect(passwordInput).toHaveValue('123456');
    expect(confirmarPasswordInput).toHaveValue('123456');

    const botonSubmit = screen.getByRole('button', { name: /registrarse$/i });
    expect(botonSubmit).toBeInTheDocument();
  });

  it('Debe registrar un usuario nuevo usando el token de Google e iniciar sesión', async () => {
    const user = userEvent.setup();

    jwtDecode.mockReturnValue({
      email: 'ana@gmail.com',
      name: 'Ana Gómez',
    });

    render(
      <MemoryRouter>
        <Registro />
      </MemoryRouter>
    );

    const botonGoogle = screen.getByRole('button', { name: /registrarse con google/i });
    await user.click(botonGoogle);

    await waitFor(() => {
      expect(jwtDecode).toHaveBeenCalledWith('fake-google-register-token');
      expect(apiFetch).toHaveBeenCalledWith('/usuarios');
      expect(apiFetch).toHaveBeenCalledWith(
        '/usuarios',
        expect.objectContaining({ method: 'POST' })
      );
      expect(mockIniciarSesion).toHaveBeenCalledWith('ana@gmail.com', 'GoogleOAuthUser');
      expect(localStorage.getItem('token')).toBe('jwt-token-google-registro');
      expect(screen.getByText(/cuenta creada con éxito como cliente/i)).toBeInTheDocument();
    });
  });
});