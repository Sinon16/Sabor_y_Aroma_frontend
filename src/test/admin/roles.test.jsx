
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext.jsx';

const EstadoRol = () => {
  const { esAdministrador } = useAuth();

  return (
    <span>{esAdministrador() ? 'Administración' : 'Cliente'}</span>
  );
};

describe('Lógica del Panel de Administración (Roles)', () => {

  afterEach(() => {
    localStorage.clear();
  });

  // TEST 1: Rol Administrador
  it('Debe reconocer a un usuario Administrador (esadmin = 1)', () => {
    localStorage.setItem('usuarioActivo', JSON.stringify({
      id: 1,
      nombre: 'Administrador',
      esadmin: 1
    }));

    render(
      <AuthProvider>
        <EstadoRol />
      </AuthProvider>
    );

    expect(screen.getByText('Administración')).toBeInTheDocument();
  });

  // TEST 2: Rol Cliente
  it('Debe reconocer a un Cliente (esadmin = 0)', () => {
    localStorage.setItem('usuarioActivo', JSON.stringify({
      id: 2,
      nombre: 'Cliente',
      esadmin: 0
    }));

    render(
      <AuthProvider>
        <EstadoRol />
      </AuthProvider>
    );

    expect(screen.getByText('Cliente')).toBeInTheDocument();
  });

});
