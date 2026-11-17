import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '../service/api';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { usuario } = useAuth();
  const [itemsCarrito, setItemsCarrito] = useState([]);
  const [cargandoCarrito, setCargandoCarrito] = useState(false);
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(0);

  const obtenerIdUsuario = useCallback((u) => {
    return u?.id || u?.id_usuario || u?.usuario_id || null;
  }, []);

  const calcularPrecioFinal = (prod) => {
    const precioBase = Number(prod.precio || 0);
    const porcentajeDesc = Number(prod.oferta?.porcentajeDescuento || prod.porcentaje_descuento || 0);

    if (porcentajeDesc > 0 && porcentajeDesc < 100) {
      return Math.round(precioBase * (1 - porcentajeDesc / 100));
    }
    return precioBase;
  };

  // Cargar elementos del carrito desde Spring Boot (con JWT)
  const cargarCarrito = useCallback(async () => {
    const userId = obtenerIdUsuario(usuario);

    if (!userId) {
      setItemsCarrito([]);
      setCargandoCarrito(false);
      return;
    }

    setCargandoCarrito(true);
    try {
      const res = await apiFetch(`/carrito?usuario_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const itemsFormateados = data.map((item) => {
            const productoObj = item.producto || {};
            const precioBase = Number(productoObj.precio || 0);
            const porcentajeDesc = Number(productoObj.oferta?.porcentajeDescuento || 0);
            const precioFinal = calcularPrecioFinal(productoObj);

            return {
              id: item.id,
              producto_id: productoObj.id,
              nombre: productoObj.nombre,
              descripcion: productoObj.descripcion,
              precioOriginal: precioBase,
              precio: precioFinal,
              porcentaje_descuento: porcentajeDesc,
              imagen: productoObj.imagen,
              cantidad: Number(item.cantidad),
            };
          });
          setItemsCarrito(itemsFormateados);
        }
      }
    } catch (err) {
      console.error('Error cargando carrito desde Spring Boot:', err);
      setItemsCarrito([]);
    } finally {
      setCargandoCarrito(false);
    }
  }, [usuario, obtenerIdUsuario]);

  useEffect(() => {
    cargarCarrito();
  }, [cargarCarrito]);

  // Agregar producto al carrito en Spring Boot (con JWT)
  const agregarAlCarrito = async (producto) => {
    const userId = obtenerIdUsuario(usuario);
    if (!userId) {
      return { exito: false, requiereLogin: true };
    }

    try {
      const res = await apiFetch('/carrito', {
        method: 'POST',
        body: JSON.stringify({
          usuario_id: userId,
          producto_id: producto.id,
          cantidad: 1,
        }),
      });

      if (res.ok) {
        await cargarCarrito();
        return { exito: true };
      }
    } catch (err) {
      console.error('Error al guardar en BD Spring Boot:', err);
    }
    return { exito: false };
  };

  // Actualizar la cantidad de un item por su ID de carrito (con JWT)
  const actualizarCantidad = async (itemId, nuevaCantidad) => {
    const userId = obtenerIdUsuario(usuario);
    if (!userId) return;

    if (nuevaCantidad <= 0) {
      await eliminarDelCarrito(itemId);
      return;
    }

    setItemsCarrito((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, cantidad: nuevaCantidad } : item
      )
    );

    try {
      await apiFetch(`/carrito/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({
          usuario_id: userId,
          cantidad: nuevaCantidad,
        }),
      });
      await cargarCarrito();
    } catch (err) {
      console.error('Error actualizando cantidad en Spring Boot:', err);
    }
  };

  // Eliminar un item del carrito por su ID (con JWT)
  const eliminarDelCarrito = async (itemId) => {
    const userId = obtenerIdUsuario(usuario);
    if (!userId) return;

    setItemsCarrito((prevItems) => prevItems.filter((item) => item.id !== itemId));

    try {
      await apiFetch(`/carrito/${itemId}?usuario_id=${userId}`, {
        method: 'DELETE',
      });
      await cargarCarrito();
    } catch (err) {
      console.error('Error eliminando producto de Spring Boot:', err);
    }
  };

  // Vaciar completamente el carrito del usuario (con JWT)
  const limpiarCarrito = async () => {
    const userId = obtenerIdUsuario(usuario);
    setItemsCarrito([]);
    setDescuentoPorcentaje(0);

    if (userId) {
      try {
        await apiFetch(`/carrito/vaciar?usuario_id=${userId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Error vaciando carrito en Spring Boot:', err);
      }
    }
  };

  const obtenerTotalItems = () => {
    if (!usuario) return 0;
    return itemsCarrito.reduce((total, item) => total + (Number(item.cantidad) || 1), 0);
  };

  const obtenerSubtotal = () => {
    return itemsCarrito.reduce(
      (total, item) => total + Number(item.precio || 0) * (Number(item.cantidad) || 1),
      0
    );
  };

  const obtenerPrecioTotal = () => {
    const subtotal = obtenerSubtotal();
    return Math.round(subtotal * (1 - descuentoPorcentaje));
  };

  const aplicarCupon = (codigo) => {
    const cuponLimpio = codigo.trim().toUpperCase();
    if (cuponLimpio === 'SABOR10') {
      setDescuentoPorcentaje(0.10);
      return { exito: true, mensaje: '¡Cupón del 10% aplicado correctamente!' };
    }
    return { exito: false, mensaje: 'Cupón no válido.' };
  };

  return (
    <CartContext.Provider
      value={{
        itemsCarrito,
        cargandoCarrito,
        agregarAlCarrito,
        eliminarDelCarrito,
        actualizarCantidad,
        limpiarCarrito,
        obtenerTotalItems,
        obtenerSubtotal,
        obtenerPrecioTotal,
        aplicarCupon,
        descuentoPorcentaje,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};