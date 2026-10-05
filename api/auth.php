<?php
/* =====================================================
   MERCADO MEXA - API de cuentas
   Iniciar sesion y crear cuenta.

   Uso:
     GET  api/auth.php                          -> devuelve la sesion actual
     POST api/auth.php  {"accion":"login","correo":"...","password":"..."}
     POST api/auth.php  {"accion":"registro","nombre":"...","apellidos":"...",
                         "correo":"...","telefono":"...","password":"..."}
     POST api/auth.php  {"accion":"estadoChofer","estado":"en_ruta"}
     POST api/auth.php  {"accion":"logout"}

   La accion "estadoChofer" es para el boton "PASAR A RUTA" del
   panel del chofer. Solo un chofer puede llamarla y solo cambia
   su propio estado.

   El rol lo decide el servidor: un registro publico siempre
   es "usuario", aunque el cliente mande otro valor.

   La contrasena NUNCA sale del servidor: se guarda con
   password_hash() y se revisa con password_verify().
   ===================================================== */

header('Content-Type: application/json; charset=utf-8');

// Same-origin: estas peticiones se hacen desde el mismo dominio/puerto.
// CORS con '*' y cookies (PHPSESSID) NO funciona si no especifica credential=true.
// Por eso lo quitamos. Si en algun momento se consumiera desde otro origen,
// habria que poner un origen concreto y Access-Control-Allow-Credentials.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/bd.php';

session_start();

/* Devuelve un error en JSON y termina */
function responderError($mensaje, $codigo = 400) {
    http_response_code($codigo);
    echo json_encode(['ok' => false, 'error' => $mensaje], JSON_UNESCAPED_UNICODE);
    exit;
}

/* Normaliza el correo: minusculas y sin espacios */
function normalizarCorreo($correo) {
    return strtolower(trim((string) $correo));
}

try {
    $bd = conectarBD();
} catch (Throwable $error) {
    responderError('No se pudo conectar con la base de datos', 500);
}

/* =========================
   LEER LA PETICION
   Se lee una sola vez y antes de decidir nada.
========================= */

$esPost   = $_SERVER['REQUEST_METHOD'] === 'POST';
$crudo    = $esPost ? (string) file_get_contents('php://input') : '';
$accion   = '';

// Algunos clientes (PowerShell, Excel) mandan un BOM al inicio
// y eso hace que json_decode falle. Se quita antes de interpretar.
$crudo = preg_replace('/^\xEF\xBB\xBF/', '', $crudo);

if ($esPost && $crudo !== '') {
    $datosCrudos = json_decode($crudo, true);
    if (is_array($datosCrudos)) {
        $accion = (string) ($datosCrudos['accion'] ?? '');
    } else {
        responderError('Datos invalidos');
    }
}

/* =========================
   CERRAR SESION
   Se procesa siempre, tenga sesion o no.
========================= */

if ($accion === 'logout') {
    $_SESSION = [];
    session_destroy();
    echo json_encode(['ok' => true, 'accion' => 'logout'], JSON_UNESCAPED_UNICODE);
    exit;
}

/* =========================
   PREGUNTAR POR LA SESION
   Solo si NO se pidio una accion concreta.
   (si no, un login fallido con sesion activa devolveria
    "sesion activa" en vez del error real)
========================= */

