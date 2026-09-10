roles
/* =====================================================
   MERCADO MEXA
   CUENTAS Y ROLES
===================================================== */


/* =====================================================
   ELEMENTOS
===================================================== */

const botonCuenta =
    document.getElementById("botonCuenta");

const modalCuenta =
    document.getElementById("modalCuenta");

const modalLogin =
    document.getElementById("modalLogin");

const modalRegistro =
    document.getElementById("modalRegistro");

const cerrarCuenta =
    document.getElementById("cerrarCuenta");

const cerrarLogin =
    document.getElementById("cerrarLogin");

const cerrarRegistro =
    document.getElementById("cerrarRegistro");

const btnAbrirLogin =
    document.getElementById("btnAbrirLogin");

const btnAbrirRegistro =
    document.getElementById("btnAbrirRegistro");

const btnRegistroDesdeLogin =
    document.getElementById("btnRegistroDesdeLogin");

const btnLoginDesdeRegistro =
    document.getElementById("btnLoginDesdeRegistro");

const btnRecuperarPassword =
    document.getElementById("btnRecuperarPassword");

const formLogin =
    document.getElementById("formLogin");

const formRegistro =
    document.getElementById("formRegistro");


/* =====================================================
   CUENTAS
===================================================== */

function obtenerCuentas() {

    try {

        return JSON.parse(
            localStorage.getItem("cuentasMexa") || "[]"
        );

    } catch (error) {

        console.error(
            "Error leyendo cuentas:",
            error
        );

        return [];

    }

}


function guardarCuentas(cuentas) {

    localStorage.setItem(
        "cuentasMexa",
        JSON.stringify(cuentas)
    );

}


/* =====================================================
   SESIÓN
===================================================== */

function obtenerSesionActual() {

    try {

        return JSON.parse(
            localStorage.getItem("sesionMexa") || "null"
        );

    } catch (error) {

        return null;

    }

}


function guardarSesion(cuenta) {

    const sesion = {

        id: cuenta.id,

        nombre: cuenta.nombre,

        apellidos: cuenta.apellidos,

        correo: cuenta.correo,

        telefono: cuenta.telefono,

        rol: cuenta.rol

    };


    localStorage.setItem(
        "sesionMexa",
        JSON.stringify(sesion)
    );

}


function cerrarSesionMexa() {

    localStorage.removeItem("sesionMexa");

    actualizarBotonCuenta();

}


/* =====================================================
   UTILIDADES
===================================================== */

function normalizarCorreo(correo) {

    return String(correo)
        .trim()
        .toLowerCase();

}


function crearIdCuenta() {

    return (
        "MX-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase()
    );

}


/* =====================================================
   CONTRASEÑA
===================================================== */

async function hashPassword(password) {

    if (
        window.crypto &&
        window.crypto.subtle
    ) {

        const datos =
            new TextEncoder().encode(password);

        const buffer =
            await crypto.subtle.digest(
                "SHA-256",
                datos
            );

        return Array
            .from(
                new Uint8Array(buffer)
            )
            .map(
                byte =>
                    byte
                        .toString(16)
                        .padStart(2, "0")
            )
            .join("");

    }


    let hash = 0;

    for (
        let i = 0;
        i < password.length;
        i++
    ) {

        hash =
            ((hash << 5) - hash) +
            password.charCodeAt(i);

        hash |= 0;

    }

    return String(hash);

}


/* =====================================================
   NOTIFICACIÓN
===================================================== */

function mostrarNotificacionCuenta(
    titulo,
    mensaje
) {

    const notificacion =
        document.getElementById(
            "notificacionCuenta"
        );

    const tituloElemento =
        document.getElementById(
            "tituloNotificacion"
        );

    const mensajeElemento =
        document.getElementById(
            "mensajeNotificacion"
        );


    if (!notificacion)
        return;


    if (tituloElemento) {

        tituloElemento.textContent =
            titulo;

    }


    if (mensajeElemento) {

        mensajeElemento.textContent =
            mensaje;

    }


    notificacion.classList.add("mostrar");


    setTimeout(() => {

        notificacion.classList.remove("mostrar");

    }, 3500);

}


