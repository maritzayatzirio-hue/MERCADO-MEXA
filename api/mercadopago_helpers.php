<?php
/* Helpers privados para Checkout Pro y confirmacion de pagos. */

function mercadoPagoAccessToken() {
    $token = trim((string) getenv('MERCADO_PAGO_ACCESS_TOKEN'));
    if ($token === '') {
        throw new RuntimeException('Falta configurar MERCADO_PAGO_ACCESS_TOKEN en el servidor.');
    }
    return $token;
}

function mercadoPagoBaseUrl() {
    $url = rtrim(trim((string) getenv('MERCADO_MEXA_BASE_URL')), '/');
    if (!filter_var($url, FILTER_VALIDATE_URL) || parse_url($url, PHP_URL_SCHEME) !== 'https') {
        throw new RuntimeException('Configura MERCADO_MEXA_BASE_URL con la URL HTTPS publica de la tienda.');
    }
    return $url;
}

function mercadoPagoRequest(string $metodo, string $url, ?array $cuerpo = null) {
    if (!function_exists('curl_init')) {
        throw new RuntimeException('El servidor necesita la extension cURL de PHP para conectar con Mercado Pago.');
    }

    $curl = curl_init($url);
    $cabeceras = [
        'Authorization: Bearer ' . mercadoPagoAccessToken(),
        'Accept: application/json',
    ];
    $opciones = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $metodo,
        CURLOPT_HTTPHEADER => $cabeceras,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 25,
    ];
    if ($cuerpo !== null) {
        $json = json_encode($cuerpo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            throw new RuntimeException('No se pudieron preparar los datos para Mercado Pago.');
        }
        $opciones[CURLOPT_POSTFIELDS] = $json;
        $opciones[CURLOPT_HTTPHEADER][] = 'Content-Type: application/json';
    }
    curl_setopt_array($curl, $opciones);
    $respuesta = curl_exec($curl);
    $estadoHttp = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $errorCurl = curl_error($curl);
    curl_close($curl);

    if ($respuesta === false) {
        throw new RuntimeException('No se pudo conectar con Mercado Pago: ' . $errorCurl);
    }
    $datos = json_decode($respuesta, true);
    if ($estadoHttp < 200 || $estadoHttp >= 300 || !is_array($datos)) {
        throw new RuntimeException('Mercado Pago no pudo procesar la solicitud (HTTP ' . $estadoHttp . ').');
    }
    return $datos;
}

function mercadoPagoCrearPreferencia(array $pedido, array $items, array $usuario, string $correo) {
    $base = mercadoPagoBaseUrl();
    $lineas = [];
    foreach ($items as $item) {
        $lineas[] = [
            'id' => (string) $item['producto_id'],
            'title' => (string) $item['nombre'],
            'quantity' => (int) $item['cantidad'],
            'unit_price' => (float) $item['precio_unitario'],
            'currency_id' => 'MXN',
        ];
    }

    $nombre = trim((string) ($usuario['nombre'] ?? ''));
    $apellido = trim((string) ($usuario['apellidos'] ?? ''));
    $telefono = preg_replace('/\D+/', '', (string) ($usuario['telefono'] ?? ''));
    $payload = [
        'items' => $lineas,
        'payer' => [
            'name' => $nombre,
            'surname' => $apellido,
            'email' => $correo,
            'phone' => ['number' => $telefono],
        ],
        'external_reference' => (string) $pedido['folio'],
        'notification_url' => $base . '/api/mercadopago_webhook.php',
        'back_urls' => [
            'success' => $base . '/index.html?mp_return=1',
            'failure' => $base . '/index.html?mp_return=1',
            'pending' => $base . '/index.html?mp_return=1',
        ],
        'auto_return' => 'approved',
        'statement_descriptor' => 'MERCADO MEXA',
    ];
    $preferencia = mercadoPagoRequest('POST', 'https://api.mercadopago.com/checkout/preferences', $payload);
    $esTokenPrueba = strpos(mercadoPagoAccessToken(), 'TEST-') === 0;
    $preferencia['checkout_url'] = $esTokenPrueba
        ? ($preferencia['sandbox_init_point'] ?? '')
        : ($preferencia['init_point'] ?? '');
    return $preferencia;
}

function mercadoPagoConsultarPago(string $paymentId) {
    if (!preg_match('/^\d{1,30}$/', $paymentId)) {
        throw new RuntimeException('El identificador de pago de Mercado Pago no es valido.');
    }
    return mercadoPagoRequest('GET', 'https://api.mercadopago.com/v1/payments/' . $paymentId);
}

