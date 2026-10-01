<?php
/* =====================================================
   MERCADO MEXA - API del carrito
   Guarda el carrito en MySQL en vez de en el navegador.

   Uso:
     GET  api/carrito.php                    -> lista el carrito
     POST api/carrito.php  {"accion":"agregar",  "nombre":"...","cantidad":1}
     POST api/carrito.php  {"accion":"cantidad", "nombre":"...","cantidad":2}
     POST api/carrito.php  {"accion":"eliminar", "nombre":"..."}
     POST api/carrito.php  {"accion":"vaciar"}

   Importante: el precio SIEMPRE se lee de la tabla productos.
   El navegador nunca manda el precio, para que nadie pueda
   inventarse un descuento.
   ===================================================== */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/bd.php';

session_start();

/* Devuelve un error en JSON y termina */
function responderError($mensaje, $codigo = 400) {
    http_response_code($codigo);
    echo json_encode(['ok' => false, 'error' => $mensaje], JSON_UNESCAPED_UNICODE);
    exit;
}

/* Sin sesion no se puede tocar el carrito */
function usuarioIdActual() {
    if (empty($_SESSION['usuario']['id'])) {
        responderError('Inicia sesion para usar el carrito', 401);
    }
    return (int) $_SESSION['usuario']['id'];
}

/* ------------------------------------------------------------
   Arma la lista del carrito con los datos de MySQL.
   Se usa al responder cualquier accion.
------------------------------------------------------------ */
function construirCarrito(PDO $bd, $usuarioId) {
    $sql = "SELECT
                pr.id,
                pr.nombre,
                pr.presentacion,
                pr.icono,
                pr.caducidad,
                pr.precio            AS precio_actual,
                c.nombre             AS categoria,
                c.icono              AS categoria_icono,
                car.producto_id,
                car.cantidad,
                car.precio_unitario,
                car.comprado,
                car.agregado_en
            FROM carrito car
            INNER JOIN productos pr ON pr.id = car.producto_id
            INNER JOIN categorias c ON c.id = pr.categoria_id
            WHERE car.usuario_id = ?
            ORDER BY car.agregado_en";

    $filas = $bd->prepare($sql);
    $filas->execute([$usuarioId]);
    $crudo = $filas->fetchAll();

    $carrito = [];
    $totalUnidades = 0;
    $totalDinero = 0.0;

    foreach ($crudo as $f) {
        $cantidad  = (int) $f['cantidad'];
        $precio    = (float) $f['precio_unitario'];
        $subtotal  = $cantidad * $precio;

        $totalUnidades += $cantidad;
        $totalDinero   += $subtotal;

        $carrito[] = [
            'id'             => (int) $f['id'],
            'producto_id'    => (int) $f['producto_id'],
            'nombre'         => $f['nombre'],
            'presentacion'   => $f['presentacion'],
            'icono'          => $f['icono'],
            'caducidad'      => $f['caducidad'],
            'categoriaLista' => $f['categoria'],
            'precio'         => $precio,
            /* Si el precio del producto subio, se avisa con precioRegular */
            'precioRegular'  => (float) $f['precio_actual'] !== $precio
                                ? (float) $f['precio_actual']
                                : round($precio * 1.2, 2),
            'cantidad'       => $cantidad,
            'subtotal'       => round($subtotal, 2),
            'comprado'       => (bool) $f['comprado'],
            'agregadoEn'     => $f['agregado_en'],
        ];
    }

    return [
        'items'    => $carrito,
        'unidades' => $totalUnidades,
        'total'    => round($totalDinero, 2),
    ];
}

/* Busca el producto por nombre. Los nombres son unicos
   en la tabla, asi que esto no puede devolver dos filas. */
function buscarProducto(PDO $bd, $nombre) {
    $q = $bd->prepare('SELECT id, nombre, precio FROM productos WHERE nombre = ? AND activo = 1 LIMIT 1');
    $q->execute([$nombre]);
    $p = $q->fetch();

    if (!$p) {
        responderError('Ese producto no existe', 404);
    }

    return $p;
}

try {
    $bd = conectarBD();
} catch (Throwable $error) {
    responderError('No se pudo conectar con la base de datos', 500);
}

$usuarioId = usuarioIdActual();

/* ------------------------------------------------------------
   GET: solo devolver el carrito
------------------------------------------------------------ */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(
        ['ok' => true, 'accion' => 'listar', 'carrito' => construirCarrito($bd, $usuarioId)],
        JSON_UNESCAPED_UNICODE
    );
    exit;
}

