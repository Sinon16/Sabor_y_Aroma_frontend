
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext.jsx';
import AdminSidebar from '../../components/admin/AdminSidebar.jsx';

describe('Menú Lateral del Administrador (Sidebar)', () => {

  // TEST 1: Enlaces principales
  it('Debe renderizar los enlaces principales del panel', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <AdminSidebar />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/Panel Admin/i)).toBeInTheDocument();
    expect(screen.getByText(/Productos/i)).toBeInTheDocument();
    expect(screen.getByText(/Usuarios/i)).toBeInTheDocument();
    expect(screen.getByText(/Órdenes/i)).toBeInTheDocument();
  });

  // TEST 2: Volver a la tienda
  it('Debe renderizar el enlace para volver a la Tienda', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <AdminSidebar />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByRole('link', { name: /Ver Tienda/i })).toBeInTheDocument();
  });

  // TEST 3: Cerrar sesión
  it('Debe renderizar el botón de Cerrar Sesión en rojo', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <AdminSidebar />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByRole('button', { name: /Cerrar Sesión/i })).toHaveClass('btn-danger');
  });

  // TEST 4: Dashboard
  it('Debe renderizar el enlace principal al Dashboard', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <AdminSidebar />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

});
