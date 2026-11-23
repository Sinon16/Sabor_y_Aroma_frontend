
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProductosAdmin from '../../pages/admin/ProductosAdmin.jsx';

const productosMock = [
  {
    id: 1,
    nombre: 'Pizza Queso',
    precio: 6500,
    stock: 5,
    descripcion: 'Pizza de queso',
    categoriaId: 1,
    ofertaId: null,
    imagen: ''
  },
  {
    id: 2,
    nombre: 'Sushi Especial',
    precio: 7900,
    stock: 20,
    descripcion: 'Sushi especial',
    categoriaId: 2,
    ofertaId: null,
    imagen: ''
  }
];

const categoriasMock = [
  { id: 1, nombre: 'Pizzas' },
  { id: 2, nombre: 'Sushi' }
];

describe('Vista de Administración de Productos', () => {

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      let datos = [];

      if (url.endsWith('/api/productos')) {
        datos = productosMock;
      }

      if (url.endsWith('/api/categorias')) {
        datos = categoriasMock;
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(datos)
      });
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // TEST 1: Formulario de productos
  it('Debe mostrar el formulario para un Nuevo Producto', async () => {
    render(
      <MemoryRouter>
        <ProductosAdmin />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Gestión de Inventario/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Nuevo Producto/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar Producto/i })).toBeInTheDocument();

    await screen.findByText('Pizza Queso');
  });

  // TEST 2: Carga de productos desde la API
  it('Debe mostrar los productos obtenidos desde la API', async () => {
    render(
      <MemoryRouter>
        <ProductosAdmin />
      </MemoryRouter>
    );

    expect(await screen.findByText('Pizza Queso')).toBeInTheDocument();
    expect(screen.getByText('Sushi Especial')).toBeInTheDocument();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/productos',
      expect.objectContaining({ cache: 'no-store' })
    );
  });

  // TEST 3: Información del inventario
  it('Debe mostrar el precio y stock de los productos', async () => {
    render(
      <MemoryRouter>
        <ProductosAdmin />
      </MemoryRouter>
    );

    await screen.findByText('Pizza Queso');

    expect(screen.getByText('$6.500')).toBeInTheDocument();
    expect(screen.getByText('5 u.')).toBeInTheDocument();
    expect(screen.getByText('20 u.')).toBeInTheDocument();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/ofertas',
      expect.objectContaining({ cache: 'no-store' })
    );
  });

  // TEST 4: Actualización de productos
  it('Debe enviar una petición PUT al actualizar un producto', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ProductosAdmin />
      </MemoryRouter>
    );

    await screen.findByText('Pizza Queso');

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0]);

    expect(screen.getByRole('heading', { name: /Editar Producto/i })).toBeInTheDocument();

    const formulario = screen.getByRole('button', { name: /Actualizar Producto/i }).closest('form');

    fireEvent.submit(formulario);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/productos/1',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

});
