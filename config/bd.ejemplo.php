<?php
/* =====================================================
   MERCADO MEXA - Conexion a la base de datos
   ESTA ES LA COPIA DE EJEMPLO: no tiene tu contrasena.
   Copiala como bd.php y ajusta los datos:
       cp bd.ejemplo.php bd.php

   La conexion va dentro de una funcion a proposito:
   si las variables quedaran sueltas, se mezclarian con
   las de los archivos que incluyen este.
   ===================================================== */

/* Devuelve una conexion PDO a la base de datos */
function conectarBD() {
    // Datos de conexion (XAMPP por defecto: root sin contrasena)
    $config = [
        'host'    => 'localhost',
        'db'      => 'mercado_mexa',
        'user'    => 'root',
        'pass'    => 'AQUI_PON_TU_CONTRASENA',   // en XAMPP el usuario root va vacio
        'charset' => 'utf8mb4',
    ];

    $dsn = "mysql:host={$config['host']};dbname={$config['db']};charset={$config['charset']}";

    try {
        return new PDO($dsn, $config['user'], $config['pass'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $error) {
        // No se muestran detalles internos al usuario
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => 'No se pudo conectar con la base de datos']);
        exit;
    }
}

/* Devuelve el catalogo completo agrupado por categoria.
   Se usa en api/productos.php */
function obtenerCatalogo(PDO $bd) {
    $sql = "SELECT
                p.id,
                p.nombre,
                p.presentacion,
                p.descripcion,
                p.precio,
                p.precio_regular,
                p.en_oferta,
                p.etiqueta_oferta,
                p.caducidad,
                p.lote,
                p.icono,
                p.resenas,
                c.nombre AS categoria,
                c.icono   AS categoria_icono
            FROM productos p
            INNER JOIN categorias c ON c.id = p.categoria_id
            WHERE p.activo = 1 AND c.activo = 1
            ORDER BY c.nombre, p.nombre";

    $productos = $bd->query($sql)->fetchAll();

    // Agrupar por categoria, igual que getCategoriasBase() del JS
    $catalogo = [];
    foreach ($productos as $producto) {
        $categoria = $producto['categoria'];

        if (!isset($catalogo[$categoria])) {
            $catalogo[$categoria] = [
                'nombre'    => $categoria,
                'icono'     => $producto['categoria_icono'],
                'productos' => [],
            ];
        }

        $catalogo[$categoria]['productos'][] = $producto;
    }

    return array_values($catalogo);
}

/* Devuelve las tiendas activas de la base de datos.
   El "id" que se devuelve es el slug, porque es la clave por la que
   api/pedidos.php resuelve la tienda al confirmar un pedido. */
function obtenerTiendas(PDO $bd) {
    $sql = "SELECT slug, nombre, ciudad, direccion, lat, lng
            FROM tiendas
            WHERE activo = 1
            ORDER BY nombre";

    $tiendas = [];

    foreach ($bd->query($sql)->fetchAll() as $fila) {
        $tiendas[] = [
            'id'        => $fila['slug'],
            'nombre'    => $fila['nombre'],
            'ciudad'    => $fila['ciudad'],
            'direccion' => $fila['direccion'],
            'lat'       => (float) $fila['lat'],
            'lng'       => (float) $fila['lng'],
        ];
    }

    return $tiendas;
}

/* Devuelve los datos publicos de un usuario (sin password_hash) */
function usuarioPublico(array $fila) {
    return [
        'id'            => (int) $fila['id'],
        'nombre'        => $fila['nombre'],
        'apellidos'     => $fila['apellidos'],
        'correo'        => $fila['correo'],
        'telefono'      => $fila['telefono'],
        'direccion'     => $fila['direccion'],
        'rol'           => $fila['rol'],
        'estadoChofer'  => $fila['estado_chofer'],
        'entregas'      => (int) $fila['entregas'],
    ];
}
