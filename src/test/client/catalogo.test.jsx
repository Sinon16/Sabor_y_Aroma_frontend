import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext.jsx';
import { CartProvider } from '../../context/CartContext.jsx';
import { apiFetch } from '../../service/api';
import Catalogo from '../../pages/client/catalogo.jsx';

vi.mock('../../service/api', () => ({
  apiFetch: vi.fn(),
}));

const productosFalsos = [
  { id: 1, nombre: 'Sushi Roll', precio: 8900, categoria: 'Opción Saludable', imagen: '/sushi.jpg' },
  { id: 2, nombre: 'Hamburguesa', precio: 6500, categoria: 'Pizzas y Hamburguesas', imagen: '/burger.jpg' },
];

const categoriasFalsas = [
  { idCategoria: 1, nombreCategoria: 'Opción Saludable' },
  { idCategoria: 2, nombreCategoria: 'Pizzas y Hamburguesas' },
];

describe('Vista de Catálogo', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    apiFetch.mockImplementation((endpoint) => {
      if (endpoint.includes('/categorias')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(categoriasFalsas),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(productosFalsos),
      });
    });
  });

  it('Debe renderizar el catálogo general y la lista de productos', async () => {
    render(
      <AuthProvider>
        <CartProvider>
          <MemoryRouter initialEntries={['/categorias']}>
            <Catalogo />
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /nuestro menú gastronómico/i })).toBeInTheDocument();
    });
  });

  it('Debe renderizar la vista de detalle cuando se pasa un ID de producto en la URL', async () => {
    render(
      <AuthProvider>
        <CartProvider>
          <MemoryRouter initialEntries={['/categorias?id=1']}>
            <Catalogo />
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /volver al menú/i })).toBeInTheDocument();
    });
  });

  it('Debe filtrar los productos al hacer clic en una categoría del menú lateral', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <CartProvider>
          <MemoryRouter initialEntries={['/categorias']}>
            <Catalogo />
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sushi Roll')).toBeInTheDocument();
      expect(screen.getByText('Hamburguesa')).toBeInTheDocument();
    });

    const opcionSaludable = screen.getByText(/opción saludable/i);
    await user.click(opcionSaludable);

    expect(screen.getByText('Sushi Roll')).toBeInTheDocument();
    expect(screen.queryByText('Hamburguesa')).not.toBeInTheDocument();
  });
});