# Manual de Usuario & Guía del Sistema — Sabor & Aroma 🍔

**Versión del Documento:** 1.0  
**Fecha de Creación:** 19/11/2026  



## 1. Introducción

### Propósito del documento
El propósito de este manual de usuario es proporcionar una guía clara, estructurada y detallada sobre la operación, navegación y administración de la plataforma e-commerce **Sabor & Aroma**. Está dirigido tanto a los usuarios finales (clientes) que navegan y realizan pedidos en la tienda gastronómica, como al personal administrativo encargado de gestionar inventarios, categorías, órdenes de despacho y reportes del sistema.

### Descripción del sistema
**Sabor & Aroma** es una plataforma e-commerce web full-stack enfocada en el rubro gastronómico. El sistema está compuesto por tres capas principales de arquitectura:
- **Frontend (Este repositorio):** Desarrollado con **React 18** y **Vite** para una interfaz responsiva e interactiva. Se comunica con el servidor mediante el wrapper centralizado **`apiFetch`** (`API_BASE_URL = 'http://localhost:8080/api'`), el cual inyecta automáticamente las cabeceras `Content-Type: application/json` y `Authorization: Bearer <token>` desde `localStorage`, y limpia la sesión local automáticamente ante respuestas `401 Unauthorized`.
- **Backend (Repositorio externo):** Desarrollado con **Java y Spring Boot** en el repositorio [Sinon16/db-sabor-aroma](https://github.com/Sinon16/db-sabor-aroma), encargado de exponer la API RESTful en `http://localhost:8080`, gestionar la seguridad con **Spring Security + JWT** y ejecutar la lógica de negocio.
- **Base de Datos:** Base de datos relacional **H2 en memoria configurada en modo compatibilidad MySQL** (`jdbc:h2:mem:sabor_aroma_db;MODE=MySQL;DB_CLOSE_DELAY=-1`) gestionada con **Spring Data JPA / Hibernate**, con precarga automática de datos desde `data.sql` y consola web habilitada en `/h2-console`.

### Cómo usar este manual
Para una óptima consulta de esta documentación, se recomienda seguir el flujo secuencial si se instala el proyecto desde cero. Si el usuario desea explorar la navegación de la plataforma, puede dirigirse a la sección **Comenzando** y **Uso del Software**. Los usuarios administradores encontrarán los detalles específicos de gestión en la subsección dedicada al **Panel de Administración**.

---

## 2. Requisitos del Sistema

### Hardware necesario
- **Para usuarios finales (Clientes):**
  - Procesador: Dual Core 1.5 GHz o superior.
  - Memoria RAM: 2 GB o superior.
  - Dispositivo: Computador de escritorio, laptop, tablet o smartphone con pantalla responsiva.
  - Conexión a Internet: Conexión estable de banda ancha o red móvil (3G/4G/5G).
- **Para entorno de ejecución local / Servidor de Desarrollo:**
  - Procesador: Quad-Core 2.0 GHz o superior.
  - Memoria RAM: 4 GB mínimo (8 GB recomendado).
  - Almacenamiento: 1 GB de espacio libre en disco para código fuente, dependencias de Maven y Node.js.

### Software necesario
- **Navegador Web:** Google Chrome (v100+), Mozilla Firefox (v100+), Microsoft Edge o Safari.
- **Servicios de Backend y Frontend (para ejecución local):**
  - **Java (JDK):** Versión 17 o superior.
  - **Maven:** Versión 3.8 o superior (o wrapper `./mvnw` incluido).
  - **Node.js:** Versión 18.0 o superior (para ejecutar el frontend en React + Vite).
  - **Git:** Para clonación e inspección de los repositorios.

---

## 3. Instalación y Configuración

### Instrucciones de instalación paso a paso

#### Paso 1: Descargar y Encender el Backend (Repositorio Independiente)
El backend de **Sabor & Aroma** ya viene completamente preconfigurado (incluyendo Spring Security, JWT, base de datos H2 en modo MySQL y carga automática de `data.sql`) en el siguiente repositorio:

🔗 **Repositorio del Backend:** [https://github.com/Sinon16/db-sabor-aroma](https://github.com/Sinon16/db-sabor-aroma)

Para clonarlo y encenderlo:
```bash
git clone [https://github.com/Sinon16/db-sabor-aroma.git](https://github.com/Sinon16/db-sabor-aroma.git)
cd db-sabor-aroma
mvn spring-boot:run
```
*(Si no tienes Maven instalado globalmente, puedes usar `./mvnw spring-boot:run` en Linux/Mac o `mvnw.cmd spring-boot:run` en Windows).*

Una vez encendido, el servidor quedará disponible en:
- **API REST:** `http://localhost:8080/api`
- **Consola H2:** `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:sabor_aroma_db`, Usuario: `sa`, Contraseña: `password`)
- **Documentación Swagger:** `http://localhost:8080/swagger-ui/index.html`

#### Paso 2: Instalar y Encender el Frontend (React + Vite + `apiFetch`)
1. Clona este repositorio e instala las dependencias de Node.js:
```bash
git clone [https://github.com/tu-usuario/sabor-y-aroma.git](https://github.com/tu-usuario/sabor-y-aroma.git)
cd sabor-y-aroma
npm install
```
2. Inicia el servidor de desarrollo de Vite:
```bash
npm run dev
```
El frontend quedará activo en `http://localhost:5173` y se conectará automáticamente a `http://localhost:8080/api` a través de `apiFetch`.

### Verificación inicial
Asegúrate de mantener ambas terminales abiertas en paralelo:
1. **Backend (`db-sabor-aroma`):** corriendo en `http://localhost:8080`.
2. **Frontend (React + Vite):** corriendo en `http://localhost:5173`.

---

## 4. Comenzando

### Crear una cuenta / Iniciar sesión

#### Crear Cuenta Nueva
1. Presione el botón **Crear cuenta** ubicado en la barra superior del sistema.
2. Diligencie los campos requeridos en el formulario de registro:
   - **Nombre Completo:** Requiere nombre y apellido (ej. *Juan Pérez*).
   - **Correo Electrónico:** Se aceptan dominios institucionales y personales válidos (`@gmail.com`, `@duoc.cl` o `@profesor.duoc.cl`).
   - **Contraseña:** Mínimo de 6 caracteres.
   - **Ubicación:** Selección condicional de Región y Comuna.
3. Presione **Registrarse**.  
*Nota de Asignación Automática de Rol:* Todo usuario registrado con un correo perteneciente al dominio `@profesor.duoc.cl` obtendrá automáticamente el rol de **Administrador**.

#### Iniciar Sesión
1. Presione el enlace **Iniciar sesión** en la barra superior.
2. Ingrese su correo electrónico y contraseña registrada.
3. El cliente `apiFetch` enviará las credenciales a Spring Boot (`http://localhost:8080/api/usuarios/login`), validará el usuario y almacenará el token **JWT** en `localStorage`. Si el usuario cuenta con el rol de administrador, se activará el botón **⚙️ Panel Administrador** en el encabezado de navegación.

### Interfaz de usuario inicial

La pantalla de bienvenida presenta el encabezado global, el menú de categorías y el banner promocional del restaurante.

**Número:** Figura 1  
**Título:** Interfaz Principal y Pantalla de Inicio de Sabor & Aroma  
**Imagen:**  
<img src="https://lh3.googleusercontent.com/d/1rXwbOz5nVE5ALIXJFatx0R6_hxLu7HNt" alt="Pantalla de Inicio de Sabor y Aroma" width="100%" />  
**Nota:** Muestra el encabezado principal con la barra de navegación, bienvenida personalizada al usuario autenticado, enlace al Panel Administrador y el mensaje principal con botón directo hacia el menú completo.

---

## 5. Uso del Software

### Funciones principales

#### 1. Buscar Productos y Catálogo
El sistema ofrece dos alternativas para la búsqueda de platillos gastronómicos:
- **Por Categoría Dinámica:** Posicione el cursor sobre la flecha **▼** junto a **Categorías** en el menú superior y seleccione la especialidad (Pizzas, Hamburguesas, Ensaladas, Postres).
- **Catálogo Completo:** Haga clic en el botón **Ver Menú Completo** o seleccione **🍽️ Todas las Categorías** para visualizar la totalidad del menú gastronómico.

**Número:** Figura 2  
**Título:** Menú Gastronómico y Catálogo de Productos  
**Imagen:**  
<img src="https://lh3.googleusercontent.com/d/1qLTOrlyHyNhCTtWQmPMDnYn1vh7u422v" alt="Catálogo de Productos de Sabor y Aroma" width="100%" />  
**Nota:** Ilustra el catálogo estructurado con menú lateral de categorías (Comida Rápida, Saludable, Postres, Bebidas, Vegana) y las tarjetas de platillos con precio y botón "Agregar al Pedido".

#### 2. Realizar un Pedido (Carrito & Checkout)
- **Paso 1: Agregar Productos:** Al presionar **Agregar al Pedido** en cualquier tarjeta, el contador dinámico del botón **🛒 Mi Pedido (N)** en el encabezado se incrementará automáticamente.
- **Paso 2: Revisión del Carrito:** En el módulo del carrito, el usuario puede incrementar o decrementar cantidades con los botones **+** y **-**, remover artículos del contenedor, o ingresar cupones promocionales (ej. `SABOR10`) para obtener un descuento automático.
- **Paso 3: Proceso de Compra (Checkout):**
  - El usuario ingresa su dirección de despacho (Calle, Departamento, Región y Comuna).
  - **Pasarela Simulada:** Al presionar **Pagar Ahora**, la plataforma envía la orden mediante `apiFetch` al backend en Spring Boot, registra la transacción en la base de datos `sabor_aroma_db`, asigna un número de orden único (ej. `#100025`), vacía el carrito de compras y permite la generación de un comprobante/boleta en formato PDF.

#### 3. Panel de Administración (👑 Exclusivo Administradores)
Los usuarios con privilegios administrativos tienen acceso exclusivo al Panel de Control de gestión, protegido mediante validación de rol `ADMIN` en Spring Security y envío automático del token Bearer a través de `apiFetch`.

**Número:** Figura 3  
**Título:** Panel de Control y Dashboard de Administración  
**Imagen:**  
<img src="https://lh3.googleusercontent.com/d/1867gANz18L0gFI-EHwHRH-g6TOu0_ueh" alt="Panel de Administración Sabor y Aroma" width="100%" />  
**Nota:** Muestra el panel administrativo central con métricas clave en tiempo real (Compras Totales, Productos en Inventario, Usuarios Registrados) y accesos directos a los submódulos de gestión.

El panel administrativo incluye los siguientes módulos funcionales:
- **📊 Dashboard:** Métricas consolidadas en tiempo real de actividad y ventas.
- **📦 Gestión de Productos (ProductosAdmin):** Formulario para crear, editar y eliminar platillos. Incluye alerta automática de stock crítico cuando las existencias son iguales o inferiores a 10 unidades ($\le 10$).
- **📁 Gestión de Categorías (CategoriasAdmin):** Alta, modificación y baja de categorías del menú.
- **🛒 Gestión de Órdenes (Ordenes):** Monitoreo de pedidos con selector de estado en tiempo real (Pendiente, En Camino, Entregado) y vista modal con el desglose detallado de la orden.
- **👥 Gestión de Usuarios (UsuariosAdmin):** Administración de usuarios registrados y modificación de roles entre Cliente Normal y Administrador.
- **📈 Auditoría y Reportes (ReportesAdmin):** Bitácora de operaciones del sistema clasificando eventos por tipo de entidad y acción realizada (Nuevo, Editar, Eliminar).

---

## 6. Navegación por el Software

### Elementos Globales de Navegación
- **Logo Sabor & Aroma (🍔):** Permite retornar de manera inmediata a la página de inicio desde cualquier sección.
- **Menú Responsivo (☰ / ✕):** En dispositivos móviles y pantallas reducidas, comprime las opciones en un menú desplegable limpio.
- **Barra de Usuario Superior:** Muestra la bienvenida activa y accesos a Mi Perfil, Panel Administrador y Cerrar Sesión.
- **Botonera Principal:** Enlaces a Inicio, Categorías, Ofertas, Nosotros, Blog Culinario, Contacto y el carrito dinámico **Mi Pedido**.

---

## 7. Seguridad y Control de Acceso (Spring Security + JWT)

El backend ([db-sabor-aroma](https://github.com/Sinon16/db-sabor-aroma)) implementa una arquitectura de seguridad sin estado (`STATELESS`) basada en **JSON Web Tokens (JWT)** y encriptación de contraseñas con **BCrypt** (`BCryptPasswordEncoder`).

### Componentes de Seguridad (`com.example.db_sabor_y_aroma.security`)
- **`JwtUtils.java`:** Genera y valida tokens firmados con **HMAC-SHA256 (`HS256`)**, almacenando el `username`/correo en el `subject` y el rol (`ADMIN` o `CLIENTE`) en el claim `rol`, con una vigencia de **24 horas**.
- **`JwtAuthFilter.java`:** Filtro `OncePerRequestFilter` ejecutado antes de `UsernamePasswordAuthenticationFilter`. Extrae el token del encabezado `Authorization: Bearer <token>`, valida su firma y carga las autoridades (`ADMIN`/`CLIENTE` y `ROLE_ADMIN`/`ROLE_CLIENTE`) en el `SecurityContextHolder`.
- **`SecurityConfig.java`:**
  - Configura **CORS** habilitando peticiones desde `http://localhost:5173` (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`) con credenciales activas y encabezados expuestos (`Content-Disposition`, `Authorization`).
  - Deshabilita CSRF (por uso de JWT stateless) y `frameOptions` (para permitir el acceso a `/h2-console`).

### Matriz de Permisos por Rol

| Nivel de Acceso | Rutas / Endpoints Permitidos |
| :--- | :--- |
| **Público (`permitAll`)** | `/h2-console/**`, `/swagger-ui/**`, `/v3/api-docs/**`, `/api/auth/**`, `POST /api/usuarios/login`, `POST /api/usuarios`, `GET /api/usuarios/**`, y consultas `GET` de catálogo (`/api/productos/**`, `/api/categorias/**`, `/api/ofertas/**`, `/api/regiones/**`, `/api/comunas/**`). |
| **Cliente y Admin (`CLIENTE`, `ADMIN`)** | Carrito (`/api/carrito/**`), creación de órdenes y detalles (`POST /api/ordenes/**`, `POST /api/detalle-ordenes/**`), consulta de pedidos por usuario (`GET /api/ordenes/usuario/**`) y registro de reportes (`POST /api/reportes/**`). |
| **Solo Administrador (`ADMIN`)** | Operaciones `POST`, `PUT`, `DELETE` en `/api/productos/**`, `/api/categorias/**`, `/api/ofertas/**`; modificación y eliminación de usuarios (`PUT`, `DELETE /api/usuarios/**`); gestión completa de `/api/ordenes/**`, `/api/detalle-ordenes/**` y `/api/reportes/**`. |
````[cite: 1, 23, 25, 26, 27, 28, 29]

Para que GitHub muestre las 3 capturas sin problemas, asegúrate de que en Google Drive cada archivo tenga el acceso configurado como **"Cualquier persona con el enlace" (Lector)**.
