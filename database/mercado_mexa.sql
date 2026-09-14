-- ============================================
-- MERCADO MEXA - Base de Datos MySQL
-- ============================================
-- Desarrollado para el proyecto Mercado Mexa
-- Tienda local de productos Neto
-- ============================================

-- Forzar conexion en utf8mb4 (necesario para emojis/acentos)
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS mercado_mexa
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE mercado_mexa;


-- ============================================
-- TABLA: usuarios
-- Almacena los usuarios registrados
-- ============================================

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100),
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
<<<<<<< HEAD
    rol ENUM('usuario', 'chofer', 'admin') DEFAULT 'usuario' NOT NULL,
=======
    rol ENUM('usuario', 'chofer', 'admin') DEFAULT 'usuario',
>>>>>>> 7bc17bd4d2a1cf42c82c027c06a36971f12590eb
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- TABLA: categorias
-- Categorías de productos (6 en total)
-- ============================================

CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    icono VARCHAR(10) NOT NULL,
    descripcion TEXT,
    activa TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- TABLA: productos
-- Catálogo de productos por categoría
-- ============================================

CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    presentacion VARCHAR(200) NOT NULL,
    caducidad DATE,
    lote VARCHAR(50),
    icono VARCHAR(10) NOT NULL,
    resenas INT DEFAULT 0,
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- TABLA: tiendas
-- Tiendas Neto (4 en la zona)
-- ============================================

