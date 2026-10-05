<?php
/* =====================================================
   MERCADO MEXA - API de pedidos
   Confirma pedidos y los guarda en MySQL.

   Uso:
     GET  api/pedidos.php                      -> lista los pedidos del usuario
     POST api/pedidos.php {"accion":"crear", ...datos de entrega...}

   Datos que recibe al crear:
     tienda      -> slug de la tienda (ej. "neto-tlaxiaco-hidalgo")
     modalidad   -> "pickup" o "envio"
     direccion   -> texto de la direccion
     referencias -> texto opcional
     metodoPago  -> texto

   IMPORTANTE: los productos y los precios NO se reciben del
   navegador. Se leen del carrito que esta en la tabla carrito.
   Asi nadie puede pedir 10 unidades de 1 peso.
   ===================================================== */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/bd.php';

session_start();

/* Lanza el error con el codigo HTTP indicado y corta */
function fallar($mensaje, $codigo = 400) {
    http_response_code($codigo);
    echo json_encode(['ok' => false, 'error' => $mensaje], JSON_UNESCAPED_UNICODE);
    exit;
}

function usuarioActual() {
    if (empty($_SESSION['usuario']['id'])) {
        fallar('Inicia sesion para ver tus pedidos', 401);
    }
    return $_SESSION['usuario'];
}

/* Genera un folio del tipo MX-A1B2C3 */
function generarFolio() {
    $alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $parte = '';
    for ($i = 0; $i < 6; $i++) {
        $parte .= $alfabeto[random_int(0, strlen($alfabeto) - 1)];
    }
    return 'MX-' . $parte;
}

/* Genera un codigo de entrega de 6 digitos */
function generarCodigoEntrega() {
    return (string) random_int(100000, 999999);
}

/* Arma la lista de pedidos del usuario, con sus productos */
function listarPedidos(PDO $bd, $usuarioId) {
    $q = $bd->prepare(
        'SELECT p.*, t.nombre AS tienda_nombre, t.ciudad AS tienda_ciudad
         FROM pedidos p
         LEFT JOIN tiendas t ON t.id = p.tienda_id
         WHERE p.usuario_id = ?
         ORDER BY p.pedido_en DESC, p.id DESC'
    );
    $q->execute([$usuarioId]);
    $pedidos = $q->fetchAll();

    /* Trae todos los items de una vez, en vez de una consulta por pedido */
    $itemsQ = $bd->prepare(
        'SELECT pedido_id, producto_nombre, producto_icono, cantidad,
                precio_unitario, subtotal
         FROM pedido_items
         WHERE pedido_id IN (SELECT id FROM pedidos WHERE usuario_id = ?)
         ORDER BY id'
    );
    $itemsQ->execute([$usuarioId]);

    $itemsPorPedido = [];
    foreach ($itemsQ->fetchAll() as $item) {
        $itemsPorPedido[$item['pedido_id']][] = [
            'nombre'  => $item['producto_nombre'],
            'icono'   => $item['producto_icono'],
            'cantidad' => (int) $item['cantidad'],
            'precio'  => (float) $item['precio_unitario'],
            'subtotal' => (float) $item['subtotal'],
        ];
    }

    $salida = [];
    foreach ($pedidos as $p) {
        $salida[] = [
            'id'            => (int) $p['id'],
            'folio'         => $p['folio'],
            'tienda'        => $p['tienda_nombre'],
            'tiendaCiudad'  => $p['tienda_ciudad'],
            'modalidad'     => $p['modalidad'],
            'estado'        => $p['estado'],
            'cliente'       => $p['cliente_nombre'],
            'telefono'      => $p['cliente_telefono'],
            'direccion'     => $p['direccion'],
            'referencias'   => $p['referencias'],
            'metodoPago'    => $p['metodo_pago'],
            'codigoEntrega' => $p['codigo_entrega'],
            'total'         => (float) $p['total'],
            'fecha'         => $p['pedido_en'],
            'entregadoEn'   => $p['entregado_en'],
            'chofer'        => $p['chofer_id'] ? (int) $p['chofer_id'] : null,
            'items'         => $itemsPorPedido[$p['id']] ?? [],
        ];
    }

    return $salida;
}

try {
    $bd = conectarBD();
} catch (Throwable $e) {
    fallar('No se pudo conectar con la base de datos', 500);
}

$usuario = usuarioActual();
$usuarioId = (int) $usuario['id'];

/* ------------------------------------------------------------
   GET: lista de pedidos
------------------------------------------------------------ */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'ok'      => true,
        'accion'  => 'listar',
        'pedidos' => listarPedidos($bd, $usuarioId),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ------------------------------------------------------------
   POST: crear pedido
------------------------------------------------------------ */
$crudo = file_get_contents('php://input');
$crudo = preg_replace('/^\xEF\xBB\xBF/', '', (string) $crudo);
$datos = json_decode($crudo, true);

if (!is_array($datos)) {
    fallar('Datos invalidos');
}

$accion = (string) ($datos['accion'] ?? '');

