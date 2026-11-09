import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Carousel from 'react-bootstrap/Carousel';

// URL Base del Backend Spring Boot
const API_BASE_URL = 'http://localhost:8080/api';

export default function Inicio() {
  const [productosBD, setProductosBD] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/productos`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al obtener productos');
        return res.json();
      })
      .then((data) => setProductosBD(data))
      .catch((err) => console.error('Error al cargar productos en Inicio desde Spring Boot:', err));
  }, []);

  // Función helper para resolver el ID del producto por búsqueda en el nombre
  const obtenerIdPorNombre = (palabraClave, idPorDefecto) => {
    if (!Array.isArray(productosBD) || productosBD.length === 0) return idPorDefecto;
    const encontrado = productosBD.find((p) =>
      p.nombre && p.nombre.toLowerCase().includes(palabraClave.toLowerCase())
    );
    return encontrado ? encontrado.id : idPorDefecto;
  };

  // IDs calculados según los nombres en data.sql de Spring Boot
  const idSushi = obtenerIdPorNombre('sushi', 8);
  const idCaesar = obtenerIdPorNombre('césar', 3) || obtenerIdPorNombre('cesar', 3);
  const idHamburguesa = obtenerIdPorNombre('hamburguesa', 1);

  return (
    <div className="container">
      <main className="main-content">
        <section className="hero-banner">
          <h2>¡Comida deliciosa directo a tu puerta!</h2>
          <p>Descubre nuestros platillos preparados con ingredientes frescos y locales.</p>
          <Link to="/catalogo" className="btn-primary">
            Ver Menú Completo
          </Link>
        </section>

        <section className="hero-banner">
          <h2>Productos Destacados</h2>
          <p>Los platillos más pedidos este mes</p>

          <Carousel id="carouselExample">
            <Carousel.Item>
              <Link to={`/catalogo?id=${idSushi}`} title="Ver detalle de Sushi">
                <img
                  className="d-block w-100 carousel-img"
                  src="/img/sushi-index.jpg" 
                  alt="Sushi destacado"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/800x400?text=Sushi+Destacado'; }}
                />
              </Link>
            </Carousel.Item>

            <Carousel.Item>
              <Link to={`/catalogo?id=${idCaesar}`} title="Ver detalle de Ensalada César">
                <img
                  className="d-block w-100 carousel-img"
                  src="/img/ceasar-index.jpg" 
                  alt="Ensalada César destacada"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/800x400?text=Ensalada+Cesar+Destacada'; }}
                />
              </Link>
            </Carousel.Item>

            <Carousel.Item>
              <Link to={`/catalogo?id=${idHamburguesa}`} title="Ver detalle de Hamburguesa">
                <img
                  className="d-block w-100 carousel-img"
                  src="/img/hamburguesa-index.webp" 
                  alt="Hamburguesa destacada"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/800x400?text=Hamburguesa+Destacada'; }}
                />
              </Link>
            </Carousel.Item>
          </Carousel>
        </section>
      </main>
    </div>
  );
}