CREATE TABLE tiendas (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    ciudad VARCHAR(150) NOT NULL,
    direccion TEXT NOT NULL,
    lat DECIMAL(10,6) NOT NULL,
    lng DECIMAL(10,6) NOT NULL,
    telefono VARCHAR(20),
    horario VARCHAR(200),
    activa TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- TABLA: carrito
-- Carrito de compras por usuario
-- ============================================

CREATE TABLE carrito (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_carrito (usuario_id, producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- TABLA: favoritos
-- Productos favoritos por usuario
-- ============================================

CREATE TABLE favoritos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    producto_id INT NOT NULL,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_favorito (usuario_id, producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- TABLA: opinion
-- Resenas/opiniones de productos
-- ============================================

CREATE TABLE opinion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    producto_id INT NOT NULL,
    calificacion TINYINT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario TEXT,
    fecha_resena TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- TABLA: pedidos
-- Historial de compras realizadas
-- ============================================

CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tienda_id VARCHAR(50),
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente', 'procesando', 'completado', 'cancelado') DEFAULT 'pendiente',
    metodo_pago VARCHAR(50),
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (tienda_id) REFERENCES tiendas(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- TABLA: pedido_detalles
-- Detalle de productos en cada pedido
-- ============================================

CREATE TABLE pedido_detalles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- INSERTAR CATEGORÍAS
-- ============================================

INSERT INTO categorias (nombre, icono, descripcion) VALUES
('ABARROTES', '🥫', 'Productos básicos de despensa'),
('LÁCTEOS', '🥛', 'Leches, quesos, yogurts y huevo'),
('BEBIDAS', '🥤', 'Refrescos, aguas, jugos y néctares'),
('PAN Y TORTILLAS', '🍞', 'Pan, tortillas y repostería básica'),
('LIMPIEZA', '🧴', 'Productos de limpieza del hogar'),
('FRUTAS Y VERDURAS', '🍎', 'Frutas y verduras frescas');


-- ============================================
-- INSERTAR PRODUCTOS - ABARROTES (cat_id = 1)
-- ============================================

INSERT INTO productos (categoria_id, nombre, precio, presentacion, caducidad, lote, icono, resenas) VALUES
(1, 'Frijol Negro 900g', 32.00, 'Bolsa 900 g', '2026-12-12', 'L-8841', '🫘', 245),
(1, 'Arroz Morelos 1kg', 35.00, 'Bolsa 1 kg', '2027-03-08', 'L-9021', '🍚', 198),
(1, 'Aceite Vegetal 1L', 48.00, 'Botella 1 L', '2027-01-15', 'L-1120', '🫗', 176),
(1, 'Azúcar Estándar 1kg', 29.00, 'Bolsa 1 kg', '2027-08-20', 'A-2231', '🍬', 143),
(1, 'Sal de Mesa 1kg', 18.00, 'Bolsa 1 kg', '2028-05-14', 'S-3412', '🧂', 112),
(1, 'Atún en Agua 140g', 22.00, 'Lata 140 g', '2028-11-10', 'AT-5541', '🐟', 221),
(1, 'Sopa Instantánea Pollo 85g', 12.00, 'Vaso 85 g', '2027-09-18', 'SP-1182', '🍜', 245),
(1, 'Pasta Spaghetti 200g', 17.00, 'Paquete 200 g', '2028-06-22', 'PS-2201', '🍝', 189),
(1, 'Avena 400g', 28.00, 'Bolsa 400 g', '2028-02-14', 'AV-402', '🌾', 134),
(1, 'Mayonesa 390g', 39.00, 'Frasco 390 g', '2027-07-05', 'MY-390', '🥚', 167),
(1, 'Salsa Cátsup 397g', 31.00, 'Botella 397 g', '2027-08-12', 'SC-397', '🍅', 154),
(1, 'Puré de Tomate 210g', 14.00, 'Lata 210 g', '2028-10-18', 'PT-210', '🍅', 98),
(1, 'Café Soluble 100g', 58.00, 'Frasco 100 g', '2028-04-22', 'CF-100', '☕', 203);


-- ============================================
-- INSERTAR PRODUCTOS - LÁCTEOS (cat_id = 2)
-- ============================================

INSERT INTO productos (categoria_id, nombre, precio, presentacion, caducidad, lote, icono, resenas) VALUES
(2, 'Leche Entera Neto 1L', 26.00, 'Envase 1 L', '2026-11-20', 'L-5512', '🥛', 201),
(2, 'Leche Deslactosada 1L', 29.00, 'Envase 1 L', '2026-11-25', 'LD-4310', '🥛', 187),
(2, 'Leche Light 1L', 28.00, 'Envase 1 L', '2026-11-22', 'LL-2201', '🥛', 143),
(2, 'Queso Oaxaca 400g', 68.00, 'Paquete 400 g', '2026-12-05', 'L-5518', '🧀', 178),
(2, 'Queso Panela 400g', 62.00, 'Paquete 400 g', '2026-12-08', 'QP-4418', '🧀', 165),
(2, 'Yogurt Natural 1kg', 38.00, 'Envase 1 kg', '2026-11-28', 'L-5520', '🥛', 143),
(2, 'Yogurt Fresa 1kg', 42.00, 'Envase 1 kg', '2026-11-27', 'YF-3312', '🍓', 190),
(2, 'Crema Ácida 450ml', 35.00, 'Envase 450 ml', '2026-11-30', 'CR-7721', '🥛', 122),
(2, 'Mantequilla 90g', 31.00, 'Barra 90 g', '2027-01-18', 'MA-8820', '🧈', 156),
(2, 'Margarina 225g', 25.00, 'Barra 225 g', '2027-03-16', 'MG-225', '🧈', 109),
(2, 'Huevo Blanco 18 Piezas', 52.00, 'Cartón 18 piezas', '2026-12-15', 'HB-018', '🥚', 198),
(2, 'Bebida Láctea Chocolate 1L', 34.00, 'Envase 1 L', '2026-11-29', 'BC-100', '🥛', 132),
(2, 'Requesón 300g', 44.00, 'Envase 300 g', '2026-12-06', 'RQ-300', '🧀', 87);


-- ============================================
-- INSERTAR PRODUCTOS - BEBIDAS (cat_id = 3)
-- ============================================

INSERT INTO productos (categoria_id, nombre, precio, presentacion, caducidad, lote, icono, resenas) VALUES
(3, 'Refresco Cola 3L', 35.00, 'Botella 3 L', '2027-06-10', 'B-101', '🥤', 276),
(3, 'Agua Purificada 1.5L', 14.00, 'Botella 1.5 L', '2028-06-10', 'B-102', '💧', 198),
(3, 'Jumex Mango 450ml', 18.00, 'Botella 450 ml', '2027-04-15', 'JM-451', '🥭', 189),
(3, 'Agua Natural 1L', 11.00, 'Botella 1 L', '2028-07-21', 'AN-321', '💧', 145),
(3, 'Refresco Manzana 600ml', 19.00, 'Botella 600 ml', '2027-08-02', 'RM-602', '🍎', 176),
(3, 'Bebida de Naranja 1L', 24.00, 'Envase 1 L', '2027-05-19', 'NA-100', '🍊', 134),
(3, 'Agua Mineral 600ml', 16.00, 'Botella 600 ml', '2027-10-12', 'AM-612', '💧', 121),
(3, 'Jugo de Naranja 1L', 32.00, 'Envase 1 L', '2027-02-05', 'JO-778', '🍊', 203),
(3, 'Néctar de Mango 1L', 27.00, 'Envase 1 L', '2027-04-18', 'NM-100', '🥭', 166),
(3, 'Té de Limón 1.5L', 25.00, 'Botella 1.5 L', '2027-05-20', 'TL-150', '🍋', 115),
(3, 'Bebida de Jamaica 1L', 24.00, 'Envase 1 L', '2027-05-16', 'BJ-100', '🌺', 104),
(3, 'Bebida de Horchata 1L', 26.00, 'Envase 1 L', '2027-05-17', 'BH-100', '🥛', 98),
(3, 'Café Frío 450ml', 29.00, 'Botella 450 ml', '2027-04-09', 'CF-450', '☕', 142);


-- ============================================
-- INSERTAR PRODUCTOS - PAN Y TORTILLAS (cat_id = 4)
-- ============================================

INSERT INTO productos (categoria_id, nombre, precio, presentacion, caducidad, lote, icono, resenas) VALUES
(4, 'Pan Blanco Grande', 42.00, 'Pan de caja 680 g', '2026-11-18', 'P-201', '🍞', 167),
(4, 'Pan Integral 680g', 48.00, 'Pan de caja integral', '2026-11-20', 'PI-301', '🍞', 156),
(4, 'Pan Dulce Surtido', 38.00, 'Caja surtida', '2026-11-17', 'PD-442', '🥐', 188),
(4, 'Bolillo 6 Piezas', 28.00, 'Paquete 6 piezas', '2026-11-15', 'BO-602', '🥖', 142),
(4, 'Tostadas de Maíz 300g', 31.00, 'Paquete 300 g', '2027-04-12', 'TM-331', '🌮', 134),
(4, 'Tortillas de Maíz 1kg', 24.00, 'Paquete 1 kg', '2026-11-16', 'P-202', '🌮', 134),
(4, 'Tortillas de Harina 500g', 27.00, 'Paquete 500 g', '2026-11-19', 'TH-501', '🌯', 119),
(4, 'Pan para Hamburguesa 8pz', 45.00, 'Paquete 8 piezas', '2026-11-23', 'PH-808', '🍔', 233),
(4, 'Pan Tostado 250g', 35.00, 'Paquete 250 g', '2026-11-25', 'PT-250', '🍞', 101),
(4, 'Conchas 6 Piezas', 39.00, 'Paquete 6 piezas', '2026-11-18', 'CO-606', '🥐', 178),
(4, 'Galletas Marías 170g', 18.00, 'Paquete 170 g', '2027-06-10', 'GM-170', '🍪', 214),
(4, 'Galletas Saladas 186g', 20.00, 'Paquete 186 g', '2027-07-14', 'GS-186', '🍪', 132),
(4, 'Roles de Canela 6pz', 42.00, 'Paquete 6 piezas', '2026-11-21', 'RC-606', '🍩', 147);


-- ============================================
-- INSERTAR PRODUCTOS - LIMPIEZA (cat_id = 5)
-- ============================================

INSERT INTO productos (categoria_id, nombre, precio, presentacion, caducidad, lote, icono, resenas) VALUES
(5, 'Detergente 1kg', 52.00, 'Bolsa 1 kg', '2028-01-01', 'C-301', '🧺', 122),
(5, 'Detergente Líquido 1L', 58.00, 'Botella 1 L', '2028-02-10', 'DL-100', '🧴', 156),
(5, 'Suavizante 1L', 45.00, 'Botella 1 L', '2028-03-12', 'C-302', '🧴', 143),
(5, 'Cloro 1L', 24.00, 'Botella 1 L', '2027-09-08', 'C-401', '🧴', 134),
(5, 'Limpiador Multiusos 1L', 34.00, 'Botella 1 L', '2028-02-20', 'C-402', '🧽', 167),
(5, 'Jabón para Trastes 750ml', 32.00, 'Botella 750 ml', '2028-05-15', 'C-503', '🫧', 201),
(5, 'Esponjas para Cocina 4pz', 18.00, 'Paquete 4 piezas', '2030-01-01', 'C-601', '🧽', 109),
(5, 'Limpiavidrios 500ml', 29.00, 'Botella 500 ml', '2028-08-10', 'C-701', '🪟', 118),
(5, 'Desinfectante 1L', 39.00, 'Botella 1 L', '2028-06-18', 'C-801', '🧴', 154),
(5, 'Bolsas para Basura 30pz', 35.00, 'Paquete 30 piezas', '2030-01-01', 'BB-030', '🗑️', 88),
(5, 'Papel Higiénico 4pz', 32.00, 'Paquete 4 piezas', '2030-01-01', 'PH-004', '🧻', 189),
(5, 'Servitoallas 120 Hojas', 29.00, 'Paquete 120 hojas', '2030-01-01', 'ST-120', '🧻', 94),
(5, 'Jabón de Barra 3pz', 27.00, 'Paquete 3 piezas', '2030-01-01', 'JB-003', '🧼', 145);


-- ============================================
-- INSERTAR PRODUCTOS - FRUTAS Y VERDURAS (cat_id = 6)
-- ============================================

INSERT INTO productos (categoria_id, nombre, precio, presentacion, caducidad, lote, icono, resenas) VALUES
(6, 'Manzana Roja', 45.00, '1 kg', '2026-09-10', 'FR-101', '🍎', 156),
(6, 'Plátano', 28.00, '1 kg', '2026-09-11', 'FR-102', '🍌', 203),
(6, 'Naranja', 32.00, '1 kg', '2026-09-13', 'FR-103', '🍊', 178),
(6, 'Mandarina', 36.00, '1 kg', '2026-09-14', 'FR-104', '🍊', 134),
(6, 'Limón', 39.00, '1 kg', '2026-09-13', 'FR-105', '🍋', 211),
(6, 'Mango Ataulfo', 49.00, '1 kg', '2026-09-11', 'FR-106', '🥭', 189),
(6, 'Papaya', 35.00, '1 kg', '2026-09-12', 'FR-107', '🥭', 121),
(6, 'Jitomate Saladet', 34.00, '1 kg', '2026-09-10', 'VR-101', '🍅', 198),
(6, 'Cebolla Blanca', 29.00, '1 kg', '2026-09-15', 'VR-102', '🧅', 142),
(6, 'Papa Blanca', 31.00, '1 kg', '2026-09-18', 'VR-103', '🥔', 167),
(6, 'Zanahoria', 27.00, '1 kg', '2026-09-16', 'VR-104', '🥕', 153),
(6, 'Aguacate Hass', 69.00, '1 kg', '2026-09-12', 'VR-105', '🥑', 245),
(6, 'Lechuga Romana', 24.00, '1 pieza', '2026-09-10', 'VR-106', '🥬', 112);


-- ============================================
-- INSERTAR TIENDAS NETO (4 tiendas en zona)
-- ============================================

INSERT INTO tiendas (id, nombre, ciudad, direccion, lat, lng) VALUES
('neto-tlaxiaco-hidalgo', 'Neto Tlaxiaco', 'Tlaxiaco', 'C. Hidalgo 17, Centro, Tlaxiaco, Oaxaca', 17.267800, -97.679000),
('neto-tlaxiaco-rafael', 'Tiendas Neto Tlaxiaco', 'Tlaxiaco', 'Rafael Reyes Espíndola 8, Centro, Tlaxiaco, Oaxaca', 17.267100, -97.678800),
('neto-tlaxiaco-juarez', 'Tienda Neto Tlaxiaco Juárez 1331', 'Tlaxiaco', 'C. Hipódromo 214B, Centro, Tlaxiaco, Oaxaca', 17.269000, -97.677800),
('neto-chalcatongo-1325', 'Tienda Neto Chalcatongo 1325', 'Chalcatongo de Hidalgo', '20 de Noviembre 100, Chalcatongo de Hidalgo, Oaxaca', 17.029200, -97.569400);


-- ============================================
-- INSERTAR USUARIO DE EJEMPLO
-- ============================================

<<<<<<< HEAD
INSERT INTO usuarios (nombre, email, password, telefono, direccion, rol) VALUES
('Alexandra Gómez', 'usuario@mexamexa.com', '$2y$10$8K1p/a0dL1LXMIgoEDFrOOemGp/MOQJGnRACGvC0MjC.1qHBzLQW', '9511234567', 'Tlaxiaco, Oaxaca', 'usuario'),
('Carlos Ramírez', 'chofer@mexamexa.com', '$2y$10$8K1p/a0dL1LXMIgoEDFrOOemGp/MOQJGnRACGvC0MjC.1qHBzLQW', '9512345678', 'Tlaxiaco, Oaxaca', 'chofer'),
('Admin Mercado Mexa', 'admin@mexamexa.com', '$2y$10$8K1p/a0dL1LXMIgoEDFrOOemGp/MOQJGnRACGvC0MjC.1qHBzLQW', '9513456789', 'Oficinas Mercado Mexa', 'admin');
=======
INSERT INTO usuarios (nombre, apellidos, email, password, telefono, direccion, rol) VALUES
('Alexandra', 'Hernandez', 'alexandra@ejemplo.com', '$2y$10$8K1p/a0dL1LXMIgoEDFrOOemGp/MOQJGnRACGvC0MjC.1qHBzLQW', '9511234567', 'Tlaxiaco, Oaxaca', 'admin');
>>>>>>> 7bc17bd4d2a1cf42c82c027c06a36971f12590eb


-- ============================================
-- CONSULTAS ÚTILES
-- ============================================

-- Ver todos los productos por categoría
-- SELECT p.*, c.nombre AS categoria, c.icono AS cat_icono
-- FROM productos p
-- JOIN categorias c ON p.categoria_id = c.id
-- ORDER BY c.nombre, p.nombre;

-- Buscar productos por nombre
-- SELECT * FROM productos WHERE nombre LIKE '%leche%';

-- Ver productos más reseñados
-- SELECT nombre, resenas FROM productos ORDER BY resenas DESC LIMIT 10;

-- Calcular total del carrito de un usuario
-- SELECT SUM(p.precio * c.cantidad) AS total
-- FROM carrito c
-- JOIN productos p ON c.producto_id = p.id
-- WHERE c.usuario_id = 1;

-- Ver tiendas más cercanas (ordenar por lat/lng)
-- SELECT *, 
--     (6371 * ACOS(
--         COS(RADIANS(17.2671)) * COS(RADIANS(lat)) * 
--         COS(RADIANS(lng) - RADIANS(-97.6788)) + 
--         SIN(RADIANS(17.2671)) * SIN(RADIANS(lat))
--     )) AS distancia_km
-- FROM tiendas
-- ORDER BY distancia_km;