if ($accion !== 'crear') {
    fallar('Accion desconocida');
}

$slug        = trim((string) ($datos['tienda'] ?? ''));
$modalidad   = (string) ($datos['modalidad'] ?? '');
$direccion   = trim((string) ($datos['direccion'] ?? ''));
$referencias = trim((string) ($datos['referencias'] ?? ''));
$metodoPago  = trim((string) ($datos['metodoPago'] ?? 'Efectivo al recibir'));

if ($slug === '') {
    fallar('Falta la tienda del pedido');
}

if (!in_array($modalidad, ['pickup', 'envio'], true)) {
    fallar('La modalidad debe ser pickup o envio');
}

if ($direccion === '') {
    fallar('Falta la direccion de entrega');
}

if (mb_strlen($metodoPago) > 60) {
    $metodoPago = mb_substr($metodoPago, 0, 60);
}

/* La tienda se busca por su slug */
$tiendaQ = $bd->prepare('SELECT id, nombre, direccion FROM tiendas WHERE slug = ? AND activo = 1 LIMIT 1');
$tiendaQ->execute([$slug]);
$tienda = $tiendaQ->fetch();

if (!$tienda) {
    fallar('Esa tienda no existe', 404);
}

/* --- El carrito se lee de la base de datos, no del navegador --- */
$carritoQ = $bd->prepare(
    'SELECT car.producto_id, car.cantidad, car.precio_unitario,
            pr.nombre, pr.icono
     FROM carrito car
     INNER JOIN productos pr ON pr.id = car.producto_id
     WHERE car.usuario_id = ?
     ORDER BY car.agregado_en'
);
$carritoQ->execute([$usuarioId]);
$items = $carritoQ->fetchAll();

if (!$items) {
    fallar('Tu carrito esta vacio', 400);
}

/* Total y validacion de cantidades */
$total = 0.0;
foreach ($items as $item) {
    $cantidad = (int) $item['cantidad'];
    $precio   = (float) $item['precio_unitario'];

    if ($cantidad < 1 || $cantidad > 99) {
        fallar('Hay una cantidad invalida en el carrito');
    }

    $total += $cantidad * $precio;
}

$total = round($total, 2);

if ($total <= 0) {
    fallar('El total del pedido no es valido');
}

/* --- Transaccion: o se guarda todo, o no se guarda nada --- */
$bd->beginTransaction();

try {
    $folio = generarFolio();
    $codigo = generarCodigoEntrega();

    $nombreCompleto = trim(
        ($usuario['nombre'] ?? '') . ' ' . ($usuario['apellidos'] ?? '')
    );
    $telefono = (string) ($usuario['telefono'] ?? '');

    $pedidoQ = $bd->prepare(
        'INSERT INTO pedidos
            (folio, usuario_id, tienda_id, modalidad, estado,
             cliente_nombre, cliente_telefono, direccion, referencias,
             metodo_pago, codigo_entrega, total)
         VALUES (?, ?, ?, ?, "pendiente", ?, ?, ?, ?, ?, ?, ?)'
    );
    $pedidoQ->execute([
        $folio,
        $usuarioId,
        (int) $tienda['id'],
        $modalidad,
        $nombreCompleto !== '' ? $nombreCompleto : 'Cliente',
        $telefono,
        $direccion,
        $referencias !== '' ? $referencias : null,
        $metodoPago,
        $codigo,
        $total,
    ]);

    $pedidoId = (int) $bd->lastInsertId();

    $itemQ = $bd->prepare(
        'INSERT INTO pedido_items
            (pedido_id, producto_id, producto_nombre, producto_icono,
             cantidad, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    foreach ($items as $item) {
        $cantidad = (int) $item['cantidad'];
        $precio   = (float) $item['precio_unitario'];

        $itemQ->execute([
            $pedidoId,
            (int) $item['producto_id'],
            $item['nombre'],
            $item['icono'],
            $cantidad,
            $precio,
            round($cantidad * $precio, 2),
        ]);
    }

    /* El carrito se vacia porque sus productos ya son un pedido */
    $vaciar = $bd->prepare('DELETE FROM carrito WHERE usuario_id = ?');
    $vaciar->execute([$usuarioId]);

    $bd->commit();

} catch (Throwable $e) {
    $bd->rollBack();
    fallar('No se pudo guardar el pedido. Intenta de nuevo.', 500);
}

echo json_encode([
    'ok'     => true,
    'accion' => 'crear',
    'pedido' => [
        'id'            => $pedidoId,
        'folio'         => $folio,
        'tienda'        => $tienda['nombre'],
        'modalidad'     => $modalidad,
        'estado'        => 'pendiente',
        'total'         => $total,
        'codigoEntrega' => $codigo,
        'items'         => array_map(fn($i) => [
            'nombre'   => $i['nombre'],
            'icono'    => $i['icono'],
            'cantidad' => (int) $i['cantidad'],
            'precio'   => (float) $i['precio_unitario'],
        ], $items),
    ],
], JSON_UNESCAPED_UNICODE);
