<?php
/* =====================================================
   MERCADO MEXA - API del catalogo de productos
   Devuelve todo el catalogo agrupado por categoria, en JSON.
   Uso:  GET http://localhost/mercado-mexa/api/productos.php
   ===================================================== */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../config/bd.php';

try {
    $bd = conectarBD();
    $catalogo = obtenerCatalogo($bd);

    $total = 0;
    foreach ($catalogo as $categoria) {
        $total += count($categoria['productos']);
    }

    echo json_encode([
        'ok'         => true,
        'total'      => $total,
        'categorias' => $catalogo,
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode([
        'ok'    => false,
        'error' => 'Error al obtener el catalogo',
    ], JSON_UNESCAPED_UNICODE);
}
