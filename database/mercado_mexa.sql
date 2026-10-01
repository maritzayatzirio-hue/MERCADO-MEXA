-- ============================================================
--  MERCADO MEXA - Esquema de base de datos MySQL
--  Tienda local de productos - Tlaxiaco, Oaxaca
--  Generado desde el codigo del proyecto
-- ============================================================

-- utf8mb4 para soportar emojis y acentos
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS mercado_mexa
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE mercado_mexa;

-- ============================================================
--  1. USUARIOS  (cliente / chofer / administrador)
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100)  NOT NULL,
    apellidos       VARCHAR(100)  NOT NULL DEFAULT '',
    correo          VARCHAR(150)  NOT NULL UNIQUE,
    telefono        VARCHAR(20)   NOT NULL,
    password_hash   VARCHAR(255)  NOT NULL,
    direccion       TEXT          NULL,
    rol             ENUM('usuario','chofer','admin')  NOT NULL DEFAULT 'usuario',
    estado_chofer   ENUM('disponible','en_ruta')       NOT NULL DEFAULT 'disponible',
    entregas        INT UNSIGNED  NOT NULL DEFAULT 0,
    activo          TINYINT(1)    NOT NULL DEFAULT 1,
    cuenta_demo     TINYINT(1)    NOT NULL DEFAULT 0,
    fecha_registro  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuarios_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  2. TIENDAS  (sucursales con coordenadas para el mapa)
-- ============================================================

