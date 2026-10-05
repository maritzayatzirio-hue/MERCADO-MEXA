<?php
/* =====================================================
   MERCADO MEXA - API de pedidos
   Confirma pedidos y los guarda en MySQL.

   Uso:
     GET  api/pedidos.php                      -> lista los pedidos
                                                  (los suyos; el chofer ve los
                                                   que tiene asignados y el admin
                                                   ve todos)
     POST api/pedidos.php {"accion":"crear", ...datos de entrega...}
     POST api/pedidos.php {"accion":"crear_pago_mp", ...datos de entrega y contacto...}
     POST api/pedidos.php {"accion":"confirmar_pago_mp", "folio":"MX-XXXXXX",
                           "paymentId":"123456"}
     POST api/pedidos.php {"accion":"entregar", "folio":"MX-XXXXXX",
                           "codigo":"123456"}

   Datos que recibe al crear:
     tienda      -> slug de la tienda (ej. "neto-tlaxiaco-hidalgo")
     modalidad   -> "pickup" o "envio"
     direccion   -> texto de la direccion
     referencias -> texto opcional
     metodoPago  -> texto (solo para el flujo sin Checkout Pro)

   Datos que recibe al entregar (solo chofer o admin):
     folio       -> folio del pedido, tal como aparece en la app
     codigo      -> codigo de 6 digitos que se le dio al cliente

   IMPORTANTE: los productos y los precios NO se reciben del
   navegador. Se leen del carrito que esta en la tabla carrito.
   Asi nadie puede pedir 10 unidades de 1 peso.
   ===================================================== */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/bd.php';
require_once __DIR__ . '/mercadopago_helpers.php';

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

/* Arma la lista de pedidos, con sus productos.
   Cada rol ve algo distinto:
     - usuario: solo los suyos
     - chofer:  los que tiene asignados
     - admin:   todos
   El filtro se arma una vez y se usa en las dos consultas. */
function filtroPedidos(string $rol, int $usuarioId, array &$params) {
    if ($rol === 'chofer') {
        $params = [$usuarioId];
        return 'p.chofer_id = ?';
    }

    if ($rol === 'admin') {
        $params = [];
        return '1 = 1';
    }

    $params = [$usuarioId];
    return 'p.usuario_id = ?';
}

