import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import * as CartContext from '../../context/CartContext.jsx';
import * as AuthContext from '../../context/AuthContext.jsx';
import { apiFetch } from '../../service/api';
import Comprar from '../../pages/client/Comprar.jsx';

vi.mock('../../service/api', () => ({
  apiFetch: vi.fn(),
}));

describe('Vista de Comprar (Checkout)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    apiFetch.mockImplementation((endpoint) => {
      if (endpoint.includes('/ordenes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 123456 }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      usuario: { id: 1, nombre: 'Juan Pérez', email: 'juan@duoc.cl', region: 'Metropolitana', comuna: 'Santiago' },
    });

    vi.spyOn(CartContext, 'useCart').mockReturnValue({
      itemsCarrito: [
        { id: 1, nombre: 'Pizza Mozzarella', precio: 8900, cantidad: 1, imagen: '/pizza.jpg' },
      ],
      obtenerPrecioTotal: () => 8900,
      limpiarCarrito: vi.fn(),
    });
  });

  it('Debe renderizar la información del cliente y los campos de dirección de entrega', async () => {
    render(
      <MemoryRouter>
        <Comprar />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /carrito de compra/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/calle\*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/departamento \(opcional\)/i)).toBeInTheDocument();
    });
  });

  it('Debe mostrar la pantalla de confirmación exitosa al hacer clic en Pago Correcto', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Comprar />
      </MemoryRouter>
    );

    const botonesPago = screen.getAllByRole('button', { name: /pagar ahora/i });
    await user.click(botonesPago[0]);

    await waitFor(() => {
      expect(screen.getByText(/se ha realizado la compra/i)).toBeInTheDocument();
    });
  });

  it('Debe mostrar la pantalla de error al hacer clic en Pago Incorrecto', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Comprar />
      </MemoryRouter>
    );

    const botonesPago = screen.getAllByRole('button', { name: /pagar ahora/i });
    await user.click(botonesPago[1]);

    await waitFor(() => {
      expect(screen.getByText(/no se pudo realizar el pago/i)).toBeInTheDocument();
    });
  });
});