/* =====================================================
   CUENTA INICIAL
===================================================== */

function restaurarCuentaInicial() {

    if (!modalCuenta)
        return;


    const contenido =
        modalCuenta.querySelector(
            ".contenido-modal"
        );


    if (!contenido)
        return;


    contenido.innerHTML = `

        <button
            class="cerrar-modal"
            id="cerrarCuenta"
            type="button">

            ×

        </button>


        <div class="cuenta-icon">
            ●
        </div>


        <span class="section-label">
            MERCADO MEXA
        </span>


        <h2>
            MI CUENTA
        </h2>


        <p>
            Inicia sesión o crea una cuenta
            para disfrutar de Mercado Mexa.
        </p>


        <button
            class="btn-naranja grande"
            id="btnAbrirLogin"
            type="button">

            INICIAR SESIÓN

        </button>


        <button
            class="btn-outline grande"
            id="btnAbrirRegistro"
            type="button">

            CREAR CUENTA

        </button>

    `;


    conectarEventosCuenta();

}


/* =====================================================
   EVENTOS DE CUENTA
===================================================== */

function conectarEventosCuenta() {

    document
        .getElementById("cerrarCuenta")
        ?.addEventListener("click", () => {

            modalCuenta?.classList.remove("activa");

        });


    document
        .getElementById("btnAbrirLogin")
        ?.addEventListener("click", () => {

            modalCuenta?.classList.remove("activa");

            modalLogin?.classList.add("activa");

        });


    document
        .getElementById("btnAbrirRegistro")
        ?.addEventListener("click", () => {

            modalCuenta?.classList.remove("activa");

            modalRegistro?.classList.add("activa");

        });

}


/* =====================================================
   ABRIR CUENTA
===================================================== */

botonCuenta?.addEventListener("click", () => {

    const sesion =
        obtenerSesionActual();


    if (sesion) {

        mostrarCuentaPorRol(sesion);

    } else {

        restaurarCuentaInicial();

    }


    modalCuenta?.classList.add("activa");

});


/* =====================================================
   ABRIR LOGIN DESDE HTML
===================================================== */

btnAbrirLogin?.addEventListener("click", () => {

    modalCuenta?.classList.remove("activa");

    modalLogin?.classList.add("activa");

});


/* =====================================================
   ABRIR REGISTRO DESDE HTML
===================================================== */

btnAbrirRegistro?.addEventListener("click", () => {

    modalCuenta?.classList.remove("activa");

    modalRegistro?.classList.add("activa");

});


/* =====================================================
   REGISTRO DESDE LOGIN
===================================================== */

btnRegistroDesdeLogin?.addEventListener("click", () => {

    modalLogin?.classList.remove("activa");

    modalRegistro?.classList.add("activa");

});


/* =====================================================
   LOGIN DESDE REGISTRO
===================================================== */

btnLoginDesdeRegistro?.addEventListener("click", () => {

    modalRegistro?.classList.remove("activa");

    modalLogin?.classList.add("activa");

});


/* =====================================================
   CERRAR LOGIN
===================================================== */

cerrarLogin?.addEventListener("click", () => {

    modalLogin?.classList.remove("activa");

});


/* =====================================================
   CERRAR REGISTRO
===================================================== */

cerrarRegistro?.addEventListener("click", () => {

    modalRegistro?.classList.remove("activa");

});


/* =====================================================
   REGISTRO
===================================================== */

