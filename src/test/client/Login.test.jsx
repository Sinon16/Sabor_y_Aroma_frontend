import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import * as AuthContext from '../../context/AuthContext.jsx';
import { apiFetch } from '../../service/api';
import Login from '../../pages/client/Login.jsx';

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
      onClick={() => onSuccess({ credential: 'fake-google-credential' })}
    >
      Iniciar con Google
    </button>
  ),
}));

describe('Vista de Login', () => {
  let mockIniciarSesion;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Simula que iniciarSesion guarda el JWT en localStorage al autenticar
    mockIniciarSesion = vi.fn(async (email) => {
      localStorage.setItem('token', 'jwt-token-generado-123');
      return {
        exito: true,
        usuario: { id: 1, email, esadmin: email.endsWith('@profesor.duoc.cl') },
      };
    });

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      iniciarSesion: mockIniciarSesion,
    });
  });

  it('Debe iniciar sesión con correo y contraseña y guardar el token en localStorage', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const botonSubmit = screen.getByRole('button', { name: /iniciar sesión/i });

    await user.type(emailInput, 'profesor@profesor.duoc.cl');
    await user.type(passwordInput, '123456');
    await user.click(botonSubmit);

    await waitFor(() => {
      expect(mockIniciarSesion).toHaveBeenCalledWith('profesor@profesor.duoc.cl', '123456');
      expect(localStorage.getItem('token')).toBe('jwt-token-generado-123');
    });
  });

  it('Debe autenticar con token de Google, consultar apiFetch y guardar el token en localStorage', async () => {
    const user = userEvent.setup();

    jwtDecode.mockReturnValue({
      email: 'cliente@duocuc.cl',
      name: 'Juan Pérez',
    });

    apiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 2, email: 'cliente@duocuc.cl', password: 'GoogleOAuthUser', esadmin: false },
      ],
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const botonGoogle = screen.getByRole('button', { name: /iniciar con google/i });
    await user.click(botonGoogle);

    await waitFor(() => {
      expect(jwtDecode).toHaveBeenCalledWith('fake-google-credential');
      expect(apiFetch).toHaveBeenCalledWith('/usuarios');
      expect(mockIniciarSesion).toHaveBeenCalledWith('cliente@duocuc.cl', 'GoogleOAuthUser');
      expect(localStorage.getItem('token')).toBe('jwt-token-generado-123');
    });
  });
});