/* Arma la lista de pedidos del usuario, con sus productos */
function listarPedidos(PDO $bd, int $usuarioId, string $rol) {
    $params = [];
    $filtro = filtroPedidos($rol, $usuarioId, $params);

    $q = $bd->prepare(
        'SELECT p.*, t.nombre AS tienda_nombre, t.ciudad AS tienda_ciudad,
                u.nombre AS chofer_nombre
         FROM pedidos p
         LEFT JOIN tiendas t ON t.id = p.tienda_id
         LEFT JOIN usuarios u ON u.id = p.chofer_id
         WHERE ' . $filtro . '
         ORDER BY p.pedido_en DESC, p.id DESC'
    );
    $q->execute($params);
    $pedidos = $q->fetchAll();

    /* Trae todos los items de una vez, en vez de una consulta por pedido */
    $itemsQ = $bd->prepare(
        'SELECT i.pedido_id, i.producto_nombre, i.producto_icono, i.cantidad,
                i.precio_unitario, i.subtotal
         FROM pedido_items i
         INNER JOIN pedidos p ON p.id = i.pedido_id
         WHERE ' . $filtro . '
         ORDER BY i.id'
    );
    $itemsQ->execute($params);

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
            'codigoEntrega' => $p['metodo_pago'] !== 'Mercado Pago' || $p['estado_pago'] === 'pagado'
                ? $p['codigo_entrega']
                : null,
            'estadoPago'    => $p['estado_pago'],
            'total'         => (float) $p['total'],
            'fecha'         => $p['pedido_en'],
            'entregadoEn'   => $p['entregado_en'],
            'chofer'        => $p['chofer_id'] ? (int) $p['chofer_id'] : null,
            'choferNombre'  => $p['chofer_nombre'],
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

/* usuarioActual() corta con 401 si no hay sesion */
usuarioActual();

/* El rol se vuelve a leer de la base, por si un admin se lo cambio
   a esta sesion mientras estaba abierta. Si la cuenta se desactivo,
   refrescarSesion() cierra la sesion y el llamado de abajo da 401. */
refrescarSesion($bd);

$usuario = usuarioActual();
$usuarioId = (int) $usuario['id'];
$rol = (string) ($usuario['rol'] ?? 'usuario');

/* ------------------------------------------------------------
   GET: lista de pedidos
   ------------------------------------------------------------ */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'ok'      => true,
        'accion'  => 'listar',
        'pedidos' => listarPedidos($bd, $usuarioId, $rol),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ------------------------------------------------------------
   POST: crear o entregar un pedido
   ------------------------------------------------------------ */
$crudo = file_get_contents('php://input');
$crudo = preg_replace('/^\xEF\xBB\xBF/', '', (string) $crudo);
$datos = json_decode($crudo, true);

if (!is_array($datos)) {
    fallar('Datos invalidos');
}

$accion = (string) ($datos['accion'] ?? '');

if ($accion === 'crear') {
    crearPedido($bd, $usuario, $datos);
    exit;
}

if ($accion === 'crear_pago_mp') {
    crearPedido($bd, $usuario, $datos, true);
    exit;
}

if ($accion === 'confirmar_pago_mp') {
    confirmarPagoMercadoPago($bd, $usuario, $datos);
    exit;
}

if ($accion === 'entregar') {
    entregarPedido($bd, $usuario, $datos);
    exit;
}

fallar('Accion desconocida');

/* ------------------------------------------------------------
   Marca un pedido como entregado y deja el registro en entregas.
   El cliente tiene que decir el codigo que salio en su pedido:
   asi se demuestra que la entrega si ocurrio.
   ------------------------------------------------------------ */
function entregarPedido(PDO $bd, array $usuario, array $datos) {
    if (($usuario['rol'] ?? '') !== 'chofer' && ($usuario['rol'] ?? '') !== 'admin') {
        fallar('Solo un chofer puede marcar un pedido como entregado', 403);
    }

    $usuarioId = (int) $usuario['id'];
    $folio  = trim((string) ($datos['folio'] ?? ''));
    $codigo = trim((string) ($datos['codigo'] ?? ''));

    if ($folio === '') {
        fallar('Falta el folio del pedido');
    }

    $buscar = $bd->prepare('SELECT * FROM pedidos WHERE folio = ? LIMIT 1');
    $buscar->execute([$folio]);
    $pedido = $buscar->fetch();

    if (!$pedido) {
        fallar('Ese pedido no existe', 404);
    }

    /* Un chofer solo puede entregar lo que tiene asignado */
    if ($usuario['rol'] === 'chofer' && (int) $pedido['chofer_id'] !== $usuarioId) {
        fallar('Ese pedido no esta asignado a ti', 403);
    }

    if ($pedido['estado'] === 'entregado') {
        fallar('Ese pedido ya fue entregado', 409);
    }

    if ($pedido['metodo_pago'] === 'Mercado Pago' && $pedido['estado_pago'] !== 'pagado') {
        fallar('No se puede entregar un pedido hasta que Mercado Pago confirme el pago', 409);
    }

    if ($codigo === '' || !hash_equals((string) $pedido['codigo_entrega'], $codigo)) {
        fallar('El codigo de entrega no coincide', 403);
    }

    $pedidoId = (int) $pedido['id'];

    /* --- Transaccion: o queda todo registrado, o nada --- */
    $bd->beginTransaction();

    try {
        /* De cuanto tardo el chofer, en minutos */
        $minutos = (int) $bd->query(
            'SELECT TIMESTAMPDIFF(MINUTE, pedido_en, NOW()) FROM pedidos WHERE id = ' . $pedidoId
        )->fetchColumn();
        $minutos = max($minutos, 0);

        $actualizar = $bd->prepare(
            'UPDATE pedidos
             SET estado = "entregado", chofer_id = ?, entregado_en = NOW()
             WHERE id = ?'
        );
        $actualizar->execute([$usuarioId, $pedidoId]);

        /* entregado_en se deja que lo ponga MySQL (DEFAULT CURRENT_TIMESTAMP) */
        $registrar = $bd->prepare(
            'INSERT INTO entregas (pedido_id, chofer_id, codigo_entrega, tiempo_entrega_min)
             VALUES (?, ?, ?, ?)'
        );
        $registrar->execute([$pedidoId, $usuarioId, $pedido['codigo_entrega'], $minutos]);

        /* Suma una entrega al chofer */
        $sumar = $bd->prepare('UPDATE usuarios SET entregas = entregas + 1 WHERE id = ?');
        $sumar->execute([$usuarioId]);

        $bd->commit();

    } catch (Throwable $e) {
        $bd->rollBack();
        fallar('No se pudo registrar la entrega. Intenta de nuevo.', 500);
    }

    echo json_encode([
        'ok'     => true,
        'accion' => 'entregar',
        'pedido' => [
            'id'         => $pedidoId,
            'folio'      => $pedido['folio'],
            'estado'     => 'entregado',
            'entregadoEn' => gmdate('Y-m-d H:i:s'),
            'tiempoMin'  => $minutos,
        ],
    ], JSON_UNESCAPED_UNICODE);
}

function confirmarPagoMercadoPago(PDO $bd, array $usuario, array $datos) {
    $folio = trim((string) ($datos['folio'] ?? ''));
    $paymentId = trim((string) ($datos['paymentId'] ?? ''));
    if ($folio === '' || $paymentId === '') {
        fallar('Falta la referencia del pedido o del pago.');
    }

    $buscar = $bd->prepare(
        'SELECT id FROM pedidos
         WHERE folio = ? AND usuario_id = ? AND metodo_pago = "Mercado Pago" LIMIT 1'
    );
    $buscar->execute([$folio, (int) $usuario['id']]);
    if (!$buscar->fetch()) {
        fallar('No se encontro ese pedido de Mercado Pago.', 404);
    }

    try {
        $pago = mercadoPagoConsultarPago($paymentId);
        $estado = mercadoPagoActualizarEstadoPedido($bd, $pago);
    } catch (Throwable $error) {
        fallar('No se pudo verificar el pago con Mercado Pago. ' . $error->getMessage(), 502);
    }

    if ($estado['estadoPago'] !== 'pagado') {
        fallar('Mercado Pago todavía no confirma este pago.', 409);
    }

    $pedidoQ = $bd->prepare(
        'SELECT p.folio, p.modalidad, p.cliente_nombre, p.cliente_telefono,
                p.direccion, p.codigo_entrega, p.total, p.pedido_en,
                t.nombre AS tienda_nombre
         FROM pedidos p
         LEFT JOIN tiendas t ON t.id = p.tienda_id
         WHERE p.id = ? LIMIT 1'
    );
    $pedidoQ->execute([$estado['id']]);
    $pedido = $pedidoQ->fetch();
    $itemsQ = $bd->prepare(
        'SELECT producto_nombre AS nombre, cantidad, precio_unitario AS precio, subtotal
         FROM pedido_items WHERE pedido_id = ? ORDER BY id'
    );
    $itemsQ->execute([$estado['id']]);

    echo json_encode([
        'ok' => true,
        'accion' => 'confirmar_pago_mp',
        'pedido' => [
            'id' => $estado['id'],
            'folio' => $pedido['folio'],
            'estadoPago' => $estado['estadoPago'],
            'tienda' => $pedido['tienda_nombre'],
            'modalidad' => $pedido['modalidad'],
            'cliente' => $pedido['cliente_nombre'],
            'telefono' => $pedido['cliente_telefono'],
            'direccion' => $pedido['direccion'],
            'codigoEntrega' => $pedido['codigo_entrega'],
            'total' => (float) $pedido['total'],
            'fecha' => $pedido['pedido_en'],
            'items' => array_map(static function ($item) {
                return [
                    'nombre' => $item['nombre'],
                    'cantidad' => (int) $item['cantidad'],
                    'precio' => (float) $item['precio'],
                    'subtotal' => (float) $item['subtotal'],
                ];
            }, $itemsQ->fetchAll()),
        ],
    ], JSON_UNESCAPED_UNICODE);
}


/* ------------------------------------------------------------
   Crea el pedido con lo que hay en el carrito del usuario
   ------------------------------------------------------------ */
function crearPedido(PDO $bd, array $usuario, array $datos, bool $pagoMercadoPago = false) {
    $usuarioId = (int) $usuario['id'];

    $slug        = trim((string) ($datos['tienda'] ?? ''));
    $modalidad   = (string) ($datos['modalidad'] ?? '');
    $direccion   = trim((string) ($datos['direccion'] ?? ''));
    $referencias = trim((string) ($datos['referencias'] ?? ''));
    $metodoPago  = $pagoMercadoPago ? 'Mercado Pago' : trim((string) ($datos['metodoPago'] ?? 'Efectivo al recibir'));
    $clientePago = trim((string) ($datos['cliente'] ?? ''));
    $correoPago  = trim((string) ($datos['correo'] ?? ''));
    $telefonoPago = trim((string) ($datos['telefono'] ?? ''));

    if ($slug === '') {
        fallar('Falta la tienda del pedido');
    }

    if (!in_array($modalidad, ['pickup', 'envio'], true)) {
        fallar('La modalidad debe ser pickup o envio');
    }

    if ($direccion === '') {
        fallar('Falta la direccion de entrega');
    }

    /* Las formas de pago que ofrece el formulario de checkout, tal
       como js/script.js las arma. El navegador podria mandar cualquier
       texto, asi que se revisa contra esta lista antes de guardar.
       Al validar aqui, el recorte de 60 caracteres ya sobra. */
    $metodosPago = [
        'Efectivo al recibir',
        'Transferencia bancaria',
        'Tarjeta al recibir',
        'Tarjeta de Débito al recibir',
        'Tarjeta de Crédito al recibir',
    ];

    if (!in_array($metodoPago, $metodosPago, true)) {
        if (!$pagoMercadoPago || $metodoPago !== 'Mercado Pago') {
            fallar('Esa forma de pago no existe');
        }
    }

    if ($pagoMercadoPago && (
        $clientePago === '' ||
        strlen($clientePago) > 150 ||
        strlen($correoPago) > 150 ||
        !filter_var($correoPago, FILTER_VALIDATE_EMAIL) ||
        !preg_match('/^[0-9+()\s.-]{7,20}$/', $telefonoPago)
    )) {
        fallar('Revisa el nombre, correo y telefono para el pago.');
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

        $nombreCompleto = $pagoMercadoPago
            ? $clientePago
            : trim(($usuario['nombre'] ?? '') . ' ' . ($usuario['apellidos'] ?? ''));
        $telefono = $pagoMercadoPago ? $telefonoPago : (string) ($usuario['telefono'] ?? '');

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

        $preferencia = null;
        if ($pagoMercadoPago) {
            $usuarioPago = $usuario;
            $nombres = preg_split('/\s+/', $clientePago, 2);
            $usuarioPago['nombre'] = $nombres[0] ?? '';
            $usuarioPago['apellidos'] = $nombres[1] ?? '';
            $usuarioPago['telefono'] = $telefonoPago;
            $preferencia = mercadoPagoCrearPreferencia(
                ['folio' => $folio],
                $items,
                $usuarioPago,
                $correoPago
            );
            if (empty($preferencia['id']) || empty($preferencia['checkout_url'])) {
                throw new RuntimeException('Mercado Pago no devolvio un enlace de pago valido.');
            }
            $guardarPreferencia = $bd->prepare(
                'UPDATE pedidos
                 SET estado_pago = "pendiente", mp_preferencia_id = ?
                 WHERE id = ?'
            );
            $guardarPreferencia->execute([(string) $preferencia['id'], $pedidoId]);
        }

        if (!$pagoMercadoPago) {
            /* El pedido normal queda confirmado: se vacia el carrito. */
            $vaciar = $bd->prepare('DELETE FROM carrito WHERE usuario_id = ?');
            $vaciar->execute([$usuarioId]);
        }

        $bd->commit();

    } catch (Throwable $e) {
        $bd->rollBack();
        fallar(
            $pagoMercadoPago
                ? 'No se pudo iniciar el pago. ' . $e->getMessage()
                : 'No se pudo guardar el pedido. Intenta de nuevo.',
            500
        );
    }

    if ($pagoMercadoPago) {
        echo json_encode([
            'ok' => true,
            'accion' => 'crear_pago_mp',
            'pedido' => [
                'folio' => $folio,
                'total' => $total,
                'checkoutUrl' => $preferencia['checkout_url'],
            ],
        ], JSON_UNESCAPED_UNICODE);
        return;
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
}