formRegistro?.addEventListener(
    "submit",
    async e => {

        e.preventDefault();
        e.stopPropagation();


        const nombre =
            document
                .getElementById("registroNombre")
                ?.value
                .trim() || "";


        const apellidos =
            document
                .getElementById("registroApellidos")
                ?.value
                .trim() || "";


        const correo =
            normalizarCorreo(
                document
                    .getElementById("registroCorreo")
                    ?.value || ""
            );


        const telefono =
            document
                .getElementById("registroTelefono")
                ?.value
                .trim() || "";


        const password =
            document
                .getElementById("registroPassword")
                ?.value || "";


        const passwordConfirm =
            document
                .getElementById("registroPasswordConfirm")
                ?.value || "";


        const terminos =
            document
                .getElementById("registroTerminos")
                ?.checked || false;


        /* =========================
           VALIDAR
        ========================= */

        if (
            !nombre ||
            !apellidos ||
            !correo ||
            !telefono ||
            !password ||
            !passwordConfirm
        ) {

            mostrarNotificacionCuenta(
                "Datos incompletos",
                "Completa todos los campos."
            );

            return;

        }


        const correoValido =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                .test(correo);


        if (!correoValido) {

            mostrarNotificacionCuenta(
                "Correo no válido",
                "Ingresa un correo electrónico válido."
            );

            return;

        }


        if (password.length < 6) {

            mostrarNotificacionCuenta(
                "Contraseña no válida",
                "La contraseña debe tener al menos 6 caracteres."
            );

            return;

        }


        if (
            password !==
            passwordConfirm
        ) {

            mostrarNotificacionCuenta(
                "Las contraseñas no coinciden",
                "Escribe la misma contraseña en ambos campos."
            );

            return;

        }


        if (!terminos) {

            mostrarNotificacionCuenta(
                "Acepta los términos",
                "Debes aceptar los términos y condiciones."
            );

            return;

        }


        /* =========================
           CUENTAS ACTUALES
        ========================= */

        const cuentas =
            obtenerCuentas();


        const existe =
            cuentas.some(
                cuenta =>
                    normalizarCorreo(
                        cuenta.correo
                    ) === correo
            );


        if (existe) {

            mostrarNotificacionCuenta(
                "Correo ya registrado",
                "Ya existe una cuenta con ese correo."
            );

            return;

        }


        /* =========================
           CONTRASEÑA
        ========================= */

        const passwordHash =
            await hashPassword(
                password
            );


        /* =========================
           CREAR USUARIO
        ========================= */

        const nuevaCuenta = {

            id:
                crearIdCuenta(),

            nombre,

            apellidos,

            correo,

            telefono,

            passwordHash,

            /*
               Registro público:
               SIEMPRE usuario.
            */

            rol:
                "usuario",

            activo:
                true,

            fechaRegistro:
                new Date()
                    .toISOString()

        };


        cuentas.push(
            nuevaCuenta
        );


        guardarCuentas(
            cuentas
        );


        /* =========================
           LIMPIAR
        ========================= */

        formRegistro.reset();


        modalRegistro?.classList.remove("activa");

        modalLogin?.classList.add("activa");


        const loginCorreo =
            document.getElementById(
                "loginCorreo"
            );


        if (loginCorreo) {

            loginCorreo.value =
                correo;

        }


        mostrarNotificacionCuenta(
            "¡Cuenta creada!",
            "Tu cuenta fue registrada correctamente. Ahora inicia sesión."
        );

    }
);


/* =====================================================
   LOGIN
===================================================== */

