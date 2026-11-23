
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ReportesAdmin from '../../pages/admin/ReportesAdmin.jsx';

const reportesMock = [
  {
    id: 1,
    fecha: '2026-11-20T12:00:00',
    tipo_reporte: 'Producto',
    especialidad: 'Nuevo',
    descripcion: 'Producto agregado'
  },
  {
    id: 2,
    fecha: '2026-11-21T12:00:00',
    tipo_reporte: 'Usuario',
    especialidad: 'Editar',
    descripcion: 'Usuario actualizado'
  }
];

describe('Vista de Administración de Reportes', () => {

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(reportesMock)
      })
    ));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // TEST 1: Título principal
  it('Debe renderizar el título de Reporte General', async () => {
    render(
      <MemoryRouter>
        <ReportesAdmin />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Reporte General de Registros/i })).toBeInTheDocument();

    await screen.findByText('Producto agregado');
  });

  // TEST 2: Carga de reportes desde la API
  it('Debe mostrar los registros obtenidos desde la API', async () => {
    render(
      <MemoryRouter>
        <ReportesAdmin />
      </MemoryRouter>
    );

    expect(await screen.findByText('Producto agregado')).toBeInTheDocument();
    expect(screen.getByText('Usuario actualizado')).toBeInTheDocument();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/reportes',
      expect.objectContaining({ cache: 'no-store' })
    );
  });

  // TEST 3: Filtro de reportes
  it('Debe filtrar los reportes por tipo Producto', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ReportesAdmin />
      </MemoryRouter>
    );

    await screen.findByText('Producto agregado');

    await user.click(screen.getByRole('button', { name: 'Productos' }));

    expect(screen.getByText('Producto agregado')).toBeInTheDocument();
    expect(screen.queryByText('Usuario actualizado')).not.toBeInTheDocument();
  });

});
