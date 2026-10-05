<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/bd.php';
require_once __DIR__ . '/mercadopago_helpers.php';

function responderWebhook(int $codigo, string $mensaje) {
    http_response_code($codigo);
    echo json_encode(['ok' => $codigo >= 200 && $codigo < 300, 'mensaje' => $mensaje], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responderWebhook(405, 'Metodo no permitido');
}

$cuerpo = (string) file_get_contents('php://input');
$cabeceras = function_exists('getallheaders') ? getallheaders() : [];
$cabecerasNormalizadas = [];
foreach ($cabeceras as $nombre => $valor) {
    $cabecerasNormalizadas[strtolower((string) $nombre)] = (string) $valor;
}
$cabecerasNormalizadas['x-signature'] = $cabecerasNormalizadas['x-signature'] ?? (string) ($_SERVER['HTTP_X_SIGNATURE'] ?? '');
$cabecerasNormalizadas['x-request-id'] = $cabecerasNormalizadas['x-request-id'] ?? (string) ($_SERVER['HTTP_X_REQUEST_ID'] ?? '');

try {
    if (!mercadoPagoValidarFirmaWebhook($cuerpo, $cabecerasNormalizadas)) {
        responderWebhook(401, 'Firma de Mercado Pago no valida');
    }
    $datos = json_decode($cuerpo, true);
    $paymentId = (string) ($datos['data']['id'] ?? '');
    $pago = mercadoPagoConsultarPago($paymentId);
    $bd = conectarBD();
    mercadoPagoActualizarEstadoPedido($bd, $pago);
    responderWebhook(200, 'Notificacion procesada');
} catch (Throwable $error) {
    error_log('[Mercado Pago webhook] ' . $error->getMessage());
    responderWebhook(500, 'No se pudo procesar la notificacion');
}