formLogin?.addEventListener(
    "submit",
    async e => {

        e.preventDefault();
        e.stopPropagation();


        const correo =
            normalizarCorreo(
                document
                    .getElementById("loginCorreo")
                    ?.value || ""
            );


        const password =
            document
                .getElementById("loginPassword")
                ?.value || "";


        /* =========================
           VALIDACIONES
        ========================= */

        if (
            !correo ||
            !password
        ) {

            mostrarNotificacionCuenta(
                "Datos incompletos",
                "Completa correo y contraseña."
            );

            return;

        }


        const correoValido =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                .test(correo);


        if (!correoValido) {

            mostrarNotificacionCuenta(
                "Correo no válido",
                "Ingresa un correo electrónico válido."
            );

            return;

        }


        if (password.length < 6) {

            mostrarNotificacionCuenta(
                "Contraseña no válida",
                "La contraseña debe tener al menos 6 caracteres."
            );

            return;

        }


        /* =========================
           BUSCAR CUENTA
        ========================= */

        const cuentas =
            obtenerCuentas();


        const cuenta =
            cuentas.find(
                item =>
                    normalizarCorreo(
                        item.correo
                    ) === correo
            );


        if (!cuenta) {

            mostrarNotificacionCuenta(
                "Cuenta no encontrada",
                "No existe una cuenta con ese correo."
            );

            return;

        }


        if (
            cuenta.activo === false
        ) {

            mostrarNotificacionCuenta(
                "Cuenta desactivada",
                "Esta cuenta no está disponible."
            );

            return;

        }


        /* =========================
           PASSWORD
        ========================= */

        const passwordHash =
            await hashPassword(
                password
            );


        if (
            cuenta.passwordHash !==
            passwordHash
        ) {

            mostrarNotificacionCuenta(
                "Contraseña incorrecta",
                "La contraseña ingresada no es correcta."
            );

            return;

        }


        /* =========================
           SESIÓN
        ========================= */

        guardarSesion(
            cuenta
        );


        actualizarBotonCuenta();


        modalLogin?.classList.remove("activa");


        let mensaje =
            "Has iniciado sesión correctamente.";


        if (
            cuenta.rol === "usuario"
        ) {

            mensaje =
                "Tu cuenta de usuario está activa.";

        }


        if (
            cuenta.rol === "chofer"
        ) {

            mensaje =
                "Tu cuenta de chofer está activa.";

        }


        if (
            cuenta.rol === "admin"
        ) {

            mensaje =
                "Tu cuenta de administrador está activa.";

        }


        mostrarNotificacionCuenta(
            "¡Sesión iniciada!",
            `Hola ${cuenta.nombre}. ${mensaje}`
        );


        formLogin.reset();

    }
);


/* =====================================================
   RECUPERAR CONTRASEÑA
===================================================== */

btnRecuperarPassword?.addEventListener(
    "click",
    () => {

        mostrarNotificacionCuenta(
            "Recuperación de contraseña",
            "Esta función se conectará al correo y a la base de datos cuando integremos el backend."
        );

    }
);


/* =====================================================
   ACTUALIZAR BOTÓN DE CUENTA
===================================================== */

function actualizarBotonCuenta() {

    const boton =
        document.getElementById(
            "botonCuenta"
        );


    if (!boton)
        return;


    const sesion =
        obtenerSesionActual();


    if (!sesion) {

        boton.textContent =
            "●";

        boton.title =
            "Cuenta";

        return;

    }


    boton.textContent =
        sesion.nombre
            ? sesion.nombre
                .charAt(0)
                .toUpperCase()
            : "U";


    boton.title =
        `${sesion.nombre} — ${sesion.rol}`;

}


/* =====================================================
   MOSTRAR CUENTA SEGÚN ROL
===================================================== */