if ($accion === '') {
    /* Rol, estado y entregas se releen de la base. Asi el navegador
       nunca restaura una sesion con datos que ya cambiaron.
       Si la cuenta se desactivo, refrescarSesion() cierra la sesion
       y aqui se devuelve usuario: null. */
    refrescarSesion($bd);

    echo json_encode([
        'ok'      => true,
        'accion'  => 'sesion',
        'usuario' => isset($_SESSION['usuario']) ? usuarioPublico($_SESSION['usuario']) : null,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!$esPost) {
    responderError('Accion desconocida', 400);
}

/* =========================
   LEER DATOS
   (ya se leyeron arriba, aqui solo se expone el arreglo)
========================= */

$datos = $datosCrudos;

/* =========================
   INICIAR SESION
========================= */

if ($accion === 'login') {
    $correo   = normalizarCorreo($datos['correo'] ?? '');
    $password = (string) ($datos['password'] ?? '');

    if ($correo === '' || $password === '') {
        responderError('Correo y contrasena son obligatorios');
    }

    $buscar = $bd->prepare('SELECT * FROM usuarios WHERE correo = ? LIMIT 1');
    $buscar->execute([$correo]);
    $usuario = $buscar->fetch();

    // Mismo mensaje para "no existe" y "contrasena incorrecta":
    // no revela quais correos estan registrados.
    if (!$usuario || !password_verify($password, $usuario['password_hash'])) {
        responderError('Correo o contrasena incorrectos', 401);
    }

    if ((int) $usuario['activo'] !== 1) {
        responderError('Esta cuenta esta desactivada', 403);
    }

    // Sesion nueva: evita que una cookie vieja se reutilice
    session_regenerate_id(true);

    // Se guarda SOLO lo necesario en la sesion, nunca el hash
    unset($usuario['password_hash']);
    $_SESSION['usuario'] = $usuario;

    echo json_encode([
        'ok'      => true,
        'accion'  => 'login',
        'usuario' => usuarioPublico($usuario),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/* =========================
   ESTADO DEL CHOFER
   El boton "PASAR A RUTA" del panel. Solo el chofer cambia
   su propio estado, y no necesita ser admin.
   ========================= */

if ($accion === 'estadoChofer') {
    if (empty($_SESSION['usuario']['id'])) {
        responderError('Inicia sesion primero', 401);
    }

    /* El rol se vuelve a leer de la base, por si un admin se lo
       cambio a esta sesion mientras estaba abierta */
    refrescarSesion($bd);

    if (($_SESSION['usuario']['rol'] ?? '') !== 'chofer') {
        responderError('Solo un chofer puede cambiar su estado', 403);
    }

    $estado = (string) ($datos['estado'] ?? '');

    if (!in_array($estado, ['disponible', 'en_ruta'], true)) {
        responderError('Ese estado no existe');
    }

    $usuarioId = (int) $_SESSION['usuario']['id'];

    $cambiar = $bd->prepare('UPDATE usuarios SET estado_chofer = ? WHERE id = ?');
    $cambiar->execute([$estado, $usuarioId]);

    /* La sesion se actualiza de una vez para que el resto de la
       pagina no tenga que volver a preguntar */
    $_SESSION['usuario']['estado_chofer'] = $estado;

    echo json_encode([
        'ok'      => true,
        'accion'  => 'estadoChofer',
        'estado'  => $estado,
        'usuario' => usuarioPublico($_SESSION['usuario']),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/* =========================
   CREAR CUENTA
   ========================= */

if ($accion === 'registro') {
    $nombre    = trim((string) ($datos['nombre'] ?? ''));
    $apellidos = trim((string) ($datos['apellidos'] ?? ''));
    $correo    = normalizarCorreo($datos['correo'] ?? '');
    $telefono  = trim((string) ($datos['telefono'] ?? ''));
    $password  = (string) ($datos['password'] ?? '');
    /* El rol SIEMPRE es "usuario" en un registro publico.
       Aunque el cliente mande rol=admin, se ignora.
       Los roles chofer y admin se dan desde la base de datos
       o desde un panel de administracion, nunca desde un formulario. */
    $rol = 'usuario';

    if ($nombre === '' || $apellidos === '' || $correo === '' || $telefono === '') {
        responderError('Todos los campos son obligatorios');
    }

    if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        responderError('El correo no es valido');
    }

    if (strlen($password) < 6) {
        responderError('La contrasena necesita al menos 6 caracteres');
    }

    $existe = $bd->prepare('SELECT id FROM usuarios WHERE correo = ? LIMIT 1');
    $existe->execute([$correo]);

    if ($existe->fetch()) {
        responderError('Ya existe una cuenta con ese correo', 409);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);

    $crear = $bd->prepare(
        'INSERT INTO usuarios
            (nombre, apellidos, correo, telefono, password_hash, rol, activo, cuenta_demo)
         VALUES (?, ?, ?, ?, ?, ?, 1, 0)'
    );
    $crear->execute([$nombre, $apellidos, $correo, $telefono, $hash, $rol]);

    $nuevo = [
        'id'           => (int) $bd->lastInsertId(),
        'nombre'       => $nombre,
        'apellidos'    => $apellidos,
        'correo'       => $correo,
        'telefono'     => $telefono,
        'direccion'    => null,
        'rol'          => $rol,
        'estado_chofer'=> 'disponible',
        'entregas'     => 0,
    ];

    session_regenerate_id(true);
    $_SESSION['usuario'] = $nuevo;

    echo json_encode([
        'ok'      => true,
        'accion'  => 'registro',
        'usuario' => usuarioPublico($nuevo),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/* =========================
   ACCION DESCONOCIDA
========================= */

responderError('Accion desconocida');
