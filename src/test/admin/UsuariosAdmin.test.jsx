
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import UsuariosAdmin from '../../pages/admin/UsuariosAdmin.jsx';

const usuariosMock = [
  {
    id: 1,
    nombre: 'Ana Díaz',
    email: 'ana@correo.cl',
    region: 'Región Metropolitana',
    comuna: 'Santiago',
    esadmin: 1
  },
  {
    id: 2,
    nombre: 'Pedro Pérez',
    email: 'pedro@correo.cl',
    region: 'Región Metropolitana',
    comuna: 'Maipú',
    esadmin: 0
  }
];

describe('Vista de Administración de Usuarios', () => {

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url, opciones = {}) => {
      let datos = {};

      if (url.includes('/api/usuarios') && !opciones.method) {
        datos = usuariosMock;
      }

      if (url.includes('/api/regiones') || url.includes('/api/comunas')) {
        datos = [];
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(datos)
      });
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // TEST 1: Formulario de usuarios
  it('Debe renderizar la interfaz de gestión de usuarios', async () => {
    render(
      <MemoryRouter>
        <UsuariosAdmin />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Gestión de Usuarios/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Nuevo Usuario/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Crear Usuario/i })).toBeInTheDocument();

    await within(screen.getByRole('table')).findByText('Ana Díaz');
  });

  // TEST 2: Carga de usuarios desde la API
  it('Debe mostrar los usuarios obtenidos desde la API', async () => {
    render(
      <MemoryRouter>
        <UsuariosAdmin />
      </MemoryRouter>
    );

    const tabla = within(screen.getByRole('table'));

    expect(await tabla.findByText('Ana Díaz')).toBeInTheDocument();
    expect(tabla.getByText('Pedro Pérez')).toBeInTheDocument();
    expect(tabla.getByText('Administración')).toBeInTheDocument();
    expect(tabla.getByText('Cliente')).toBeInTheDocument();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/usuarios',
      expect.objectContaining({ cache: 'no-store' })
    );
  });

  // TEST 3: Actualización de usuarios
  it('Debe enviar una petición PUT al actualizar un usuario', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <UsuariosAdmin />
      </MemoryRouter>
    );

    await within(screen.getByRole('table')).findByText('Ana Díaz');

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);

    expect(screen.getByRole('heading', { name: /Editar Usuario/i })).toBeInTheDocument();

    const formulario = screen.getByRole('button', { name: /Actualizar Usuario/i }).closest('form');

    fireEvent.submit(formulario);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/usuarios/1',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  // TEST 4: Eliminación de usuarios
  it('Debe enviar una petición DELETE al eliminar un usuario', async () => {
    const user = userEvent.setup();

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <MemoryRouter>
        <UsuariosAdmin />
      </MemoryRouter>
    );

    await within(screen.getByRole('table')).findByText('Ana Díaz');

    await user.click(screen.getAllByRole('button', { name: 'Eliminar' })[0]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/usuarios/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

});