function mostrarCuentaPorRol(
    sesion
) {

    const contenido =
        modalCuenta?.querySelector(
            ".contenido-modal"
        );


    if (!contenido)
        return;


    let icono =
        "👤";

    let nombreRol =
        "USUARIO";


    if (
        sesion.rol === "chofer"
    ) {

        icono =
            "🚚";

        nombreRol =
            "CHOFER";

    }


    if (
        sesion.rol === "admin"
    ) {

        icono =
            "⚙️";

        nombreRol =
            "ADMINISTRADOR";

    }


    let opciones =
        "";


    /* =========================
       USUARIO
    ========================= */

    if (
        sesion.rol ===
        "usuario"
    ) {

        opciones = `

            <button
                type="button"
                class="opcion-cuenta">

                👤 Mi perfil

            </button>


            <button
                type="button"
                class="opcion-cuenta">

                ❤️ Mis favoritos

            </button>


            <button
                type="button"
                class="opcion-cuenta">

                🛒 Mi lista

            </button>


            <button
                type="button"
                class="opcion-cuenta">

                📦 Mis pedidos

            </button>


            <button
                type="button"
                class="opcion-cuenta">

                📍 Mis direcciones

            </button>

        `;

    }


    /* =========================
       CHOFER
    ========================= */

    if (
        sesion.rol ===
        "chofer"
    ) {

        opciones = `

            <button
                type="button"
                class="opcion-cuenta">

                🚚 Panel de chofer

            </button>


            <button
                type="button"
                class="opcion-cuenta">

                📦 Pedidos asignados

            </button>


            <button
                type="button"
                class="opcion-cuenta">

                🗺️ Mis rutas

            </button>


            <button
                type="button"
                class="opcion-cuenta">

                ✅ Entregas realizadas

            </button>


            <button
                type="button"
                class="opcion-cuenta">

                👤 Mi perfil

            </button>

        `;

    }


    /* =========================
       ADMIN
    ========================= */

    if (
        sesion.rol ===
        "admin"
    ) {

        opciones = `

            <button
                type="button"
                class="opcion-cuenta">

                ⚙️ Panel administrador

            </button>


            <button
                type="button"
                class="opcion-cuenta">

                👥 Usuarios

            </button>


            <button
                type="button"
                class="opcion-cuenta">

                🚚 Choferes

            </button>


            <button
                type="button"
                class="opcion-cuenta">

                📦 Pedidos

            </button>


            <button
                type="button"
                class="opcion-cuenta">

                🏪 Tiendas

            </button>


            <button
                type="button"
                class="opcion-cuenta">

                📊 Reportes

            </button>


            <button
                type="button"
                class="opcion-cuenta">

                ⚙️ Configuración

            </button>

        `;

    }


    /* =========================
       CONTENIDO
    ========================= */

    contenido.innerHTML = `

        <button
            class="cerrar-modal"
            id="cerrarCuentaRol"
            type="button">

            ×

        </button>


        <div class="cuenta-icon">

            ${icono}

        </div>


        <span class="section-label">

            MERCADO MEXA

        </span>


        <h2>

            HOLA,
            ${escapeHTML(
                sesion.nombre
            ).toUpperCase()}

        </h2>


        <p>

            ${escapeHTML(
                sesion.correo
            )}

        </p>


        <div class="rol-cuenta">

            ${icono}
            ${nombreRol}

        </div>


        <div class="cuenta-opciones">

            ${opciones}


            <button
                type="button"
                class="opcion-cuenta"
                id="btnCerrarSesionMexa">

                🚪 CERRAR SESIÓN

            </button>

        </div>

    `;


    /* =========================
       CERRAR
    ========================= */

    document
        .getElementById(
            "cerrarCuentaRol"
        )
        ?.addEventListener(
            "click",
            () => {

                modalCuenta?.classList.remove(
                    "activa"
                );

            }
        );


    /* =========================
       LOGOUT
    ========================= */

    document
        .getElementById(
            "btnCerrarSesionMexa"
        )
        ?.addEventListener(
            "click",
            () => {

                cerrarSesionMexa();

                restaurarCuentaInicial();

                modalCuenta?.classList.remove(
                    "activa"
                );


                mostrarNotificacionCuenta(
                    "Sesión cerrada",
                    "Has cerrado tu sesión correctamente."
                );

            }
        );

}


/* =====================================================
   CUENTAS INTERNAS DE PRUEBA
===================================================== */

async function crearCuentaInterna(
    nombre,
    apellidos,
    correo,
    telefono,
    password,
    rol
) {

    const cuentas =
        obtenerCuentas();


    const correoNormalizado =
        normalizarCorreo(
            correo
        );


    const existe =
        cuentas.some(
            cuenta =>
                normalizarCorreo(
                    cuenta.correo
                ) === correoNormalizado
        );


    if (existe)
        return;


    const passwordHash =
        await hashPassword(
            password
        );


    cuentas.push({

        id:
            crearIdCuenta(),

        nombre,

        apellidos,

        correo:
            correoNormalizado,

        telefono,

        passwordHash,

        rol,

        activo:
            true,

        fechaRegistro:
            new Date()
                .toISOString(),

        cuentaInterna:
            true

    });


    guardarCuentas(
        cuentas
    );

}


/* =====================================================
   CUENTAS DEMO
===================================================== */

async function crearCuentasDemoRoles() {

    await crearCuentaInterna(

        "Carlos",

        "Ramírez",

        "chofer@mexamexa.com",

        "9510000000",

        "Chofer123",

        "chofer"

    );


    await crearCuentaInterna(

        "Administrador",

        "Mercado Mexa",

        "admin@mexamexa.com",

        "9511111111",

        "Admin123",

        "admin"

    );

}


/* =====================================================
   INICIAR
===================================================== */

crearCuentasDemoRoles();

actualizarBotonCuenta();