/* ------------------------------------------------------------
   POST: leer la peticion
------------------------------------------------------------ */
$crudo = file_get_contents('php://input');
$crudo = preg_replace('/^\xEF\xBB\xBF/', '', (string) $crudo);
$datos = json_decode($crudo, true);

if (!is_array($datos)) {
    responderError('Datos invalidos');
}

$accion = (string) ($datos['accion'] ?? '');

/* ------------------------------------------------------------
   AGREGAR (o sumar cantidad si ya estaba en el carrito)
------------------------------------------------------------ */
if ($accion === 'agregar') {
    $nombre    = trim((string) ($datos['nombre'] ?? ''));
    $cantidad  = (int) ($datos['cantidad'] ?? 1);

    if ($nombre === '') {
        responderError('Falta el nombre del producto');
    }

    if ($cantidad < 1) {
        responderError('La cantidad debe ser al menos 1');
    }

    if ($cantidad > 99) {
        responderError('La cantidad maxima por producto es 99');
    }

    $producto = buscarProducto($bd, $nombre);

    /* El precio sale de la base de datos, nunca del navegador */
    $precio = (float) $producto['precio'];

    /* Si ya esta en el carrito, se suma la cantidad */
    $sql = "INSERT INTO carrito (usuario_id, producto_id, cantidad, precio_unitario)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                cantidad = LEAST(cantidad + VALUES(cantidad), 99),
                precio_unitario = VALUES(precio_unitario)";

    $agregar = $bd->prepare($sql);
    $agregar->execute([$usuarioId, (int) $producto['id'], $cantidad, $precio]);

    echo json_encode(
        ['ok' => true, 'accion' => 'agregar', 'carrito' => construirCarrito($bd, $usuarioId)],
        JSON_UNESCAPED_UNICODE
    );
    exit;
}

/* ------------------------------------------------------------
   CANTIDAD: cambiar o quitar si llega a 0
------------------------------------------------------------ */
if ($accion === 'cantidad') {
    $nombre   = trim((string) ($datos['nombre'] ?? ''));
    $cantidad = (int) ($datos['cantidad'] ?? 0);

    if ($nombre === '') {
        responderError('Falta el nombre del producto');
    }

    if ($cantidad < 0 || $cantidad > 99) {
        responderError('La cantidad debe estar entre 0 y 99');
    }

    $producto = buscarProducto($bd, $nombre);

    if ($cantidad === 0) {
        $borrar = $bd->prepare('DELETE FROM carrito WHERE usuario_id = ? AND producto_id = ?');
        $borrar->execute([$usuarioId, (int) $producto['id']]);
    } else {
        /* El precio se actualiza al de la tabla productos */
        $actualizar = $bd->prepare(
            'UPDATE carrito SET cantidad = ?, precio_unitario = ?
             WHERE usuario_id = ? AND producto_id = ?'
        );
        $actualizar->execute([
            $cantidad,
            (float) $producto['precio'],
            $usuarioId,
            (int) $producto['id'],
        ]);
    }

    echo json_encode(
        ['ok' => true, 'accion' => 'cantidad', 'carrito' => construirCarrito($bd, $usuarioId)],
        JSON_UNESCAPED_UNICODE
    );
    exit;
}

/* ------------------------------------------------------------
   ELIMINAR un producto del carrito
------------------------------------------------------------ */
if ($accion === 'eliminar') {
    $nombre = trim((string) ($datos['nombre'] ?? ''));

    if ($nombre === '') {
        responderError('Falta el nombre del producto');
    }

    $producto = buscarProducto($bd, $nombre);

    $borrar = $bd->prepare('DELETE FROM carrito WHERE usuario_id = ? AND producto_id = ?');
    $borrar->execute([$usuarioId, (int) $producto['id']]);

    echo json_encode(
        ['ok' => true, 'accion' => 'eliminar', 'carrito' => construirCarrito($bd, $usuarioId)],
        JSON_UNESCAPED_UNICODE
    );
    exit;
}

/* ------------------------------------------------------------
   VACIAR todo el carrito
------------------------------------------------------------ */
if ($accion === 'vaciar') {
    $vaciar = $bd->prepare('DELETE FROM carrito WHERE usuario_id = ?');
    $vaciar->execute([$usuarioId]);

    echo json_encode(
        ['ok' => true, 'accion' => 'vaciar', 'carrito' => construirCarrito($bd, $usuarioId)],
        JSON_UNESCAPED_UNICODE
    );
    exit;
}

responderError('Accion desconocida');
