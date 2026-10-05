<?php
/* =====================================================
   MERCADO MEXA - API de usuarios
   Solo el administrador entra aqui: lista las cuentas
   registradas y puede cambiar su rol.

   Uso:
     GET  api/usuarios.php                              -> lista las cuentas
     POST api/usuarios.php {"accion":"rol", "usuarioId":7, "rol":"chofer"}

   Estas acciones son SOLO para el panel del administrador,
   asi que todo se valida contra el rol de la sesion.
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

function adminActual() {
    if (empty($_SESSION['usuario']['id'])) {
        fallar('Inicia sesion para ver los usuarios', 401);
    }

    if (($_SESSION['usuario']['rol'] ?? '') !== 'admin') {
        fallar('Solo el administrador puede entrar aqui', 403);
    }

    return $_SESSION['usuario'];
}

try {
    $bd = conectarBD();
} catch (Throwable $e) {
    fallar('No se pudo conectar con la base de datos', 500);
}

/* El rol se vuelve a leer de la base, por si un admin
   se lo cambio a esta sesion mientras estaba abierta */
refrescarSesion($bd);

$admin = adminActual();

/* ------------------------------------------------------------
   GET: lista de cuentas
   Nunca se manda password_hash al navegador.
   ------------------------------------------------------------ */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $q = $bd->query(
        'SELECT id, nombre, apellidos, correo, telefono, direccion, rol,
                estado_chofer, entregas, activo, cuenta_demo, fecha_registro
         FROM usuarios
         ORDER BY FIELD(rol, "admin", "chofer", "usuario"), nombre'
    );

    $usuarios = [];
    foreach ($q->fetchAll() as $u) {
        $usuarios[] = [
            'id'            => (int) $u['id'],
            'nombre'        => $u['nombre'],
            'apellidos'     => $u['apellidos'],
            'correo'        => $u['correo'],
            'telefono'      => $u['telefono'],
            'direccion'     => $u['direccion'],
            'rol'           => $u['rol'],
            'estadoChofer'  => $u['estado_chofer'],
            'entregas'      => (int) $u['entregas'],
            'activo'        => (bool) $u['activo'],
            'cuentaDemo'    => (bool) $u['cuenta_demo'],
            'fechaRegistro' => $u['fecha_registro'],
        ];
    }

    echo json_encode([
        'ok'       => true,
        'accion'   => 'listar',
        'usuarios' => $usuarios,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ------------------------------------------------------------
   POST: cambiar rol
   ------------------------------------------------------------ */
$crudo = file_get_contents('php://input');
$crudo = preg_replace('/^\xEF\xBB\xBF/', '', (string) $crudo);
$datos = json_decode($crudo, true);

if (!is_array($datos)) {
    fallar('Datos invalidos');
}

if (($datos['accion'] ?? '') !== 'rol') {
    fallar('Accion desconocida');
}

$usuarioId = (int) ($datos['usuarioId'] ?? 0);
$rolNuevo  = (string) ($datos['rol'] ?? '');

if ($usuarioId <= 0) {
    fallar('Falta el usuario a cambiar');
}

if (!in_array($rolNuevo, ['usuario', 'chofer', 'admin'], true)) {
    fallar('Ese rol no existe');
}

/* No dejar que el admin se quite su propio rol a si mismo,
   porque se quedaria fuera del panel sin poder volver */
if ($usuarioId === (int) $admin['id']) {
    fallar('No puedes cambiar tu propio rol', 403);
}

$buscar = $bd->prepare('SELECT id, nombre, apellidos, rol FROM usuarios WHERE id = ? LIMIT 1');
$buscar->execute([$usuarioId]);
$objetivo = $buscar->fetch();

if (!$objetivo) {
    fallar('Ese usuario no existe', 404);
}

if ($objetivo['rol'] === $rolNuevo) {
    fallar('El usuario ya tiene ese rol', 409);
}

/* Si se baja al ultimo administrador, nadie podria entrar
   al panel a cambiarlo de vuelta */
if ($objetivo['rol'] === 'admin' && $rolNuevo !== 'admin') {
    $otros = $bd->prepare(
        "SELECT COUNT(*) FROM usuarios WHERE rol = 'admin' AND activo = 1 AND id <> ?"
    );
    $otros->execute([$usuarioId]);

    if ((int) $otros->fetchColumn() === 0) {
        fallar('No puedes quitarle el rol al unico administrador', 409);
    }
}

/* Al volver a ser chofer arranca disponible; al dejarlo de ser,
   su estado de ruta ya no aplica */
if ($rolNuevo === 'chofer') {
    $q = $bd->prepare('UPDATE usuarios SET rol = ?, estado_chofer = "disponible" WHERE id = ?');
} else {
    $q = $bd->prepare('UPDATE usuarios SET rol = ? WHERE id = ?');
}
$q->execute([$rolNuevo, $usuarioId]);

echo json_encode([
    'ok'      => true,
    'accion'  => 'rol',
    'usuario' => [
        'id'        => $usuarioId,
        'nombre'    => trim($objetivo['nombre'] . ' ' . $objetivo['apellidos']),
        'rolAntes'  => $objetivo['rol'],
        'rol'       => $rolNuevo,
    ],
], JSON_UNESCAPED_UNICODE);