CREATE TABLE IF NOT EXISTS tiendas (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    slug        VARCHAR(60)  NOT NULL UNIQUE,
    nombre      VARCHAR(120) NOT NULL,
    ciudad      VARCHAR(80)  NOT NULL,
    direccion   VARCHAR(255) NOT NULL,
    lat         DECIMAL(10,7) NOT NULL,
    lng         DECIMAL(10,7) NOT NULL,
    activo      TINYINT(1)   NOT NULL DEFAULT 1,
    INDEX idx_tiendas_ciudad (ciudad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  3. CATEGORIAS
-- ============================================================

CREATE TABLE IF NOT EXISTS categorias (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    nombre  VARCHAR(80) NOT NULL UNIQUE,
    icono   VARCHAR(16) NOT NULL DEFAULT '',
    activo  TINYINT(1)  NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  4. PRODUCTOS
-- ============================================================

CREATE TABLE IF NOT EXISTS productos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id    INT           NOT NULL,
    nombre          VARCHAR(150)  NOT NULL,
    presentacion    VARCHAR(80)   NOT NULL DEFAULT '',
    descripcion     VARCHAR(255)  NULL,
    precio          DECIMAL(10,2) NOT NULL,
    precio_regular  DECIMAL(10,2) NULL,
    en_oferta       TINYINT(1)    NOT NULL DEFAULT 0,
    etiqueta_oferta VARCHAR(40)   NULL,
    caducidad       DATE          NULL,
    lote            VARCHAR(40)   NULL,
    icono           VARCHAR(16)   NOT NULL DEFAULT '',
    resenas         INT UNSIGNED  NOT NULL DEFAULT 0,
    activo          TINYINT(1)    NOT NULL DEFAULT 1,
    creado_en       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_productos_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    INDEX idx_productos_categoria (categoria_id),
    INDEX idx_productos_nombre (nombre),
    INDEX idx_productos_oferta (en_oferta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  5. PRECIOS POR TIENDA  (comparativa de precios del buscador)
-- ============================================================

CREATE TABLE IF NOT EXISTS precios_tienda (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    producto_id     INT           NOT NULL,
    tienda_id       INT           NOT NULL,
    precio          DECIMAL(10,2) NOT NULL,
    actualizado_en  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_precio_producto_tienda (producto_id, tienda_id),

    CONSTRAINT fk_precios_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_precios_tienda
        FOREIGN KEY (tienda_id) REFERENCES tiendas(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_precios_tienda (tienda_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  6. PEDIDOS
-- ============================================================

CREATE TABLE IF NOT EXISTS pedidos (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    folio             VARCHAR(20)   NOT NULL UNIQUE,
    usuario_id        INT           NOT NULL,
    chofer_id         INT           NULL,
    tienda_id         INT           NULL,
    modalidad         ENUM('pickup','envio')  NOT NULL DEFAULT 'envio',
    estado            ENUM('pendiente','en_ruta','entregado') NOT NULL DEFAULT 'pendiente',
    cliente_nombre    VARCHAR(150)  NOT NULL,
    cliente_telefono  VARCHAR(20)   NOT NULL,
    direccion         VARCHAR(255)  NOT NULL,
    referencias       VARCHAR(255)  NULL,
    metodo_pago       VARCHAR(60)   NOT NULL DEFAULT 'Efectivo al recibir',
    codigo_entrega    CHAR(6)       NOT NULL,
    total             DECIMAL(10,2) NOT NULL,
    pedido_en         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    entregado_en      TIMESTAMP     NULL,

    CONSTRAINT fk_pedidos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_pedidos_chofer
        FOREIGN KEY (chofer_id) REFERENCES usuarios(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT fk_pedidos_tienda
        FOREIGN KEY (tienda_id) REFERENCES tiendas(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_pedidos_usuario (usuario_id),
    INDEX idx_pedidos_chofer (chofer_id),
    INDEX idx_pedidos_estado (estado),
    UNIQUE KEY uq_pedidos_codigo (codigo_entrega)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  7. PEDIDO ITEMS  (detalle de lineas del pedido)
-- ============================================================

CREATE TABLE IF NOT EXISTS pedido_items (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id         INT           NOT NULL,
    producto_id       INT           NULL,
    producto_nombre   VARCHAR(150)  NOT NULL,
    producto_icono    VARCHAR(16)   NOT NULL DEFAULT '',
    cantidad          SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    precio_unitario   DECIMAL(10,2) NOT NULL,
    subtotal          DECIMAL(10,2) NOT NULL,

    CONSTRAINT fk_items_pedido
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    -- si el producto se borra del catalogo, la linea historica se conserva
    CONSTRAINT fk_items_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_items_pedido (pedido_id),
    INDEX idx_items_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  8. CARRITO
--  Articulos pendientes de compra del usuario
-- ============================================================

CREATE TABLE IF NOT EXISTS carrito (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id      INT           NOT NULL,
    producto_id     INT           NOT NULL,
    cantidad        SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    comprado        TINYINT(1)    NOT NULL DEFAULT 0,
    agregado_en     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- un producto solo aparece una vez en el carrito
    UNIQUE KEY uq_carrito_usuario_producto (usuario_id, producto_id),

    CONSTRAINT fk_carrito_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_carrito_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_carrito_producto (producto_id),
    INDEX idx_carrito_no_comprado (comprado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  9. FAVORITOS
--  Productos marcados con corazon por el usuario
-- ============================================================

CREATE TABLE IF NOT EXISTS favoritos (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id   INT      NOT NULL,
    producto_id  INT      NOT NULL,
    creado_en    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- no se puede marcar dos veces el mismo producto
    UNIQUE KEY uq_favorito_usuario_producto (usuario_id, producto_id),

    CONSTRAINT fk_favoritos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_favoritos_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_favoritos_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  10. ENTREGAS
--  Historial de entregas por chofer
-- ============================================================

CREATE TABLE IF NOT EXISTS entregas (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id          INT           NOT NULL,
    chofer_id          INT           NOT NULL,
    codigo_entrega     CHAR(6)       NOT NULL,
    entregado_en       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tiempo_entrega_min INT UNSIGNED  NULL,

    -- un pedido solo genera una entrega
    UNIQUE KEY uq_entrega_pedido (pedido_id),

    CONSTRAINT fk_entregas_pedido
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_entregas_chofer
        FOREIGN KEY (chofer_id) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_entregas_chofer (chofer_id, entregado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ############################################################
--  ##  DATOS DE EJEMPLO                                    ##
-- ############################################################


-- ---------- CATEGORIAS (5) ----------
INSERT INTO categorias (id, nombre, icono) VALUES
    (1, 'ABARROTES', '🥫'),
    (2, 'LÁCTEOS', '🥛'),
    (3, 'BEBIDAS', '🥤'),
    (4, 'PAN Y TORTILLAS', '🍞'),
    (5, 'LIMPIEZA', '🧴');


-- ---------- TIENDAS (4) ----------
INSERT INTO tiendas (id, slug, nombre, ciudad, direccion, lat, lng) VALUES
    (1, 'neto-tlaxiaco-hidalgo', 'Neto Tlaxiaco', 'Tlaxiaco', 'C. Hidalgo 17, Centro, Tlaxiaco, Oaxaca', 17.2678, -97.679),
    (2, 'neto-tlaxiaco-rafael', 'Tiendas Neto Tlaxiaco', 'Tlaxiaco', 'Rafael Reyes Espíndola 8, Centro, Tlaxiaco, Oaxaca', 17.2671, -97.6788),
    (3, 'neto-tlaxiaco-juarez', 'Tienda Neto Tlaxiaco Juárez 1331', 'Tlaxiaco', 'C. Hipódromo 214B, Centro, Tlaxiaco, Oaxaca', 17.269, -97.6778),
    (4, 'neto-chalcatongo-1325', 'Tienda Neto Chalcatongo 1325', 'Chalcatongo de Hidalgo', '20 de Noviembre 100, Chalcatongo de Hidalgo, Oaxaca', 17.0292, -97.5694);


-- ---------- USUARIOS ----------
-- password_hash = password_hash() de PHP (bcrypt), NO es SHA-256.
-- Se valida con password_verify($clave, $usuario['password_hash']).
--
-- Para crear usuarios nuevos, NUNCA escribas el hash a mano.
-- Genera el hash en PHP y luego inserta:
--     password_hash('MiClave123', PASSWORD_DEFAULT)
--
-- Cuentas de demostracion:
--     usuario@mexamexa.com    -> Usuario123
--     chofer@mexamexa.com     -> Chofer123
--     admin@mexamexa.com      -> Admin123
--     juanpablo@mexamexa.com  -> Cliente123
--     mariaelena@mexamexa.com -> Cliente123
INSERT INTO usuarios (id, nombre, apellidos, correo, telefono, password_hash, rol, estado_chofer, entregas, cuenta_demo) VALUES
    (1, 'Alexandra', 'Gómez', 'usuario@mexamexa.com', '9511234567', '$2y$10$6eSevbBjHVggblfhKgaUAeg8IEnDuR.hvNI3cAf6.4nlU4fPm82D2', 'usuario', 'disponible', 0, 1),
    (2, 'Carlos', 'Ramírez', 'chofer@mexamexa.com', '9512345678', '$2y$10$ZiTm6tJbK1tSMpkbG2FIyu6BohfzG2oJGRtCzqYSjY4fsFrQSH88O', 'chofer', 'disponible', 14, 1),
    (3, 'Administrador', 'Mercado Mexa', 'admin@mexamexa.com', '9513456789', '$2y$10$GvsOR.q6EIKolZK2XQwwvOPmfknD2leebU9Fyl7SVnpSVPm59pmf6', 'admin', 'disponible', 0, 1),
    (4, 'Juan Pablo', 'Reyes', 'juanpablo@mexamexa.com', '9519876543', '$2y$10$xrribgb1Ma8qI9sonEwoV.T97qe4jwVjpUd8CSAtVV2VsswtKFPPO', 'usuario', 'disponible', 0, 0),
    (5, 'María Elena', 'Castro', 'mariaelena@mexamexa.com', '9514455667', '$2y$10$PANKfMWB2iIs6Zkh7Yv1h.IC.tkCUDOfg0OpYL6K.396BI3u2KnYa', 'usuario', 'disponible', 0, 0);


-- ---------- PRODUCTOS (65) ----------
-- 3 productos por categoria quedan en oferta (descuento 15-35%),
-- igual que la logica de obtenerProductosEnOferta() en js/script.js
INSERT INTO productos
    (id, categoria_id, nombre, presentacion, descripcion, precio, precio_regular,
     en_oferta, etiqueta_oferta, caducidad, lote, icono, resenas)
VALUES
    (1, 1, 'Frijol Negro 900g', 'Bolsa 900 g', 'Bolsa 900 g', 32.00, 41.00, 1, '-22%', '2026-12-12', 'L-8841', '🫘', 245),
    (2, 1, 'Arroz Morelos 1kg', 'Bolsa 1 kg', 'Bolsa 1 kg', 35.00, 49.00, 1, '-29%', '2027-03-08', 'L-9021', '🍚', 198),
    (3, 1, 'Aceite Vegetal 1L', 'Botella 1 L', 'Botella 1 L', 48.00, 56.00, 1, '-15%', '2027-01-15', 'L-1120', '🫗', 176),
    (4, 1, 'Azúcar Estándar 1kg', 'Bolsa 1 kg', 'Bolsa 1 kg', 29.00, NULL, 0, NULL, '2027-08-20', 'A-2231', '🍬', 143),
    (5, 1, 'Sal de Mesa 1kg', 'Bolsa 1 kg', 'Bolsa 1 kg', 18.00, NULL, 0, NULL, '2028-05-14', 'S-3412', '🧂', 112),
    (6, 1, 'Atún en Agua 140g', 'Lata 140 g', 'Lata 140 g', 22.00, NULL, 0, NULL, '2028-11-10', 'AT-5541', '🐟', 221),
    (7, 1, 'Sopa Instantánea Pollo 85g', 'Vaso 85 g', 'Vaso 85 g', 12.00, NULL, 0, NULL, '2027-09-18', 'SP-1182', '🍜', 245),
    (8, 1, 'Pasta Spaghetti 200g', 'Paquete 200 g', 'Paquete 200 g', 17.00, NULL, 0, NULL, '2028-06-22', 'PS-2201', '🍝', 189),
    (9, 1, 'Avena 400g', 'Bolsa 400 g', 'Bolsa 400 g', 28.00, NULL, 0, NULL, '2028-02-14', 'AV-402', '🌾', 134),
    (10, 1, 'Mayonesa 390g', 'Frasco 390 g', 'Frasco 390 g', 39.00, NULL, 0, NULL, '2027-07-05', 'MY-390', '🥚', 167),
    (11, 1, 'Salsa Cátsup 397g', 'Botella 397 g', 'Botella 397 g', 31.00, NULL, 0, NULL, '2027-08-12', 'SC-397', '🍅', 154),
    (12, 1, 'Puré de Tomate 210g', 'Lata 210 g', 'Lata 210 g', 14.00, NULL, 0, NULL, '2028-10-18', 'PT-210', '🍅', 98),
    (13, 1, 'Café Soluble 100g', 'Frasco 100 g', 'Frasco 100 g', 58.00, NULL, 0, NULL, '2028-04-22', 'CF-100', '☕', 203),
    (14, 2, 'Leche Entera Neto 1L', 'Envase 1 L', 'Envase 1 L', 26.00, 37.00, 1, '-29%', '2026-11-20', 'L-5512', '🥛', 201),
    (15, 2, 'Leche Deslactosada 1L', 'Envase 1 L', 'Envase 1 L', 29.00, 34.00, 1, '-15%', '2026-11-25', 'LD-4310', '🥛', 187),
    (16, 2, 'Leche Light 1L', 'Envase 1 L', 'Envase 1 L', 28.00, 36.00, 1, '-22%', '2026-11-22', 'LL-2201', '🥛', 143),
    (17, 2, 'Queso Oaxaca 400g', 'Paquete 400 g', 'Paquete 400 g', 68.00, NULL, 0, NULL, '2026-12-05', 'L-5518', '🧀', 178),
    (18, 2, 'Queso Panela 400g', 'Paquete 400 g', 'Paquete 400 g', 62.00, NULL, 0, NULL, '2026-12-08', 'QP-4418', '🧀', 165),
    (19, 2, 'Yogurt Natural 1kg', 'Envase 1 kg', 'Envase 1 kg', 38.00, NULL, 0, NULL, '2026-11-28', 'L-5520', '🥛', 143),
    (20, 2, 'Yogurt Fresa 1kg', 'Envase 1 kg', 'Envase 1 kg', 42.00, NULL, 0, NULL, '2026-11-27', 'YF-3312', '🍓', 190),
    (21, 2, 'Crema Ácida 450ml', 'Envase 450 ml', 'Envase 450 ml', 35.00, NULL, 0, NULL, '2026-11-30', 'CR-7721', '🥛', 122),
    (22, 2, 'Mantequilla 90g', 'Barra 90 g', 'Barra 90 g', 31.00, NULL, 0, NULL, '2027-01-18', 'MA-8820', '🧈', 156),
    (23, 2, 'Margarina 225g', 'Barra 225 g', 'Barra 225 g', 25.00, NULL, 0, NULL, '2027-03-16', 'MG-225', '🧈', 109),
    (24, 2, 'Huevo Blanco 18 Piezas', 'Cartón 18 piezas', 'Cartón 18 piezas', 52.00, NULL, 0, NULL, '2026-12-15', 'HB-018', '🥚', 198),
    (25, 2, 'Bebida Láctea Chocolate 1L', 'Envase 1 L', 'Envase 1 L', 34.00, NULL, 0, NULL, '2026-11-29', 'BC-100', '🥛', 132),
    (26, 2, 'Requesón 300g', 'Envase 300 g', 'Envase 300 g', 44.00, NULL, 0, NULL, '2026-12-06', 'RQ-300', '🧀', 87),
    (27, 3, 'Refresco Cola 3L', 'Botella 3 L', 'Botella 3 L', 35.00, 41.00, 1, '-15%', '2027-06-10', 'B-101', '🥤', 276),
    (28, 3, 'Agua Purificada 1.5L', 'Botella 1.5 L', 'Botella 1.5 L', 14.00, 18.00, 1, '-22%', '2028-06-10', 'B-102', '💧', 198),
    (29, 3, 'Jumex Mango 450ml', 'Botella 450 ml', 'Botella 450 ml', 18.00, 25.00, 1, '-29%', '2027-04-15', 'JM-451', '🥭', 189),
    (30, 3, 'Agua Natural 1L', 'Botella 1 L', 'Botella 1 L', 11.00, NULL, 0, NULL, '2028-07-21', 'AN-321', '💧', 145),
    (31, 3, 'Refresco Manzana 600ml', 'Botella 600 ml', 'Botella 600 ml', 19.00, NULL, 0, NULL, '2027-08-02', 'RM-602', '🍎', 176),
    (32, 3, 'Bebida de Naranja 1L', 'Envase 1 L', 'Envase 1 L', 24.00, NULL, 0, NULL, '2027-05-19', 'NA-100', '🍊', 134),
    (33, 3, 'Agua Mineral 600ml', 'Botella 600 ml', 'Botella 600 ml', 16.00, NULL, 0, NULL, '2027-10-12', 'AM-612', '💧', 121),
    (34, 3, 'Jugo de Naranja 1L', 'Envase 1 L', 'Envase 1 L', 32.00, NULL, 0, NULL, '2027-02-05', 'JO-778', '🍊', 203),
    (35, 3, 'Néctar de Mango 1L', 'Envase 1 L', 'Envase 1 L', 27.00, NULL, 0, NULL, '2027-04-18', 'NM-100', '🥭', 166),
    (36, 3, 'Té de Limón 1.5L', 'Botella 1.5 L', 'Botella 1.5 L', 25.00, NULL, 0, NULL, '2027-05-20', 'TL-150', '🍋', 115),
    (37, 3, 'Bebida de Jamaica 1L', 'Envase 1 L', 'Envase 1 L', 24.00, NULL, 0, NULL, '2027-05-16', 'BJ-100', '🌺', 104),
    (38, 3, 'Bebida de Horchata 1L', 'Envase 1 L', 'Envase 1 L', 26.00, NULL, 0, NULL, '2027-05-17', 'BH-100', '🥛', 98),
    (39, 3, 'Café Frío 450ml', 'Botella 450 ml', 'Botella 450 ml', 29.00, NULL, 0, NULL, '2027-04-09', 'CF-450', '☕', 142),
    (40, 4, 'Pan Blanco Grande', 'Pan de caja 680 g', 'Pan de caja 680 g', 42.00, 54.00, 1, '-22%', '2026-11-18', 'P-201', '🍞', 167),
    (41, 4, 'Pan Integral 680g', 'Pan de caja integral', 'Pan de caja integral', 48.00, 68.00, 1, '-29%', '2026-11-20', 'PI-301', '🍞', 156),
    (42, 4, 'Pan Dulce Surtido', 'Caja surtida', 'Caja surtida', 38.00, 45.00, 1, '-15%', '2026-11-17', 'PD-442', '🥐', 188),
    (43, 4, 'Bolillo 6 Piezas', 'Paquete 6 piezas', 'Paquete 6 piezas', 28.00, NULL, 0, NULL, '2026-11-15', 'BO-602', '🥖', 142),
    (44, 4, 'Tostadas de Maíz 300g', 'Paquete 300 g', 'Paquete 300 g', 31.00, NULL, 0, NULL, '2027-04-12', 'TM-331', '🌮', 134),
    (45, 4, 'Tortillas de Maíz 1kg', 'Paquete 1 kg', 'Paquete 1 kg', 24.00, NULL, 0, NULL, '2026-11-16', 'P-202', '🌮', 134),
    (46, 4, 'Tortillas de Harina 500g', 'Paquete 500 g', 'Paquete 500 g', 27.00, NULL, 0, NULL, '2026-11-19', 'TH-501', '🌯', 119),
    (47, 4, 'Pan para Hamburguesa 8pz', 'Paquete 8 piezas', 'Paquete 8 piezas', 45.00, NULL, 0, NULL, '2026-11-23', 'PH-808', '🍔', 233),
    (48, 4, 'Pan Tostado 250g', 'Paquete 250 g', 'Paquete 250 g', 35.00, NULL, 0, NULL, '2026-11-25', 'PT-250', '🍞', 101),
    (49, 4, 'Conchas 6 Piezas', 'Paquete 6 piezas', 'Paquete 6 piezas', 39.00, NULL, 0, NULL, '2026-11-18', 'CO-606', '🥐', 178),
    (50, 4, 'Galletas Marías 170g', 'Paquete 170 g', 'Paquete 170 g', 18.00, NULL, 0, NULL, '2027-06-10', 'GM-170', '🍪', 214),
    (51, 4, 'Galletas Saladas 186g', 'Paquete 186 g', 'Paquete 186 g', 20.00, NULL, 0, NULL, '2027-07-14', 'GS-186', '🍪', 132),
    (52, 4, 'Roles de Canela 6pz', 'Paquete 6 piezas', 'Paquete 6 piezas', 42.00, NULL, 0, NULL, '2026-11-21', 'RC-606', '🍩', 147),
    (53, 5, 'Detergente 1kg', 'Bolsa 1 kg', 'Bolsa 1 kg', 52.00, 73.00, 1, '-29%', '2028-01-01', 'C-301', '🧺', 122),
    (54, 5, 'Detergente Líquido 1L', 'Botella 1 L', 'Botella 1 L', 58.00, 68.00, 1, '-15%', '2028-02-10', 'DL-100', '🧴', 156),
    (55, 5, 'Suavizante 1L', 'Botella 1 L', 'Botella 1 L', 45.00, 58.00, 1, '-22%', '2028-03-12', 'C-302', '🧴', 143),
    (56, 5, 'Cloro 1L', 'Botella 1 L', 'Botella 1 L', 24.00, NULL, 0, NULL, '2027-09-08', 'C-401', '🧴', 134),
    (57, 5, 'Limpiador Multiusos 1L', 'Botella 1 L', 'Botella 1 L', 34.00, NULL, 0, NULL, '2028-02-20', 'C-402', '🧽', 167),
    (58, 5, 'Jabón para Trastes 750ml', 'Botella 750 ml', 'Botella 750 ml', 32.00, NULL, 0, NULL, '2028-05-15', 'C-503', '🫧', 201),
    (59, 5, 'Esponjas para Cocina 4pz', 'Paquete 4 piezas', 'Paquete 4 piezas', 18.00, NULL, 0, NULL, '2030-01-01', 'C-601', '🧽', 109),
    (60, 5, 'Limpiavidrios 500ml', 'Botella 500 ml', 'Botella 500 ml', 29.00, NULL, 0, NULL, '2028-08-10', 'C-701', '🪟', 118),
    (61, 5, 'Desinfectante 1L', 'Botella 1 L', 'Botella 1 L', 39.00, NULL, 0, NULL, '2028-06-18', 'C-801', '🧴', 154),
    (62, 5, 'Bolsas para Basura 30pz', 'Paquete 30 piezas', 'Paquete 30 piezas', 35.00, NULL, 0, NULL, '2030-01-01', 'BB-030', '🗑️', 88),
    (63, 5, 'Papel Higiénico 4pz', 'Paquete 4 piezas', 'Paquete 4 piezas', 32.00, NULL, 0, NULL, '2030-01-01', 'PH-004', '🧻', 189),
    (64, 5, 'Servitoallas 120 Hojas', 'Paquete 120 hojas', 'Paquete 120 hojas', 29.00, NULL, 0, NULL, '2030-01-01', 'ST-120', '🧻', 94),
    (65, 5, 'Jabón de Barra 3pz', 'Paquete 3 piezas', 'Paquete 3 piezas', 27.00, NULL, 0, NULL, '2030-01-01', 'JB-003', '🧼', 145);


-- ---------- PRECIOS POR TIENDA (260) ----------
-- Mismo algoritmo de factor que generarComparativaTiendas()
INSERT INTO precios_tienda (producto_id, tienda_id, precio) VALUES
    (1, 1, 30.10),
    (1, 2, 33.30),
    (1, 3, 33.90),
    (1, 4, 39.70),
    (2, 1, 32.90),
    (2, 2, 35.70),
    (2, 3, 37.10),
    (2, 4, 42.70),
    (3, 1, 47.00),
    (3, 2, 47.00),
    (3, 3, 49.90),
    (3, 4, 54.70),
    (4, 1, 27.30),
    (4, 2, 28.40),
    (4, 3, 30.70),
    (4, 4, 33.10),
    (5, 1, 18.00),
    (5, 2, 18.40),
    (5, 3, 19.40),
    (5, 4, 21.20),
    (6, 1, 21.10),
    (6, 2, 22.40),
    (6, 3, 24.20),
    (6, 4, 25.10),
    (7, 1, 12.00),
    (7, 2, 12.00),
    (7, 3, 13.00),
    (7, 4, 14.40),
    (8, 1, 15.60),
    (8, 2, 17.00),
    (8, 3, 17.30),
    (8, 4, 20.40),
    (9, 1, 28.00),
    (9, 2, 28.60),
    (9, 3, 30.20),
    (9, 4, 31.90),
    (10, 1, 35.90),
    (10, 2, 38.20),
    (10, 3, 39.80),
    (10, 4, 46.00),
    (11, 1, 29.80),
    (11, 2, 31.60),
    (11, 3, 34.10),
    (11, 4, 36.60),
    (12, 1, 14.00),
    (12, 2, 14.60),
    (12, 3, 15.10),
    (12, 4, 16.20),
    (13, 1, 55.70),
    (13, 2, 60.30),
    (13, 3, 63.80),
    (13, 4, 71.90),
    (14, 1, 23.90),
    (14, 2, 26.00),
    (14, 3, 26.50),
    (14, 4, 30.20),
    (15, 1, 29.00),
    (15, 2, 29.60),
    (15, 3, 31.30),
    (15, 4, 34.20),
    (16, 1, 28.00),
    (16, 2, 28.60),
    (16, 3, 30.20),
    (16, 4, 33.00),
    (17, 1, 68.00),
    (17, 2, 70.70),
    (17, 3, 73.40),
    (17, 4, 84.30),
    (18, 1, 60.80),
    (18, 2, 64.50),
    (18, 3, 64.50),
    (18, 4, 71.90),
    (19, 1, 35.00),
    (19, 2, 37.20),
    (19, 3, 38.80),
    (19, 4, 46.40),
    (20, 1, 38.60),
    (20, 2, 42.80),
    (20, 3, 42.80),
    (20, 4, 47.90),
    (21, 1, 32.90),
    (21, 2, 34.30),
    (21, 3, 37.10),
    (21, 4, 41.30),
    (22, 1, 31.00),
    (22, 2, 32.20),
    (22, 3, 33.50),
    (22, 4, 37.20),
    (23, 1, 24.00),
    (23, 2, 25.50),
    (23, 3, 27.50),
    (23, 4, 30.50),
    (24, 1, 48.90),
    (24, 2, 52.00),
    (24, 3, 55.10),
    (24, 4, 60.30),
    (25, 1, 32.00),
    (25, 2, 33.30),
    (25, 3, 36.00),
    (25, 4, 40.10),
    (26, 1, 44.00),
    (26, 2, 43.10),
    (26, 3, 47.50),
    (26, 4, 51.90),
    (27, 1, 35.00),
    (27, 2, 35.00),
    (27, 3, 37.80),
    (27, 4, 43.40),
    (28, 1, 13.20),
    (28, 2, 14.30),
    (28, 3, 14.80),
    (28, 4, 16.00),
    (29, 1, 17.60),
    (29, 2, 18.70),
    (29, 3, 18.70),
    (29, 4, 22.30),
    (30, 1, 10.80),
    (30, 2, 11.20),
    (30, 3, 11.40),
    (30, 4, 13.40),
    (31, 1, 17.90),
    (31, 2, 19.40),
    (31, 3, 20.10),
    (31, 4, 22.40),
    (32, 1, 23.50),
    (32, 2, 23.50),
    (32, 3, 25.00),
    (32, 4, 29.30),
    (33, 1, 14.70),
    (33, 2, 16.60),
    (33, 3, 16.30),
    (33, 4, 19.80),
    (34, 1, 30.10),
    (34, 2, 32.60),
    (34, 3, 33.90),
    (34, 4, 39.00),
    (35, 1, 25.90),
    (35, 2, 28.10),
    (35, 3, 29.70),
    (35, 4, 33.50),
    (36, 1, 23.50),
    (36, 2, 26.00),
    (36, 3, 26.50),
    (36, 4, 29.00),
    (37, 1, 23.00),
    (37, 2, 24.00),
    (37, 3, 26.40),
    (37, 4, 27.80),
    (38, 1, 26.00),
    (38, 2, 26.00),
    (38, 3, 28.10),
    (38, 4, 30.20),
    (39, 1, 26.70),
    (39, 2, 30.20),
    (39, 3, 29.60),
    (39, 4, 36.00),
    (40, 1, 38.60),
    (40, 2, 42.00),
    (40, 3, 42.80),
    (40, 4, 48.70),
    (41, 1, 48.00),
    (41, 2, 49.00),
    (41, 3, 51.80),
    (41, 4, 54.70),
    (42, 1, 35.00),
    (42, 2, 38.80),
    (42, 3, 38.80),
    (42, 4, 43.30),
    (43, 1, 25.80),
    (43, 2, 28.00),
    (43, 3, 28.60),
    (43, 4, 33.60),
    (44, 1, 28.50),
    (44, 2, 31.00),
    (44, 3, 31.60),
    (44, 4, 38.40),
    (45, 1, 23.00),
    (45, 2, 24.00),
    (45, 3, 26.40),
    (45, 4, 29.80),
    (46, 1, 25.90),
    (46, 2, 27.50),
    (46, 3, 29.70),
    (46, 4, 32.90),
    (47, 1, 44.10),
    (47, 2, 46.80),
    (47, 3, 46.80),
    (47, 4, 55.80),
    (48, 1, 35.00),
    (48, 2, 35.00),
    (48, 3, 37.80),
    (48, 4, 43.40),
    (49, 1, 36.70),
    (49, 2, 40.60),
    (49, 3, 41.30),
    (49, 4, 48.40),
    (50, 1, 18.00),
    (50, 2, 18.70),
    (50, 3, 19.40),
    (50, 4, 21.60),
    (51, 1, 18.80),
    (51, 2, 19.60),
    (51, 3, 21.20),
    (51, 4, 22.80),
    (52, 1, 40.30),
    (52, 2, 42.80),
    (52, 3, 46.20),
    (52, 4, 51.20),
    (53, 1, 49.90),
    (53, 2, 53.00),
    (53, 3, 57.20),
    (53, 4, 63.40),
    (54, 1, 58.00),
    (54, 2, 58.00),
    (54, 3, 62.60),
    (54, 4, 69.60),
    (55, 1, 44.10),
    (55, 2, 45.00),
    (55, 3, 46.80),
    (55, 4, 52.20),
    (56, 1, 23.50),
    (56, 2, 23.50),
    (56, 3, 25.00),
    (56, 4, 29.30),
    (57, 1, 34.00),
    (57, 2, 34.00),
    (57, 3, 36.70),
    (57, 4, 39.40),
    (58, 1, 31.40),
    (58, 2, 33.30),
    (58, 3, 33.30),
    (58, 4, 38.40),
    (59, 1, 16.90),
    (59, 2, 18.40),
    (59, 3, 19.10),
    (59, 4, 20.50),
    (60, 1, 26.70),
    (60, 2, 29.60),
    (60, 3, 29.60),
    (60, 4, 33.10),
    (61, 1, 38.20),
    (61, 2, 39.80),
    (61, 3, 40.60),
    (61, 4, 46.00),
    (62, 1, 33.60),
    (62, 2, 35.00),
    (62, 3, 38.50),
    (62, 4, 42.00),
    (63, 1, 30.10),
    (63, 2, 32.00),
    (63, 3, 33.90),
    (63, 4, 39.70),
    (64, 1, 26.70),
    (64, 2, 30.20),
    (64, 3, 29.60),
    (64, 4, 33.60),
    (65, 1, 25.90),
    (65, 2, 26.50),
    (65, 3, 29.70),
    (65, 4, 30.80);


-- ---------- PEDIDOS DE DEMOSTRACION (3) ----------
INSERT INTO pedidos
    (id, folio, usuario_id, chofer_id, tienda_id, modalidad, estado, cliente_nombre,
     cliente_telefono, direccion, referencias, metodo_pago, codigo_entrega, total,
     pedido_en, entregado_en)
VALUES
    (1, 'MX-8912', 1, 2, 1, 'envio', 'en_ruta',  'Alexandra Gómez',
        '9511234567', 'C. Hidalgo 17, Centro, Tlaxiaco', 'Portón verde, segundo piso',
        'Efectivo al recibir', '481302', 129.00, '2026-09-30 10:30:00', NULL),
    (2, 'MX-8915', 4, 2, 1, 'envio', 'pendiente', 'Juan Pablo Reyes',
        '9519876543', 'Av. Independencia 45, Barrio San Diego', 'Frente a la escuela primaria',
        'Efectivo al recibir', '694715', 185.00, '2026-09-30 11:15:00', NULL),
    (3, 'MX-8890', 5, 2, 3, 'pickup', 'entregado', 'María Elena Castro',
        '9514455667', 'C. Morelos 8, Barrio San Bartolo', NULL,
        'Tarjeta de Débito al recibir', '237846', 115.00, '2026-09-30 09:10:00', '2026-09-30 09:52:00');


-- ---------- ITEMS DE LOS PEDIDOS ----------
INSERT INTO pedido_items
    (pedido_id, producto_id, producto_nombre, producto_icono, cantidad, precio_unitario, subtotal)
VALUES
    (1, 14, 'Leche Entera Neto 1L', '🥛', 2, 26.00, 52.00),
    (1, 40, 'Pan Blanco Grande', '🍞', 1, 42.00, 42.00),
    (1, 27, 'Refresco Cola 3L', '🥤', 1, 35.00, 35.00),
    (2, 24, 'Huevo Blanco 18 Piezas', '🥚', 1, 52.00, 52.00),
    (2, 53, 'Detergente 1kg', '🧺', 2, 52.00, 104.00),
    (2, 4, 'Azúcar Estándar 1kg', '🍬', 1, 29.00, 29.00),
    (3, 1, 'Frijol Negro 900g', '🫘', 1, 32.00, 32.00),
    (3, 2, 'Arroz Morelos 1kg', '🍚', 1, 35.00, 35.00),
    (3, 3, 'Aceite Vegetal 1L', '🫗', 1, 48.00, 48.00);


-- ---------- ENTREGAS REGISTRADAS ----------
-- solo los pedidos que ya estan en estado 'entregado'
INSERT INTO entregas (pedido_id, chofer_id, codigo_entrega, entregado_en, tiempo_entrega_min)
VALUES
    (3, 2, '237846', '2026-09-30 09:52:00', 42);


-- ---------- FAVORITOS DE DEMOSTRACION ----------
INSERT INTO favoritos (usuario_id, producto_id) VALUES
    (1, 14), (1, 24), (1, 1), (1, 40);


-- ---------- CARRITO DE DEMOSTRACION ----------
INSERT INTO carrito (usuario_id, producto_id, cantidad, precio_unitario, comprado) VALUES
    (1, 14, 2, 26.00, 0),
    (1, 40, 1, 42.00, 0),
    (1, 27, 1, 35.00, 0);


-- ============================================================
--  FIN  -  10 tablas | 65 productos | 4 tiendas | 5 categorias
--  usuarios: 5 | pedidos: 3 | items: 9 | precios: 260
--  carrito: 3 | favoritos: 4 | entregas: 1
-- ============================================================
