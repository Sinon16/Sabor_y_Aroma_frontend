import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { apiFetch } from '../../service/api';
import Inicio from '../../pages/client/Inicio.jsx';

vi.mock('../../service/api', () => ({
  apiFetch: vi.fn(),
}));

const productosMock = [
  { id: 10, nombre: 'Sushi Roll Especial' },
  { id: 20, nombre: 'Ensalada César' },
  { id: 30, nombre: 'Hamburguesa Clásica' },
];

describe('Vista de Inicio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiFetch.mockResolvedValue({
      ok: true,
      json: async () => productosMock,
    });
  });

  it('Debe renderizar los elementos principales de la página y cargar productos con apiFetch', async () => {
    render(
      <MemoryRouter>
        <Inicio />
      </MemoryRouter>
    );

    expect(screen.getByText('¡Comida deliciosa directo a tu puerta!')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver menú completo/i })).toBeInTheDocument();
    expect(screen.getByAltText('Sushi destacado')).toBeInTheDocument();

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/productos');
      expect(screen.getByTitle('Ver detalle de Sushi')).toHaveAttribute('href', '/catalogo?id=10');
    });
  });
});