function mercadoPagoActualizarEstadoPedido(PDO $bd, array $pago) {
    $folio = (string) ($pago['external_reference'] ?? '');
    if ($folio === '' || ($pago['currency_id'] ?? '') !== 'MXN') {
        throw new RuntimeException('La respuesta de pago no coincide con un pedido Mercado Mexa.');
    }

    $consulta = $bd->prepare(
        'SELECT id, folio, usuario_id, total, estado_pago, mp_preferencia_id,
                mp_pago_id, mp_carrito_limpiado
         FROM pedidos WHERE folio = ? AND metodo_pago = "Mercado Pago" LIMIT 1'
    );
    $consulta->execute([$folio]);
    $pedido = $consulta->fetch();
    if (!$pedido || empty($pedido['mp_preferencia_id']) ||
        !hash_equals((string) $pedido['mp_preferencia_id'], (string) ($pago['preference_id'] ?? ''))) {
        throw new RuntimeException('El pago no pertenece a este pedido.');
    }
    if (round((float) ($pago['transaction_amount'] ?? 0), 2) !== round((float) $pedido['total'], 2)) {
        throw new RuntimeException('El monto aprobado no coincide con el total del pedido.');
    }

    $estadoProveedor = (string) ($pago['status'] ?? '');
    $paymentId = (string) ($pago['id'] ?? '');
    $estadoLocal = $estadoProveedor === 'approved'
        ? 'pagado'
        : (in_array($estadoProveedor, ['rejected', 'cancelled', 'refunded', 'charged_back'], true) ? 'fallido' : 'pendiente');
    if ($pedido['estado_pago'] === 'pagado' &&
        $paymentId !== (string) ($pedido['mp_pago_id'] ?? '') &&
        $estadoLocal !== 'pagado') {
        $estadoLocal = 'pagado';
        $paymentId = (string) $pedido['mp_pago_id'];
    }

    $bd->beginTransaction();
    try {
        $pedidoBloqueadoQ = $bd->prepare('SELECT estado_pago, mp_carrito_limpiado FROM pedidos WHERE id = ? FOR UPDATE');
        $pedidoBloqueadoQ->execute([(int) $pedido['id']]);
        $pedidoBloqueado = $pedidoBloqueadoQ->fetch();

        if ($estadoLocal === 'pagado' && !(int) $pedidoBloqueado['mp_carrito_limpiado']) {
            $itemsQ = $bd->prepare(
                'SELECT producto_id, cantidad FROM pedido_items
                 WHERE pedido_id = ? AND producto_id IS NOT NULL'
            );
            $itemsQ->execute([(int) $pedido['id']]);
            $actualizarCarrito = $bd->prepare(
                'UPDATE carrito
                 SET cantidad = IF(cantidad > ?, cantidad - ?, 0)
                 WHERE usuario_id = ? AND producto_id = ?'
            );
            foreach ($itemsQ->fetchAll() as $item) {
                $cantidad = (int) $item['cantidad'];
                $actualizarCarrito->execute([
                    $cantidad,
                    $cantidad,
                    (int) $pedido['usuario_id'],
                    (int) $item['producto_id'],
                ]);
            }
            $quitarVacios = $bd->prepare('DELETE FROM carrito WHERE usuario_id = ? AND cantidad = 0');
            $quitarVacios->execute([(int) $pedido['usuario_id']]);
        }

        $actualizar = $bd->prepare(
            'UPDATE pedidos
             SET estado_pago = ?, mp_pago_id = ?,
                 mp_carrito_limpiado = IF(? = "pagado", 1, mp_carrito_limpiado)
             WHERE id = ?'
        );
        $actualizar->execute([$estadoLocal, $paymentId, $estadoLocal, (int) $pedido['id']]);
        $bd->commit();
    } catch (Throwable $error) {
        if ($bd->inTransaction()) {
            $bd->rollBack();
        }
        throw $error;
    }

    return [
        'id' => (int) $pedido['id'],
        'folio' => (string) $pedido['folio'],
        'estadoPago' => $estadoLocal,
        'estadoProveedor' => $estadoProveedor,
    ];
}

function mercadoPagoValidarFirmaWebhook(string $cuerpo, array $cabeceras) {
    $secreto = trim((string) getenv('MERCADO_PAGO_WEBHOOK_SECRET'));
    if ($secreto === '') {
        throw new RuntimeException('Falta configurar MERCADO_PAGO_WEBHOOK_SECRET en el servidor.');
    }

    $firma = (string) ($cabeceras['x-signature'] ?? '');
    $solicitudId = (string) ($cabeceras['x-request-id'] ?? '');
    $datos = json_decode($cuerpo, true);
    $paymentId = (string) ($datos['data']['id'] ?? '');
    $partes = [];
    foreach (explode(',', $firma) as $parte) {
        $par = explode('=', trim($parte), 2);
        if (count($par) === 2) {
            $partes[$par[0]] = $par[1];
        }
    }
    if (empty($partes['ts']) || empty($partes['v1']) || $solicitudId === '' ||
        !preg_match('/^\d{1,30}$/', $paymentId)) {
        return false;
    }

    $manifiesto = 'id:' . strtolower($paymentId) . ';request-id:' . $solicitudId . ';ts:' . $partes['ts'] . ';';
    $esperada = hash_hmac('sha256', $manifiesto, $secreto);
    return hash_equals($esperada, strtolower($partes['v1']));
}
