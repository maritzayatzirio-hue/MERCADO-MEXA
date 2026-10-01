<?php
/* =====================================================
   MERCADO MEXA - API de favoritos
   Guarda la lista de favoritos en MySQL.

   Uso:
     GET  api/favoritos.php                        -> lista los favoritos
     POST api/favoritos.php {"accion":"agregar","nombre":"..."}
     POST api/favoritos.php {"accion":"quitar","nombre":"..."}
     POST api/favoritos.php {"accion":"alternar","nombre":"..."}
   ===================================================== */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/bd.php';

session_start();

function fallar($mensaje, $codigo = 400) {
    http_response_code($codigo);
    echo json_encode(['ok' => false, 'error' => $mensaje], JSON_UNESCAPED_UNICODE);
    exit;
}

function usuarioIdActual() {
    if (empty($_SESSION['usuario']['id'])) {
        fallar('Inicia sesion para usar favoritos', 401);
    }
    return (int) $_SESSION['usuario']['id'];
}

/* Arma la lista de favoritos con los datos del producto */
function listarFavoritos(PDO $bd, $usuarioId) {
    $q = $bd->prepare(
        'SELECT pr.id, pr.nombre, pr.presentacion, pr.icono, pr.precio,
                pr.precio_regular, pr.en_oferta, pr.etiqueta_oferta,
                pr.caducidad, c.nombre AS categoria, f.creado_en
         FROM favoritos f
         INNER JOIN productos pr ON pr.id = f.producto_id
         INNER JOIN categorias c ON c.id = pr.categoria_id
         WHERE f.usuario_id = ?
         ORDER BY f.creado_en DESC, f.id DESC'
    );
    $q->execute([$usuarioId]);
    $filas = $q->fetchAll();

    $favoritos = [];
    foreach ($filas as $f) {
        $favoritos[] = [
            'id'           => (int) $f['id'],
            'nombre'       => $f['nombre'],
            'presentacion' => $f['presentacion'],
            'icono'        => $f['icono'],
            'precio'       => (float) $f['precio'],
            'precioRegular' => (float) $f['precio_regular'],
            'enOferta'     => (bool) $f['en_oferta'],
            'etiquetaOferta' => $f['etiqueta_oferta'],
            'caducidad'    => $f['caducidad'],
            'categoria'    => $f['categoria'],
            'creadoEn'     => $f['creado_en'],
        ];
    }

    return $favoritos;
}

function buscarProducto(PDO $bd, $nombre) {
    $q = $bd->prepare('SELECT id, nombre FROM productos WHERE nombre = ? AND activo = 1 LIMIT 1');
    $q->execute([$nombre]);
    $p = $q->fetch();

    if (!$p) {
        fallar('Ese producto no existe', 404);
    }

    return $p;
}

/* Responde con la lista nueva y si el producto quedo dentro o fuera */
function responder($accion, PDO $bd, $usuarioId, $nombreProducto, $dentro) {
    echo json_encode([
        'ok'        => true,
        'accion'    => $accion,
        'nombre'    => $nombreProducto,
        'dentro'    => $dentro,
        'favoritos' => listarFavoritos($bd, $usuarioId),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $bd = conectarBD();
} catch (Throwable $e) {
    fallar('No se pudo conectar con la base de datos', 500);
}

$usuarioId = usuarioIdActual();

/* ------------------------------------------------------------
   GET: lista de favoritos
------------------------------------------------------------ */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'ok'        => true,
        'accion'    => 'listar',
        'favoritos' => listarFavoritos($bd, $usuarioId),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ------------------------------------------------------------
   POST
------------------------------------------------------------ */
$crudo = file_get_contents('php://input');
$crudo = preg_replace('/^\xEF\xBB\xBF/', '', (string) $crudo);
$datos = json_decode($crudo, true);

if (!is_array($datos)) {
    fallar('Datos invalidos');
}

$accion = (string) ($datos['accion'] ?? '');
$nombre = trim((string) ($datos['nombre'] ?? ''));

if ($nombre === '') {
    fallar('Falta el nombre del producto');
}

$producto = buscarProducto($bd, $nombre);
$productoId = (int) $producto['id'];

/* AGREGAR: si ya estaba, no hace falta insertar otra vez */
if ($accion === 'agregar') {
    $agregar = $bd->prepare(
        'INSERT IGNORE INTO favoritos (usuario_id, producto_id) VALUES (?, ?)'
    );
    $agregar->execute([$usuarioId, $productoId]);
    responder('agregar', $bd, $usuarioId, $nombre, true);
}

/* QUITAR */
if ($accion === 'quitar') {
    $quitar = $bd->prepare('DELETE FROM favoritos WHERE usuario_id = ? AND producto_id = ?');
    $quitar->execute([$usuarioId, $productoId]);
    responder('quitar', $bd, $usuarioId, $nombre, false);
}

/* ALTERNAR: util para el boton de corazon */
if ($accion === 'alternar') {
    $existe = $bd->prepare('SELECT id FROM favoritos WHERE usuario_id = ? AND producto_id = ? LIMIT 1');
    $existe->execute([$usuarioId, $productoId]);

    if ($existe->fetch()) {
        $borrar = $bd->prepare('DELETE FROM favoritos WHERE usuario_id = ? AND producto_id = ?');
        $borrar->execute([$usuarioId, $productoId]);
        responder('alternar', $bd, $usuarioId, $nombre, false);
    }

    $agregar = $bd->prepare('INSERT INTO favoritos (usuario_id, producto_id) VALUES (?, ?)');
    $agregar->execute([$usuarioId, $productoId]);
    responder('alternar', $bd, $usuarioId, $nombre, true);
}

fallar('Accion desconocida');
