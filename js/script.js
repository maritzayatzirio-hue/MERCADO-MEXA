let mapa = null;
let ubicacionUsuario = null;
let rutaActual = null;
let marcadoresRuta = [];
let marcadorUsuario = null;
let marcadoresTiendas = [];
let tiendas = [];
let tiendasVisibles = 6;

let carrito = JSON.parse(localStorage.getItem("carritoMexa") || "[]");
carrito = carrito.map(p => ({
    ...p,
    cantidad: p.cantidad || 1,
    comprado: Boolean(p.comprado)
}));
let favoritosMexa =
    JSON.parse(
        localStorage.getItem("favoritosMexa") || "[]"
    );

let temporizadorLista = null;

const estadoUbicacion = document.getElementById("estadoUbicacion");
const listaTiendas = document.getElementById("listaTiendas");
const distanciaCercana = document.getElementById("distanciaCercana");
const storesStatus = document.getElementById("storesStatus");
const contadorLista = document.getElementById("contadorLista");
const sidebarContador = document.getElementById("sidebarContador");

window.addEventListener("load", iniciarAplicacion);

function iniciarAplicacion() {
    actualizarContador();
    prepararEventos();
    iniciarSplash();
}

function iniciarSplash() {
    const splash = document.getElementById("splash");
    const app = document.getElementById("app");
    const bar = document.getElementById("progressBar");
    const percent = document.getElementById("progressPercent");
    const estado = document.getElementById("progressEstado");
    const texto = document.getElementById("splashTexto");

    const pasos = [
        { p: 18, t: "Preparando tu mercado...", e: "INICIANDO" },
        { p: 42, t: "Activando mapa interactivo...", e: "MAPA" },
        { p: 68, t: "Preparando búsqueda de tiendas...", e: "TIENDAS NETO" },
        { p: 88, t: "Listo para encontrar tu tienda...", e: "GPS" },
        { p: 100, t: "¡Todo listo!", e: "LISTO" }
    ];

    let i = 0;

    const avanzar = () => {
        const paso = pasos[i];

        bar.style.width = `${paso.p}%`;
        percent.textContent = `${paso.p}%`;
        estado.textContent = paso.e;
        texto.textContent = paso.t;

        if (i < pasos.length - 1) {
            i++;
            setTimeout(avanzar, 430);
        } else {
            setTimeout(() => {
                splash.classList.add("oculto");
                app.classList.add("visible");

                setTimeout(() => {
                    obtenerUbicacion();
                }, 250);

            }, 550);
        }
    };

    setTimeout(avanzar, 300);
}


/* =========================
   EVENTOS
========================= */

function prepararEventos() {

    document
        .getElementById("botonUbicacion")
        ?.addEventListener("click", obtenerUbicacion);

    document
        .getElementById("heroUbicacion")
        ?.addEventListener("click", obtenerUbicacion);

    document
        .getElementById("heroVerMapa")
        ?.addEventListener("click", () => {

            document
                .getElementById("mapaSeccion")
                ?.scrollIntoView({
                    behavior: "smooth"
                });

        });


    document
        .getElementById("centrarMapa")
        ?.addEventListener("click", () => {

            if (mapa && ubicacionUsuario) {

                mapa.flyTo(
                    [
                        ubicacionUsuario.lat,
                        ubicacionUsuario.lng
                    ],
                    14,
                    {
                        duration: 1.2
                    }
                );

            }

        });


    document
        .getElementById("botonLista")
        ?.addEventListener("click", () => abrirLista(true));

    document
        .getElementById("navLista")
        ?.addEventListener("click", () => abrirLista(true));


    document
        .getElementById("cerrarLista")
        ?.addEventListener("click", () => {

            document
                .getElementById("modalLista")
                ?.classList.remove("activa");

        });






/* =====================================================
   TÉRMINOS Y CONDICIONES
===================================================== */

const btnVerTerminos =
    document.getElementById("btnVerTerminos");

const modalTerminos =
    document.getElementById("modalTerminos");

const cerrarTerminos =
    document.getElementById("cerrarTerminos");

const btnAceptarTerminos =
    document.getElementById("btnAceptarTerminos");

const registroTerminos =
    document.getElementById("registroTerminos");


/* ABRIR TÉRMINOS */

btnVerTerminos?.addEventListener("click", () => {

    modalTerminos?.classList.add("activa");

});


/* CERRAR TÉRMINOS */

cerrarTerminos?.addEventListener("click", () => {

    modalTerminos?.classList.remove("activa");

});


/* ACEPTAR TÉRMINOS */

btnAceptarTerminos?.addEventListener("click", () => {

    if (registroTerminos) {

        registroTerminos.checked = true;

    }

    modalTerminos?.classList.remove("activa");

});
/* =====================================================
   ELEMENTOS DE CUENTA
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

const formLogin =
    document.getElementById("formLogin");

const formRegistro =
    document.getElementById("formRegistro");


/* =====================================================
   LEER CUENTAS
===================================================== */

function obtenerCuentas() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "cuentasMexa"
            ) || "[]"
        );

    } catch (error) {

        console.error(
            "Error al leer cuentas:",
            error
        );

        return [];

    }

}


/* =====================================================
   GUARDAR CUENTAS
===================================================== */

function guardarCuentas(cuentas) {

    localStorage.setItem(
        "cuentasMexa",
        JSON.stringify(cuentas)
    );

}


/* =====================================================
   LEER SESIÓN
===================================================== */

function obtenerSesionActual() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "sesionMexa"
            ) || "null"
        );

    } catch (error) {

        return null;

    }

}


/* =====================================================
   GUARDAR SESIÓN
===================================================== */

function guardarSesion(cuenta) {

    /*
       La sesión NO guarda password.
    */

    const sesion = {

        id:
            cuenta.id,

        nombre:
            cuenta.nombre,

        apellidos:
            cuenta.apellidos,

        correo:
            cuenta.correo,

        telefono:
            cuenta.telefono,

        rol:
            cuenta.rol

    };


    localStorage.setItem(
        "sesionMexa",
        JSON.stringify(
            sesion
        )
    );

}


/* =====================================================
   CERRAR SESIÓN
===================================================== */

function cerrarSesionMexa() {

    localStorage.removeItem(
        "sesionMexa"
    );

    actualizarBotonCuenta();

}


/* =====================================================
   NORMALIZAR CORREO
===================================================== */

function normalizarCorreo(
    correo
) {

    return String(
        correo
    )
        .trim()
        .toLowerCase();

}


/* =====================================================
   CREAR ID
===================================================== */

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
   HASH DE CONTRASEÑA
===================================================== */

async function hashPassword(
    password
) {

    /*
       No guardamos la contraseña
       directamente.
    */

    if (
        window.crypto &&
        window.crypto.subtle
    ) {

        const datos =
            new TextEncoder()
                .encode(
                    password
                );

        const buffer =
            await crypto.subtle.digest(
                "SHA-256",
                datos
            );

        return Array
            .from(
                new Uint8Array(
                    buffer
                )
            )
            .map(
                byte =>
                    byte
                        .toString(16)
                        .padStart(
                            2,
                            "0"
                        )
            )
            .join("");

    }


    /* Respaldo para pruebas locales */

    let hash = 0;

    for (
        let i = 0;
        i < password.length;
        i++
    ) {

        hash =
            (
                (
                    hash << 5
                ) -
                hash
            ) +
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


    notificacion.classList.add(
        "mostrar"
    );


    setTimeout(
        () => {

            notificacion.classList.remove(
                "mostrar"
            );

        },
        3500
    );

}
/* =====================================================
   ABRIR MI CUENTA
===================================================== */

botonCuenta?.addEventListener(
    "click",
    () => {

        const sesion =
            obtenerSesionActual();


        if (sesion) {

            mostrarCuentaPorRol(
                sesion
            );

        } else {

            restaurarCuentaInicial();

        }


        modalCuenta?.classList.add(
            "activa"
        );

    }
);

/* =====================================================
   ABRIR LOGIN
===================================================== */

btnAbrirLogin?.addEventListener(
    "click",
    () => {

        modalCuenta?.classList.remove(
            "activa"
        );

        modalLogin?.classList.add(
            "activa"
        );

    }
);


/* =====================================================
   ABRIR REGISTRO
===================================================== */

btnAbrirRegistro?.addEventListener(
    "click",
    () => {

        modalCuenta?.classList.remove(
            "activa"
        );

        modalRegistro?.classList.add(
            "activa"
        );

    }
);


/* =====================================================
   REGISTRO DESDE LOGIN
===================================================== */

btnRegistroDesdeLogin?.addEventListener(
    "click",
    () => {

        modalLogin?.classList.remove(
            "activa"
        );

        modalRegistro?.classList.add(
            "activa"
        );

    }
);


/* =====================================================
   LOGIN DESDE REGISTRO
===================================================== */

btnLoginDesdeRegistro?.addEventListener(
    "click",
    () => {

        modalRegistro?.classList.remove(
            "activa"
        );

        modalLogin?.classList.add(
            "activa"
        );

    }
);


/* =====================================================
   CERRAR CUENTA
===================================================== */

cerrarCuenta?.addEventListener(
    "click",
    () => {

        modalCuenta?.classList.remove(
            "activa"
        );

    }
);


/* =====================================================
   CERRAR LOGIN
===================================================== */

cerrarLogin?.addEventListener(
    "click",
    () => {

        modalLogin?.classList.remove(
            "activa"
        );

    }
);


/* =====================================================
   CERRAR REGISTRO
===================================================== */

cerrarRegistro?.addEventListener(
    "click",
    () => {

        modalRegistro?.classList.remove(
            "activa"
        );

    }
);


/* =====================================================
   REGISTRAR NUEVA CUENTA
===================================================== */

formRegistro?.addEventListener(
    "submit",
    async e => {

        e.preventDefault();
        e.stopPropagation();


        /* =========================
           DATOS
        ========================= */

        const nombre =
            document
                .getElementById(
                    "registroNombre"
                )
                ?.value
                .trim() || "";


        const apellidos =
            document
                .getElementById(
                    "registroApellidos"
                )
                ?.value
                .trim() || "";


        const correo =
            normalizarCorreo(
                document
                    .getElementById(
                        "registroCorreo"
                    )
                    ?.value || ""
            );


        const telefono =
            document
                .getElementById(
                    "registroTelefono"
                )
                ?.value
                .trim() || "";


        const password =
            document
                .getElementById(
                    "registroPassword"
                )
                ?.value || "";


        const passwordConfirm =
            document
                .getElementById(
                    "registroPasswordConfirm"
                )
                ?.value || "";


        const aceptaTerminos =
            document
                .getElementById(
                    "registroTerminos"
                )
                ?.checked || false;


        /* =========================
           VALIDAR CAMPOS
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


        /* =========================
           VALIDAR CORREO
        ========================= */

        const correoValido =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                .test(
                    correo
                );


        if (!correoValido) {

            mostrarNotificacionCuenta(
                "Correo no válido",
                "Ingresa un correo electrónico válido."
            );

            return;

        }


        /* =========================
           VALIDAR PASSWORD
        ========================= */

        if (
            password.length < 6
        ) {

            mostrarNotificacionCuenta(
                "Contraseña no válida",
                "La contraseña debe tener al menos 6 caracteres."
            );

            return;

        }


        /* =========================
           CONFIRMAR PASSWORD
        ========================= */

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


        /* =========================
           TÉRMINOS
        ========================= */

        if (!aceptaTerminos) {

            mostrarNotificacionCuenta(
                "Acepta los términos",
                "Debes aceptar los términos y condiciones."
            );

            return;

        }


        /* =========================
           OBTENER CUENTAS
        ========================= */

        const cuentas =
            obtenerCuentas();


        /* =========================
           COMPROBAR CORREO
        ========================= */

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
           CREAR HASH
        ========================= */

        const passwordHash =
            await hashPassword(
                password
            );


        /* =========================
           CREAR CUENTA
        =========================

           TODOS LOS REGISTROS
           PÚBLICOS SON USUARIO.
        */

        const nuevaCuenta = {

            id:
                crearIdCuenta(),

            nombre,

            apellidos,

            correo,

            telefono,

            passwordHash,

            rol:
                "usuario",

            activo:
                true,

            fechaRegistro:
                new Date()
                    .toISOString()

        };


        /* =========================
           GUARDAR
        ========================= */

        cuentas.push(
            nuevaCuenta
        );

        guardarCuentas(
            cuentas
        );


        /* =========================
           LIMPIAR FORMULARIO
        ========================= */

        formRegistro.reset();


        /* =========================
           CERRAR REGISTRO
        ========================= */

        modalRegistro?.classList.remove(
            "activa"
        );


        /* =========================
           ABRIR LOGIN
        ========================= */

        modalLogin?.classList.add(
            "activa"
        );


        /* =========================
           COLOCAR CORREO
        ========================= */

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
   INICIAR SESIÓN
===================================================== */

formLogin?.addEventListener(
    "submit",
    async e => {

        e.preventDefault();
        e.stopPropagation();


        /* =========================
           DATOS
        ========================= */

        const correo =
            normalizarCorreo(
                document
                    .getElementById(
                        "loginCorreo"
                    )
                    ?.value || ""
            );


        const password =
            document
                .getElementById(
                    "loginPassword"
                )
                ?.value || "";


        /* =========================
           VALIDAR
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


        /* =========================
           CORREO
        ========================= */

        const correoValido =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                .test(
                    correo
                );


        if (!correoValido) {

            mostrarNotificacionCuenta(
                "Correo no válido",
                "Ingresa un correo electrónico válido."
            );

            return;

        }


        /* =========================
           PASSWORD
        ========================= */

        if (
            password.length < 6
        ) {

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
                c =>
                    normalizarCorreo(
                        c.correo
                    ) === correo
            );


        if (!cuenta) {

            mostrarNotificacionCuenta(
                "Cuenta no encontrada",
                "No existe una cuenta con ese correo."
            );

            return;

        }


        /* =========================
           CUENTA ACTIVA
        ========================= */

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
           COMPROBAR PASSWORD
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
           GUARDAR SESIÓN
        ========================= */

        guardarSesion(
            cuenta
        );


        /* =========================
           CERRAR LOGIN
        ========================= */

        modalLogin?.classList.remove(
            "activa"
        );


        /* =========================
           ACTUALIZAR BOTÓN
        ========================= */

        actualizarBotonCuenta();


        /* =========================
           MENSAJE SEGÚN ROL
        ========================= */

        let mensaje =
            "Has iniciado sesión correctamente.";


        if (
            cuenta.rol === "chofer"
        ) {

            mensaje =
                "Bienvenido al panel de chofer.";

        }


        if (
            cuenta.rol === "admin"
        ) {

            mensaje =
                "Bienvenido al panel de administración.";

        }


        mostrarNotificacionCuenta(
            "¡Sesión iniciada!",
            `Hola ${cuenta.nombre}. ${mensaje}`
        );


        formLogin.reset();

    }
);


/* =====================================================
   ACTUALIZAR BOTÓN
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
   RESTAURAR CUENTA INICIAL
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


    /* =================================================
       CERRAR CUENTA
    ================================================= */

    document
        .getElementById(
            "cerrarCuenta"
        )
        ?.addEventListener(
            "click",
            () => {

                modalCuenta?.classList.remove(
                    "activa"
                );

            }
        );


    /* =================================================
       ABRIR LOGIN
    ================================================= */

    document
        .getElementById(
            "btnAbrirLogin"
        )
        ?.addEventListener(
            "click",
            () => {

                modalCuenta?.classList.remove(
                    "activa"
                );

                modalLogin?.classList.add(
                    "activa"
                );

            }
        );


    /* =================================================
       ABRIR REGISTRO
    ================================================= */

    document
        .getElementById(
            "btnAbrirRegistro"
        )
        ?.addEventListener(
            "click",
            () => {

                modalCuenta?.classList.remove(
                    "activa"
                );

                modalRegistro?.classList.add(
                    "activa"
                );

            }
        );

}
/* =====================================================
   MOSTRAR CUENTA SEGÚN ROL
===================================================== */

function mostrarCuentaPorRol(
    sesion
) {

    if (!modalCuenta)
        return;


    /*
       Tu modal debe tener
       .contenido-modal
    */

    const contenido =
        modalCuenta.querySelector(
            ".contenido-modal"
        );


    if (!contenido) {

        console.warn(
            "No se encontró .contenido-modal dentro de #modalCuenta"
        );

        return;

    }


    /* =========================
       DATOS DEL ROL
    ========================= */

    let rolTexto =
        "USUARIO";

    let rolIcono =
        "👤";


    if (
        sesion.rol === "chofer"
    ) {

        rolTexto =
            "CHOFER";

        rolIcono =
            "🚚";

    }


    if (
        sesion.rol === "admin"
    ) {

        rolTexto =
            "ADMINISTRADOR";

        rolIcono =
            "⚙️";

    }


    /* =========================
       OPCIONES USUARIO
    ========================= */

    let opciones = "";


    if (
        sesion.rol ===
        "usuario"
    ) {

        opciones = `

            <button
                type="button"
                class="opcion-cuenta"
            >
                👤 Mi perfil
            </button>

            <button
                type="button"
                class="opcion-cuenta"
                id="btnFavoritosCuenta"
            >
                ❤️ Mis favoritos
            </button>

            <button
                type="button"
                class="opcion-cuenta"
                id="btnMiListaCuenta"
            >
                🛒 Mi lista
            </button>

            <button
                type="button"
                class="opcion-cuenta"
            >
                📦 Mis pedidos
            </button>

            <button
                type="button"
                class="opcion-cuenta"
            >
                📍 Mis direcciones
            </button>

        `;

    }


    /* =========================
       OPCIONES CHOFER
    ========================= */

    if (
        sesion.rol ===
        "chofer"
    ) {

        opciones = `

            <button
                type="button"
                class="opcion-cuenta"
            >
                🚚 Panel de chofer
            </button>

            <button
                type="button"
                class="opcion-cuenta"
            >
                📦 Pedidos asignados
            </button>

            <button
                type="button"
                class="opcion-cuenta"
            >
                🗺️ Mis rutas
            </button>

            <button
                type="button"
                class="opcion-cuenta"
            >
                ✅ Entregas realizadas
            </button>

            <button
                type="button"
                class="opcion-cuenta"
            >
                👤 Mi perfil
            </button>

        `;

    }


    /* =========================
       OPCIONES ADMIN
    ========================= */

    if (
        sesion.rol ===
        "admin"
    ) {

        opciones = `

            <button
                type="button"
                class="opcion-cuenta"
            >
                ⚙️ Panel administrador
            </button>

            <button
                type="button"
                class="opcion-cuenta"
            >
                👥 Usuarios
            </button>

            <button
                type="button"
                class="opcion-cuenta"
            >
                🚚 Choferes
            </button>

            <button
                type="button"
                class="opcion-cuenta"
            >
                📦 Pedidos
            </button>

            <button
                type="button"
                class="opcion-cuenta"
            >
                🏪 Tiendas
            </button>

            <button
                type="button"
                class="opcion-cuenta"
            >
                📊 Reportes
            </button>

            <button
                type="button"
                class="opcion-cuenta"
            >
                ⚙️ Configuración
            </button>

        `;

    }


    /* =========================
       PINTAR CUENTA
    ========================= */

    contenido.innerHTML = `

        <button
            class="cerrar-modal"
            id="cerrarCuentaRol"
            type="button"
        >
            ×
        </button>


        <div class="cuenta-perfil">

            <div class="cuenta-avatar">

                ${
                    sesion.nombre
                        ? escapeHTML(
                            sesion.nombre
                                .charAt(0)
                                .toUpperCase()
                        )
                        : "U"
                }

            </div>


            <h2>
                Hola,
                ${escapeHTML(
                    sesion.nombre
                )}
            </h2>


            <p>
                ${escapeHTML(
                    sesion.correo
                )}
            </p>


            <span class="rol-cuenta">

                ${rolIcono}
                ${rolTexto}

            </span>

        </div>


        <div class="cuenta-opciones">

            ${opciones}

            <button
                type="button"
                class="
                    opcion-cuenta
                    cerrar-sesion-cuenta
                "
                id="btnCerrarSesionMexa"
            >
                🚪 Cerrar sesión
            </button>

        </div>

    `;


    /* =========================
       CERRAR CUENTA
    ========================= */

    document
        .getElementById(
            "cerrarCuentaRol"
        )
        ?.addEventListener(
            "click",
            () => {

                modalCuenta.classList.remove(
                    "activa"
                );

            }
        );

    document.getElementById("btnFavoritosCuenta")?.addEventListener("click", () => {
        modalCuenta.classList.remove("activa");
        abrirFavoritos();
    });

    document.getElementById("btnMiListaCuenta")?.addEventListener("click", () => {
        modalCuenta.classList.remove("activa");
        abrirLista(true);
    });


    /* =========================
       CERRAR SESIÓN
    ========================= */

    document
        .getElementById(
            "btnCerrarSesionMexa"
        )
        ?.addEventListener(
            "click",
            () => {

                cerrarSesionMexa();


                modalCuenta.classList.remove(
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
   CREAR CUENTAS DE PRUEBA
===================================================== */

async function crearCuentasDemoRoles() {

    /*
       CHOFER
       correo:
       chofer@mexamexa.com

       contraseña:
       Chofer123
    */

    await crearCuentaInterna(

        "Carlos",

        "Ramírez",

        "chofer@mexamexa.com",

        "9510000000",

        "Chofer123",

        "chofer"

    );


    /*
       ADMIN
       correo:
       admin@mexamexa.com

       contraseña:
       Admin123
    */

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
   INICIAR CUENTAS
===================================================== */

crearCuentasDemoRoles();

actualizarBotonCuenta();


    document
        .querySelectorAll(".ventana-modal")
        .forEach(modal => {

            modal.addEventListener("click", e => {

                if (e.target === modal) {
                    modal.classList.remove("activa");
                }

            });

        });


    document
        .getElementById("mostrarMas")
        ?.addEventListener("click", () => {

            tiendasVisibles =
                tiendasVisibles >= tiendas.length
                    ? 6
                    : tiendas.length;

            mostrarTiendas();

        });


    document
        .getElementById("buscador")
        ?.addEventListener("input", e => {

            const texto =
                e.target.value
                    .toLowerCase()
                    .trim();

            document
                .querySelectorAll(".tarjeta-tienda")
                .forEach(card => {

                    const visible =
                        card.textContent
                            .toLowerCase()
                            .includes(texto);

                    card.style.display =
                        visible ? "" : "none";

                });

        });


    document
        .getElementById("mobileMenu")
        ?.addEventListener("click", () => {

            document
                .querySelector(".sidebar")
                ?.classList.toggle("abierta");

        });


    document
        .querySelectorAll(".nav-item[data-target]")
        .forEach(btn => {

            btn.addEventListener("click", () => {

                document
                    .querySelectorAll(".nav-item")
                    .forEach(n =>
                        n.classList.remove("activo")
                    );

                btn.classList.add("activo");

                const target = btn.dataset.target;


                if (target === "mapa") {

                    document
                        .getElementById("mapaSeccion")
                        ?.scrollIntoView({
                            behavior: "smooth"
                        });

                }


                if (target === "inicio") {

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                }


                if (target === "catalogo") {

                    if (tiendas.length > 0) {

                        entrarTienda(
                            tiendas[0].id
                        );

                    } else {

                        alert(
                            "Primero espera a que aparezcan las tiendas reales."
                        );

                    }

                }

                if (target === "favoritos") {
                    abrirFavoritos();
                }

            });

        });

}


/* =========================
   LISTA
========================= */

function abrirLista(conAnimacion = true) {

    const modal = document.getElementById("modalLista");
    if (!modal) return;

    let cargando = document.getElementById("loadingLista");
    if (!cargando) {
        cargando = document.createElement("div");
        cargando.id = "loadingLista";
        cargando.className = "ventana-modal";
        document.body.appendChild(cargando);

        cargando.addEventListener("click", e => {
            if (e.target === cargando) {
                if (cargando._timer) clearTimeout(cargando._timer);
                cargando.classList.remove("activa");
            }
        });
    }

    if (cargando._timer) {
        clearTimeout(cargando._timer);
    }

    renderLista();

    if (!conAnimacion) {
        modal.classList.add("activa");
        return;
    }

    modal.classList.remove("activa");

    cargando.innerHTML = `
        <div class="catalogo-loading">
            <div class="catalogo-loading-icon">
                🛒
            </div>
            <div class="catalogo-loading-titulo">
                ABRIENDO MI LISTA
            </div>
            <div class="catalogo-loading-bar">
                <div></div>
            </div>
            <div class="catalogo-loading-texto">
                Preparando productos...
            </div>
        </div>
    `;

    cargando.classList.add("activa");

    cargando._timer = setTimeout(() => {
        cargando.classList.remove("activa");
        modal.classList.add("activa");
    }, 1250);
}


/* =========================
   GPS
========================= */

function obtenerUbicacion() {

    estadoUbicacion.textContent =
        "SOLICITANDO GPS...";


    storesStatus.innerHTML = `
        <div class="mini-loader"></div>
        <span>Obteniendo tu ubicación real...</span>
    `;


    listaTiendas.innerHTML = "";


    if (!navigator.geolocation) {

        mostrarErrorUbicacion(
            "Tu navegador no permite geolocalización."
        );

        return;
    }


    navigator.geolocation.getCurrentPosition(

        async pos => {

            ubicacionUsuario = {

                lat:
                    pos.coords.latitude,

                lng:
                    pos.coords.longitude

            };


            estadoUbicacion.textContent =
                "GPS ACTIVO";


            crearMapa(
                ubicacionUsuario.lat,
                ubicacionUsuario.lng
            );


            await obtenerNombreLugar(
                ubicacionUsuario.lat,
                ubicacionUsuario.lng
            );

        },


        err => {

            let mensaje =
                "No fue posible obtener tu ubicación.";


            if (err.code === 1) {

                mensaje =
                    "Permiso de ubicación rechazado. Activa Ubicación en el candado del navegador.";

            } else if (err.code === 2) {

                mensaje =
                    "No se pudo determinar tu ubicación.";

            } else if (err.code === 3) {

                mensaje =
                    "La ubicación tardó demasiado en responder.";

            }


            mostrarErrorUbicacion(mensaje);

        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }

    );

}


/* =========================
   ERROR GPS
========================= */

function mostrarErrorUbicacion(mensaje) {

    estadoUbicacion.textContent =
        "GPS NO DISPONIBLE";


    storesStatus.innerHTML = `
        <div class="empty-stores">

            <strong>
                ⌖ NO SE PUDO ACTIVAR EL GPS
            </strong>

            <p>
                ${mensaje}
            </p>

            <button
                class="btn-naranja"
                style="margin-top:12px;min-height:34px"
                onclick="obtenerUbicacion()">

                REINTENTAR

            </button>

        </div>
    `;


    if (!mapa) {

        crearMapa(
            17.0672,
            -97.6835,
            true
        );

    }

}


/* =========================
   MAPA
========================= */

function crearMapa(
    lat,
    lng,
    esDemo = false
) {

    if (mapa) {
        mapa.remove();
    }


    mapa = L.map("mapa", {

        zoomControl: false,

        attributionControl: false

    }).setView(
        [lat, lng],
        13
    );


    /*
     * Base vectorial moderna; los marcadores y rutas de Leaflet se
     * conservan por encima de esta capa.
     */
    window.mapa = mapa;
    window.ubicacionUsuario = ubicacionUsuario || { lat, lng };
    window.crearTiendasReales = crearTiendasReales;
    window.obtenerUbicacion = obtenerUbicacion;

    if (window.GoogleMapsMexa && typeof window.GoogleMapsMexa.inicializarCapas === "function") {
        window.GoogleMapsMexa.inicializarCapas(mapa);
        window.GoogleMapsMexa.configurarEventos();
    } else if (typeof L.maplibreGL === "function") {

        L.maplibreGL({
            style: "https://tiles.openfreemap.org/styles/liberty"
        }).addTo(mapa);

    } else {

        L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        {

            maxZoom: 19,

            attribution:
                "Tiles &copy; Esri — Sources: Esri, HERE, Garmin, FAO, NOAA, USGS, &copy; OpenStreetMap contributors"

        }

        ).addTo(mapa);
    }


    if (!esDemo) {

        crearMarcadorUsuario(
            lat,
            lng
        );

        crearTiendasReales(
            lat,
            lng
        );

    } else {

        listaTiendas.innerHTML = `

            <div class="empty-stores">

                <strong>
                    MAPA EN MODO DEMOSTRACIÓN
                </strong>

                <p>
                    Activa el GPS para buscar tiendas Neto reales alrededor de tu ubicación.
                </p>

            </div>

        `;


        storesStatus.innerHTML =
            `<span>Esperando GPS real...</span>`;


        distanciaCercana.textContent =
            "ACTIVA TU GPS";

    }


    setTimeout(
        () => mapa.invalidateSize(),
        150
    );

}


/* =========================
   MARCADOR USUARIO
========================= */

function crearMarcadorUsuario(
    lat,
    lng
) {

    if (
        marcadorUsuario &&
        mapa
    ) {

        mapa.removeLayer(
            marcadorUsuario
        );

    }


    const icono = L.divIcon({

        className:
            "marcador-usuario",

        html:
            `<div class="user-dot"></div>`,

        iconSize:
            [22, 22],

        iconAnchor:
            [11, 11]

    });


    marcadorUsuario =
        L.marker(
            [lat, lng],
            {
                icon: icono
            }
        )
        .addTo(mapa)
        .bindPopup(
            "<strong>⌖ Tú estás aquí</strong>"
        );

}

/* =========================
   TIENDAS NETO
   BASE LOCAL
========================= */

const tiendasNetoZona = [

    {
        id: "neto-tlaxiaco-hidalgo",

        nombre:
            "Neto Tlaxiaco",

        ciudad:
            "Tlaxiaco",

        direccion:
            "C. Hidalgo 17, Centro, Tlaxiaco, Oaxaca",

        lat:
            17.2678,

        lng:
            -97.6790

    },


    {
        id: "neto-tlaxiaco-rafael",

        nombre:
            "Tiendas Neto Tlaxiaco",

        ciudad:
            "Tlaxiaco",

        direccion:
            "Rafael Reyes Espíndola 8, Centro, Tlaxiaco, Oaxaca",

        lat:
            17.2671,

        lng:
            -97.6788

    },


    {
        id: "neto-tlaxiaco-juarez",

        nombre:
            "Tienda Neto Tlaxiaco Juárez 1331",

        ciudad:
            "Tlaxiaco",

        direccion:
            "C. Hipódromo 214B, Centro, Tlaxiaco, Oaxaca",

        lat:
            17.2690,

        lng:
            -97.6778

    },


    {
        id: "neto-chalcatongo-1325",

        nombre:
            "Tienda Neto Chalcatongo 1325",

        ciudad:
            "Chalcatongo de Hidalgo",

        direccion:
            "20 de Noviembre 100, Chalcatongo de Hidalgo, Oaxaca",

        lat:
            17.0292,

        lng:
            -97.5694

    }

];


/* =========================
   BUSCAR TIENDAS NETO
========================= */

async function crearTiendasReales(
    lat,
    lng
) {

    tiendas = [];

    tiendasVisibles = 6;


    storesStatus.innerHTML = `

        <div class="mini-loader"></div>

        <span>
            Localizando tiendas Neto...
        </span>

    `;


    listaTiendas.innerHTML = "";


    distanciaCercana.textContent =
        "BUSCANDO...";


    try {

        /*
         * Consulta puntos de interés de OpenStreetMap alrededor del GPS.
         * Así la búsqueda funciona desde Oaxaca, San Miguel el Grande o
         * cualquier otra ciudad, sin depender de una lista fija.
         */
        const radioMetros = 80000;
        const consulta = `
            [out:json][timeout:25];
            (
                nwr["name"~"Neto", i](around:${radioMetros},${lat},${lng});
                nwr["brand"~"Neto", i](around:${radioMetros},${lat},${lng});
                nwr["operator"~"Neto", i](around:${radioMetros},${lat},${lng});
            );
            out center tags;
        `;

        const respuesta = await fetch(
            "https://overpass-api.de/api/interpreter",
            {
                method: "POST",
                body: consulta
            }
        );

        if (!respuesta.ok) {
            throw new Error(`Servicio de mapas: ${respuesta.status}`);
        }

        const datos = await respuesta.json();

        tiendas = (datos.elements || [])
            .map(elemento => {

                const tags = elemento.tags || {};
                const latitud = elemento.lat ?? elemento.center?.lat;
                const longitud = elemento.lon ?? elemento.center?.lon;

                if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) {
                    return null;
                }

                return {
                    id: `osm-${elemento.type}-${elemento.id}`,
                    nombre: tags.name || tags.brand || "Tienda Neto",
                    ciudad: tags["addr:city"] || tags["addr:town"] || tags["addr:village"] || "",
                    direccion: construirDireccion(tags, latitud, longitud),
                    lat: latitud,
                    lng: longitud,
                    distancia: calcularDistancia(lat, lng, latitud, longitud)
                };
            })
            .filter(Boolean);


        /*
         * Algunas sucursales todavía no están registradas en OpenStreetMap.
         * En ese caso usamos las sucursales verificadas de respaldo, pero
         * únicamente si también están cerca de la posición GPS.
         */
        if (!tiendas.length) {

            tiendas = tiendasNetoZona
                .map(tienda => ({
                    ...tienda,
                    distancia: calcularDistancia(lat, lng, tienda.lat, tienda.lng)
                }))
                .filter(tienda => tienda.distancia <= 80);
        }


    } catch (error) {

        console.warn("No se pudo consultar OpenStreetMap.", error);

        /* Respaldo para demostración sin conexión. */
        tiendas = tiendasNetoZona
            .map(tienda => ({
                ...tienda,
                distancia: calcularDistancia(lat, lng, tienda.lat, tienda.lng)
            }))
            .filter(tienda => tienda.distancia <= 80);
    }


    /*
     * Ordenar por distancia.
     */

    tiendas.sort(
        (a, b) =>
            a.distancia -
            b.distancia
    );


    /*
     * Preparar información.
     */

    tiendas.forEach(
        tienda => {

            tienda.categoria =
                "TIENDA NETO";

            tienda.tiempos =
                calcularTiempos(
                    tienda.distancia
                );

        }
    );

    window.tiendas = tiendas;


    /*
     * Si no hay tiendas.
     */

    if (!tiendas.length) {

        storesStatus.innerHTML = `

            <div class="empty-stores">

                <strong>
                    NO ENCONTRAMOS TIENDAS NETO
                </strong>

                <p>
                    No encontramos tiendas registradas
                    dentro de 80 km de tu ubicación.
                </p>

            </div>

        `;

        listaTiendas.innerHTML = "";

        distanciaCercana.textContent =
            "SIN TIENDAS";

        return;

    }


    /*
     * Actualizar contador.
     */

    cantidadTiendasTexto(
        tiendas.length
    );


    storesStatus.innerHTML = `

        <span>
            ✓ ${tiendas.length}
            tiendas Neto encontradas
        </span>

    `;


    /*
     * Mostrar tarjetas.
     */

    mostrarTiendas();


    /*
     * Mostrar marcadores.
     */

    mostrarMarcadores();


    /*
     * Mostrar distancia más cercana.
     */

    distanciaCercana.textContent =
        `${tiendas[0].distancia.toFixed(2)} KM · MÁS CERCANA`;


    /*
     * Ajustar mapa.
     */

    const puntos = [

        [
            lat,
            lng
        ],

        ...tiendas
            .slice(0, 12)
            .map(
                tienda => [

                    tienda.lat,
                    tienda.lng

                ]
            )

    ];


    if (
        mapa &&
        puntos.length > 1
    ) {

        mapa.fitBounds(
            puntos,
            {

                padding:
                    [45, 45],

                maxZoom:
                    14

            }
        );

    }

}


/* =========================
   DIRECCIÓN
========================= */

function construirDireccion(
    tags,
    lat,
    lng
) {

    const partes = [

        tags["addr:housenumber"],

        tags["addr:street"],

        tags["addr:suburb"],

        tags["addr:city"] ||
        tags["addr:town"] ||
        tags["addr:village"],

        tags["addr:state"]

    ].filter(Boolean);


    return partes.length

        ? partes.join(", ")

        : `Ubicación: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

}


/* =========================
   LISTA SEMANAL
========================= */

const ordenCategoriasLista = [
    "Frutas y verduras",
    "Abarrotes",
    "Lácteos y proteína",
    "Pan y tortillas",
    "Hogar y limpieza",
    "Otros"
];

const iconosCategoriasLista = {
    "Frutas y verduras": "🥬",
    "Abarrotes": "🥫",
    "Lácteos y proteína": "🥛",
    "Pan y tortillas": "🍞",
    "Hogar y limpieza": "🧼",
    "Otros": "🛒"
};

function categoriaDeProducto(producto) {
    if (producto.categoriaLista) return producto.categoriaLista;
    const nombre = String(producto.nombre || "").toLowerCase();

    if (/manzana|plátano|naranja|mandarina|limón|mango|papaya|jitomate|cebolla|papa|zanahoria|aguacate|lechuga/.test(nombre)) {
        return "Frutas y verduras";
    }
    if (/leche|queso|yogurt|huevo|pollo|carne|atún/.test(nombre)) {
        return "Lácteos y proteína";
    }
    if (/pan|tortilla|bolillo|tostadas|conchas|roles|galletas/.test(nombre)) {
        return "Pan y tortillas";
    }
    if (/cloro|limpiador|jabón|esponja|bolsas|papel higiénico|servitoallas|detergente/.test(nombre)) {
        return "Hogar y limpieza";
    }
    if (/frijol|arroz|aceite|azúcar|sal|pasta|avena|puré|café|mayonesa|salsa/.test(nombre)) {
        return "Abarrotes";
    }
    return "Otros";
}

function generarComparativaTiendas(precioBase, nombre = "") {
    const tiendasNombres = [
        "Neto Tlaxiaco Centro",
        "Tiendas Neto Espíndola",
        "Tienda Neto Juárez",
        "Bodega Aurrera"
    ];

    const hash = String(nombre).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const f1 = Number((0.92 + ((hash % 5) * 0.02)).toFixed(2));
    const f2 = Number((0.98 + (((hash * 3) % 4) * 0.02)).toFixed(2));
    const f3 = Number((1.02 + (((hash * 7) % 5) * 0.02)).toFixed(2));
    const f4 = Number((1.14 + (((hash * 11) % 6) * 0.02)).toFixed(2));

    const p1 = Math.round(precioBase * f1 * 10) / 10;
    const p2 = Math.round(precioBase * f2 * 10) / 10;
    const p3 = Math.round(precioBase * f3 * 10) / 10;
    const p4 = Math.round(precioBase * f4 * 10) / 10;

    const lista = [
        { tienda: tiendasNombres[0], precio: p1 },
        { tienda: tiendasNombres[1], precio: p2 },
        { tienda: tiendasNombres[2], precio: p3 },
        { tienda: tiendasNombres[3], precio: p4 }
    ];

    const min = Math.min(...lista.map(item => item.precio));
    const max = Math.max(...lista.map(item => item.precio));

    return lista.map(item => ({
        ...item,
        masBarato: item.precio === min,
        masCaro: item.precio === max
    }));
}

let detallesTiendaAbiertos = {};

function formatearPrecio(precio) {
    return `$${Number(precio).toFixed(2)}`;
}

function renderLista() {
    const cont = document.getElementById("contenidoLista");
    if (!cont) return;

    if (!carrito.length) {
        cont.innerHTML = `
            <div class="lista-vacia">
                <div class="lista-vacia-icono">🛒</div>
                <strong>Tu lista está lista para empezar</strong>
                <p>Presiona el botón <strong>✨ LISTA SEMANAL</strong> para generar tu despensa automática con comparativa de precios, o agrega productos desde el catálogo.</p>
            </div>
        `;
        return;
    }

    const totalProductos = carrito.reduce((suma, producto) => suma + (producto.cantidad || 1), 0);
    const totalPagar = carrito.reduce((suma, producto) => suma + (producto.precio * (producto.cantidad || 1)), 0);

    const ahorroTotal = carrito.reduce((suma, p) => {
        const comp = p.comparativaTiendas || generarComparativaTiendas(p.precio, p.nombre);
        const max = Math.max(...comp.map(t => t.precio));
        const min = Math.min(...comp.map(t => t.precio));
        return suma + Math.max(0, (max - min) * (p.cantidad || 1));
    }, 0);

    const grupos = carrito.reduce((resultado, producto, indice) => {
        const categoria = categoriaDeProducto(producto);
        (resultado[categoria] ||= []).push({ producto, indice });
        return resultado;
    }, {});

    const categorias = ordenCategoriasLista.filter(categoria => grupos[categoria]);

    cont.innerHTML = `
        <div class="lista-categorias">
            ${categorias.map(categoria => `
                <section class="grupo-lista">
                    <h3>${iconosCategoriasLista[categoria] || '🛒'} ${escapeHTML(categoria)} <small>${grupos[categoria].length} productos</small></h3>
                    ${grupos[categoria].map(({ producto, indice }) => {
                        const comp = producto.comparativaTiendas || generarComparativaTiendas(producto.precio, producto.nombre);
                        const tiendaBarata = comp.find(t => t.masBarato) || comp[0];
                        const tiendaCara = comp.find(t => t.masCaro) || comp[comp.length - 1];
                        const tiendaActual = producto.tiendaSeleccionada || (tiendaBarata ? tiendaBarata.tienda : comp[0].tienda);

                        return `
                        <article class="item-lista">
                            <div class="item-lista-icono">
                                ${producto.icono || '🛒'}
                            </div>

                            <div class="item-lista-info">
                                <div class="item-lista-header">
                                    <strong class="item-lista-nombre">${escapeHTML(producto.nombre)}</strong>
                                    ${producto.enOferta ? `
                                        <span class="badge-oferta">
                                            🔥 ${escapeHTML(producto.etiquetaOferta || '¡OFERTA!')}
                                        </span>
                                    ` : ''}
                                </div>

                                <div class="item-lista-meta">
                                    ${producto.caducidad ? `
                                        <span class="badge-caducidad" title="Fecha de caducidad">
                                            📅 Cad: <strong>${escapeHTML(producto.caducidad)}</strong>
                                        </span>
                                    ` : ''}
                                    ${producto.presentacion ? `
                                        <span class="badge-presentacion">${escapeHTML(producto.presentacion)}</span>
                                    ` : ''}
                                </div>

                                <div class="item-lista-precios">
                                    ${producto.enOferta && producto.precioRegular ? `
                                        <span class="precio-tachado">${formatearPrecio(producto.precioRegular)}</span>
                                    ` : ''}
                                    <span class="precio-actual">${formatearPrecio(producto.precio)} c/u</span>
                                    <span class="precio-tienda-elegida" title="Tienda seleccionada para este producto">
                                        🏪 Tienda: <strong>${escapeHTML(tiendaActual)}</strong>
                                    </span>
                                    <span class="precio-subtotal">· Total: <strong>${formatearPrecio(producto.precio * (producto.cantidad || 1))}</strong></span>
                                </div>

                                <div class="comparativa-tiendas-contenedor">
                                    <div class="comparativa-instruccion">
                                        👆 <em>Selecciona la tienda donde deseas comprar este producto:</em>
                                    </div>

                                    <div class="comparativa-resumen">
                                        <button type="button" 
                                            class="tienda-tag tienda-barata ${tiendaActual === tiendaBarata.tienda ? 'tag-activo' : ''}"
                                            onclick="seleccionarTiendaProducto(${indice}, '${escapeJS(tiendaBarata.tienda)}', ${tiendaBarata.precio})"
                                            title="Elegir tienda más barata: ${escapeHTML(tiendaBarata.tienda)} ($${tiendaBarata.precio.toFixed(2)})">
                                            🟢 <strong>Más barato:</strong> ${escapeHTML(tiendaBarata.tienda)} <b class="tag-precio">${formatearPrecio(tiendaBarata.precio)}</b>
                                            ${tiendaActual === tiendaBarata.tienda ? '<span class="tag-check" title="Tienda elegida">✓</span>' : '<span class="tag-accion">Elegir</span>'}
                                        </button>

                                        <button type="button" 
                                            class="tienda-tag tienda-cara ${tiendaActual === tiendaCara.tienda ? 'tag-activo' : ''}"
                                            onclick="seleccionarTiendaProducto(${indice}, '${escapeJS(tiendaCara.tienda)}', ${tiendaCara.precio})"
                                            title="Elegir ${escapeHTML(tiendaCara.tienda)} ($${tiendaCara.precio.toFixed(2)})">
                                            🔴 <strong>Más caro:</strong> ${escapeHTML(tiendaCara.tienda)} <b class="tag-precio">${formatearPrecio(tiendaCara.precio)}</b>
                                            ${tiendaActual === tiendaCara.tienda ? '<span class="tag-check" title="Tienda elegida">✓</span>' : '<span class="tag-accion">Elegir</span>'}
                                        </button>
                                    </div>
                                    
                                    <details class="comparativa-desglose" ${detallesTiendaAbiertos[indice] ? 'open' : ''} ontoggle="detallesTiendaAbiertos[${indice}] = this.open">
                                        <summary>🔍 Comparar y elegir tienda (${comp.length} opciones)</summary>
                                        <div class="comparativa-lista">
                                            ${comp.map(t => {
                                                const esSeleccionada = (t.tienda === tiendaActual);
                                                return `
                                                <button type="button" 
                                                    class="comparativa-fila ${esSeleccionada ? 'fila-seleccionada' : ''} ${t.masBarato ? 'fila-barata' : (t.masCaro ? 'fila-cara' : '')}"
                                                    onclick="seleccionarTiendaProducto(${indice}, '${escapeJS(t.tienda)}', ${t.precio})"
                                                    title="Seleccionar ${escapeHTML(t.tienda)} por ${formatearPrecio(t.precio)}"
                                                >
                                                    <span class="nombre-tienda">
                                                        ${esSeleccionada ? '✓ ' : ''}${t.masBarato ? '🟢 ' : (t.masCaro ? '🔴 ' : '🏪 ')}${escapeHTML(t.tienda)}
                                                    </span>
                                                    <span class="precio-tienda">
                                                        <strong>${formatearPrecio(t.precio)}</strong>
                                                        ${esSeleccionada ? '<span class="tag-seleccionada">Elegida ✓</span>' : (t.masBarato ? '<small class="tag-mejor">Mejor precio</small>' : (t.masCaro ? '<small class="tag-caro">Más caro</small>' : '<small class="tag-elegir">Elegir</small>'))}
                                                    </span>
                                                </button>
                                                `;
                                            }).join("")}
                                        </div>
                                    </details>
                                </div>
                            </div>

                            <div class="item-lista-acciones">
                                <div class="qty" aria-label="Cantidad">
                                    <button type="button" onclick="cambiarCantidad(${indice}, -1)" aria-label="Quitar una unidad">−</button>
                                    <strong>${producto.cantidad || 1}</strong>
                                    <button type="button" onclick="cambiarCantidad(${indice}, 1)" aria-label="Agregar una unidad">+</button>
                                </div>
                                <button class="eliminar-lista" type="button" onclick="eliminarDeLista(${indice})" aria-label="Eliminar ${escapeHTML(producto.nombre)}">×</button>
                            </div>
                        </article>
                        `;
                    }).join("")}
                </section>
            `).join("")}
        </div>

        <div class="total-productos-lista">
            ${ahorroTotal > 0 ? `
                <div class="resumen-ahorro-banner">
                    <div class="icono-ahorro">💡</div>
                    <div class="texto-ahorro">
                        <strong>Comparativa Inteligente de Despensa</strong>
                        <p>Comprando en las tiendas más económicas ahorras aproximadamente <strong>${formatearPrecio(ahorroTotal)}</strong> frente a las opciones más caras.</p>
                    </div>
                </div>
            ` : ''}
            <div class="totales-grid">
                <div>
                    <span>PRODUCTOS EN TU LISTA</span>
                    <strong>${totalProductos} piezas (${carrito.length} artículos)</strong>
                </div>
                <div class="total-pagar-lista">
                    <span>TOTAL ESTIMADO</span>
                    <strong>${formatearPrecio(totalPagar)}</strong>
                </div>
            </div>
        </div>
    `;
}

function seleccionarTiendaProducto(indice, nombreTienda, precioTienda) {
    if (!carrito[indice]) return;

    carrito[indice].tiendaSeleccionada = nombreTienda;
    carrito[indice].precio = Number(precioTienda);

    if (carrito[indice].comparativaTiendas) {
        carrito[indice].comparativaTiendas.forEach(t => {
            t.seleccionada = (t.tienda === nombreTienda);
        });
    }

    guardar();
}

function alternarProductoLista(indice) {
    if (!carrito[indice]) return;
    carrito[indice].comprado = !carrito[indice].comprado;
    guardar();
}

function marcarListaCompleta() {
    const marcar = carrito.some(producto => !producto.comprado);
    carrito.forEach(producto => {
        producto.comprado = marcar;
    });
    guardar();
}

/* =========================
   CANTIDAD
========================= */

function cantidadTiendasTexto(
    cantidad
) {

    const titulo =
        document.querySelector(
            ".stores-head h2"
        );


    if (!titulo) return;


    titulo.innerHTML =
        `TIENDAS NETO <em>CERCA</em>
        <span style="font-size:11px;color:#777">
            (${cantidad})
        </span>`;

}


/* =========================
   DISTANCIA
========================= */

function calcularDistancia(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371;


    const dLat =
        (lat2 - lat1) *
        Math.PI /
        180;


    const dLon =
        (lon2 - lon1) *
        Math.PI /
        180;


    const a =

        Math.sin(
            dLat / 2
        ) ** 2 +

        Math.cos(
            lat1 *
            Math.PI /
            180
        ) *

        Math.cos(
            lat2 *
            Math.PI /
            180
        ) *

        Math.sin(
            dLon / 2
        ) ** 2;


    return R *
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

}


/* =========================
   TIEMPOS
========================= */

function calcularTiempos(
    dist
) {

    const velocidades = {

        pie: 5,

        bicicleta: 15,

        motocicleta: 40,

        auto: 35

    };


    const calc =
        velocidad =>
            Math.max(
                1,
                Math.round(
                    (
                        dist /
                        velocidad
                    ) * 60
                )
            );


    return {

        pie:
            calc(
                velocidades.pie
            ),

        bicicleta:
            calc(
                velocidades.bicicleta
            ),

        motocicleta:
            calc(
                velocidades.motocicleta
            ),

        auto:
            calc(
                velocidades.auto
            )

    };

}


function formatearTiempo(
    min
) {

    if (min < 60)
        return `${min} min`;


    const h =
        Math.floor(
            min / 60
        );


    const m =
        min % 60;


    return m === 0

        ? `${h} h`

        : `${h} h ${m} min`;

}


/* =========================
   MOSTRAR TIENDAS
========================= */

function mostrarTiendas() {

    listaTiendas.innerHTML = "";


    if (!tiendas.length)
        return;


    tiendas
        .slice(
            0,
            tiendasVisibles
        )
        .forEach(
            (t, index) => {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "tarjeta-tienda";


                div.style.animationDelay =
                    `${index * 45}ms`;


                div.innerHTML = `

                    <div class="store-top">

                        <div class="store-icon">
                            N
                        </div>


                        <div class="store-main">

                            <h3>
                                ${escapeHTML(t.nombre)}
                            </h3>

                            <p>
                                📍
                                ${escapeHTML(t.direccion)}
                            </p>

                        </div>


                        <div class="store-distance">

                            <strong>
                                ${t.distancia.toFixed(2)} km
                            </strong>

                            <small>
                                ${
                                    index === 0
                                    ? "MÁS CERCANA"
                                    : "TIENDA REAL"
                                }
                            </small>

                        </div>

                    </div>


                    <div class="store-times">

                        <span>
                            🚶
                            ${formatearTiempo(t.tiempos.pie)}
                        </span>

                        <span>
                            🚗
                            ${formatearTiempo(t.tiempos.auto)}
                        </span>

                        <span>
                            🏍
                            ${formatearTiempo(t.tiempos.motocicleta)}
                        </span>

                        <span>
                            🚲
                            ${formatearTiempo(t.tiempos.bicicleta)}
                        </span>

                    </div>


                    <div class="store-buttons">

                        <button
                            class="btn-route"
                            onclick="verRuta('${t.id}')">

                            ↗ VER RUTA

                        </button>


                        <button
                            class="btn-enter"
                            onclick="entrarTienda('${t.id}')">

                            ENTRAR →

                        </button>

                    </div>

                `;


                listaTiendas
                    .appendChild(div);

            }
        );

}


/* =========================
   MARCADORES TIENDAS
========================= */

function mostrarMarcadores() {

    marcadoresTiendas
        .forEach(
            m =>
                mapa.removeLayer(m)
        );


    marcadoresTiendas = [];


    tiendas.forEach(t => {

        const icono =
            L.divIcon({

                className:
                    "marcador-tienda",

                html:
                    `<div class="store-pin">
                        <span>N</span>
                    </div>`,

                iconSize:
                    [38, 38],

                iconAnchor:
                    [19, 34]

            });


        const marcador =
            L.marker(
                [
                    t.lat,
                    t.lng
                ],
                {
                    icon: icono
                }
            )
            .addTo(mapa);


        marcador.bindPopup(`

            <div
                style="
                    font-family:Inter,sans-serif;
                    min-width:180px
                "
            >

                <strong>
                    ${escapeHTML(t.nombre)}
                </strong>

                <br>

                <small>
                    ${escapeHTML(t.direccion)}
                </small>

                <br><br>

                📏
                ${t.distancia.toFixed(2)}
                km

                <br>

                🚶
                ${formatearTiempo(
                    t.tiempos.pie
                )}

                <br>

                🚗
                ${formatearTiempo(
                    t.tiempos.auto
                )}

                <br><br>

                <button
                    onclick="verRuta('${t.id}')"
                    style="
                        width:100%;
                        padding:9px;
                        border:0;
                        background:#111820;
                        color:white;
                        font-weight:800;
                        border-radius:6px
                    "
                >

                    VER RUTA REAL

                </button>

            </div>

        `);


        marcadoresTiendas
            .push(marcador);

    });

}


/* =========================
   RUTA REAL
========================= */

async function verRuta(id) {

    const tienda =
        tiendas.find(
            t =>
                String(t.id) ===
                String(id)
        );


    if (
        !tienda ||
        !ubicacionUsuario
    ) {

        alert(
            "Necesitamos tu ubicación GPS para calcular una ruta."
        );

        return;

    }


    limpiarRuta();


    try {

        storesStatus.innerHTML = `

            <div class="mini-loader"></div>

            <span>
                Calculando ruta real por calles...
            </span>

        `;


        const url =

            `https://router.project-osrm.org/route/v1/driving/` +

            `${ubicacionUsuario.lng},${ubicacionUsuario.lat};` +

            `${tienda.lng},${tienda.lat}` +

            `?overview=full&geometries=geojson`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "No se pudo consultar OSRM."
            );

        }


        const data =
            await response.json();


        if (
            !data.routes?.length
        ) {

            throw new Error(
                "No existe una ruta."
            );

        }


        const ruta =
            data.routes[0];


        const distanciaReal =
            ruta.distance / 1000;


        const duracionAuto =
            Math.round(
                ruta.duration / 60
            );


        rutaActual =
            L.geoJSON(
                ruta.geometry,
                {

                    style: {

                        color:
                            "#ff4b12",

                        weight:
                            7,

                        opacity:
                            .95

                    }

                }
            ).addTo(mapa);


        const inicio =
            L.marker(
                [
                    ubicacionUsuario.lat,
                    ubicacionUsuario.lng
                ]
            )
            .addTo(mapa)
            .bindPopup(
                "⌖ Tu ubicación"
            );


        const destino =
            L.marker(
                [
                    tienda.lat,
                    tienda.lng
                ]
            )
            .addTo(mapa)
            .bindPopup(
                escapeHTML(
                    tienda.nombre
                )
            );


        marcadoresRuta.push(
            inicio,
            destino
        );


        mapa.fitBounds(
            rutaActual.getBounds(),
            {
                padding:
                    [70, 70],

                maxZoom:
                    16
            }
        );


        const tiempos =
            calcularTiempos(
                distanciaReal
            );


        const panel =
            L.control({
                position:
                    "topright"
            });


        panel.onAdd =
            () => {

                const div =
                    L.DomUtil.create(
                        "div",
                        "panel-ruta"
                    );


                div.innerHTML = `

                    <div class="titulo-ruta">

                        <span>
                            RUTA REAL POR CALLES
                        </span>

                        <button
                            onclick="cerrarRuta()"
                        >
                            ×
                        </button>

                    </div>


                    <div class="nombre-ruta">

                        🏪
                        ${escapeHTML(
                            tienda.nombre
                        )}

                    </div>


                    <div
                        style="
                            padding:0 14px 8px;
                            font-size:8px;
                            color:#666
                        "
                    >

                        ${escapeHTML(
                            tienda.direccion
                        )}

                    </div>


                    <div class="datos-ruta">

                        <div>

                            📏

                            <strong>
                                ${distanciaReal.toFixed(2)}
                                km
                            </strong>

                            <br>

                            <small>
                                distancia real
                            </small>

                        </div>


                        <div>

                            🚗

                            <strong>
                                ${formatearTiempo(
                                    duracionAuto
                                )}
                            </strong>

                            <br>

                            <small>
                                en auto
                            </small>

                        </div>

                    </div>


                    <div class="modos-ruta">

                        <span>
                            🚶
                            <br>
                            A PIE
                            <br>
                            ${formatearTiempo(
                                tiempos.pie
                            )}
                        </span>


                        <span>
                            🚗
                            <br>
                            AUTO
                            <br>
                            ${formatearTiempo(
                                duracionAuto
                            )}
                        </span>


                        <span>
                            🏍
                            <br>
                            MOTO
                            <br>
                            ${formatearTiempo(
                                tiempos.motocicleta
                            )}
                        </span>


                        <span>
                            🚲
                            <br>
                            BICI
                            <br>
                            ${formatearTiempo(
                                tiempos.bicicleta
                            )}
                        </span>

                    </div>

                `;


                return div;

            };


        panel.addTo(mapa);

        window.panelRutaActual =
            panel;


        storesStatus.innerHTML =
            `<span>✓ Ruta calculada por calles</span>`;


    } catch (error) {

        console.error(error);


        storesStatus.innerHTML =
            `<span>No se pudo calcular la ruta.</span>`;


        alert(
            "No se pudo calcular la ruta real por calles en este momento."
        );

    }

}


/* =========================
   CERRAR RUTA
========================= */

function cerrarRuta() {

    limpiarRuta();


    if (
        ubicacionUsuario &&
        mapa
    ) {

        mapa.flyTo(

            [
                ubicacionUsuario.lat,
                ubicacionUsuario.lng
            ],

            13,

            {
                duration: 1
            }

        );

    }


    storesStatus.innerHTML =
        tiendas.length

            ? `<span>✓ ${tiendas.length} tiendas encontradas con datos reales</span>`

            : `<span>Esperando tiendas...</span>`;

}


/* =========================
   LIMPIAR RUTA
========================= */

function limpiarRuta() {

    if (
        rutaActual &&
        mapa
    ) {

        mapa.removeLayer(
            rutaActual
        );

    }


    rutaActual = null;


    marcadoresRuta
        .forEach(m => {

            if (mapa) {

                mapa.removeLayer(m);

            }

        });


    marcadoresRuta = [];


    if (
        window.panelRutaActual &&
        mapa
    ) {

        mapa.removeControl(
            window.panelRutaActual
        );

        window.panelRutaActual =
            null;

    }

}


/* =========================
   NOMBRE DE UBICACIÓN
========================= */

async function obtenerNombreLugar(
    lat,
    lon
) {

    try {

        const url =

            `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +

            `&lat=${lat}` +

            `&lon=${lon}` +

            `&zoom=10` +

            `&accept-language=es`;


        const response =
            await fetch(url);


        const data =
            await response.json();


        const a =
            data.address || {};


        const lugar =

            a.city ||

            a.town ||

            a.village ||

            a.municipality ||

            a.county ||

            "Ubicación detectada";


        estadoUbicacion.textContent =
            lugar.toUpperCase();


    } catch (error) {

        estadoUbicacion.textContent =
            "GPS ACTIVO";

    }

}
/* =========================
   CATÁLOGO
========================= */

function entrarTienda(id) {

    const tienda =
        tiendas.find(
            t =>
                String(t.id) ===
                String(id)
        );

    if (!tienda)
        return;

    abrirCatalogo(tienda);
}


/* =========================
   ABRIR CATÁLOGO
========================= */

function abrirCatalogo(tienda) {

    let catalogo =
        document.getElementById(
            "catalogoTienda"
        );

    if (!catalogo) {

        catalogo =
            document.createElement(
                "div"
            );

        catalogo.id =
            "catalogoTienda";

        catalogo.className =
            "ventana-modal";

        document.body.appendChild(
            catalogo
        );

    }


    /* Cancelar animación anterior */

    if (catalogo._timer) {
        clearTimeout(
            catalogo._timer
        );
    }


    /* =========================
       ANIMACIÓN DE ENTRADA
    ========================= */

    catalogo.innerHTML = `

        <div class="catalogo-loading">

            <div class="catalogo-loading-icon">
                🛒
            </div>

            <div class="catalogo-loading-titulo">
                ABRIENDO CATÁLOGO
            </div>

            <div class="catalogo-loading-bar">

                <div></div>

            </div>

            <div class="catalogo-loading-texto">
                Preparando productos...
            </div>

        </div>

    `;


    catalogo.classList.add(
        "activa"
    );


    /* =========================
       DESPUÉS DE LA ANIMACIÓN
    ========================= */

    catalogo._timer =
        setTimeout(() => {

            mostrarContenidoCatalogo(
                catalogo,
                tienda
            );

        }, 1300);

}


/* =========================
   CONTENIDO DEL CATÁLOGO
========================= */

function mostrarContenidoCatalogo(
    catalogo,
    tienda
) {

    const categorias =
        getCategoriasBase();


    catalogo.innerHTML = `

        <div
            class="contenido-modal catalogo-modal"
        >

            <button
                class="cerrar-modal"
                onclick="cerrarCatalogo()"
            >
                ×
            </button>


            <!-- ENCABEZADO -->

            <div class="catalogo-encabezado">

                <div class="catalogo-logo">
                    Neto
                </div>

                <div>

                    <span class="section-label">
                        CATÁLOGO
                    </span>

                    <h2>
                        ${escapeHTML(
                            tienda.nombre
                        )}
                    </h2>

                    <p class="catalogo-direccion">

                        📍
                        ${escapeHTML(
                            tienda.direccion
                        )}

                        ·

                        ${Number(
                            tienda.distancia
                        ).toFixed(2)}
                        km

                    </p>

                </div>

            </div>


            <!-- CATEGORÍAS -->

            <div class="categorias-catalogo">

                ${categorias.map(
                    (categoria, index) => `

                    <button
                        type="button"
                        class="categoria-btn"
                        onclick="
                            mostrarCategoria(
                                ${index},
                                this
                            )
                        "
                    >

                        <span>
                            ${categoria.icono}
                        </span>

                        ${categoria.nombre}

                    </button>

                `
                ).join("")}

            </div>


            <!-- PRODUCTOS -->

            <div
                id="catalogoProductos"
                class="catalogo-productos-vacio"
            >

                <div class="catalogo-seleccion">

                    <div class="catalogo-seleccion-icono">
                        🛍️
                    </div>

                    <strong>
                        SELECCIONA UNA CATEGORÍA
                    </strong>

                    <span>
                        Elige una categoría para ver
                        los productos disponibles.
                    </span>

                </div>

            </div>

        </div>

    `;

}


/* =========================
   MOSTRAR CATEGORÍA
========================= */

function mostrarCategoria(
    index,
    btn
) {

    const categorias =
        getCategoriasBase();

    const categoria =
        categorias[index];


    if (!categoria)
        return;


    /* Quitar selección */

    document
        .querySelectorAll(
            ".categoria-btn"
        )
        .forEach(b => {

            b.classList.remove(
                "categoria-activa"
            );

        });


    /* Activar categoría */

    btn.classList.add(
        "categoria-activa"
    );


    const contenedor =
        document.getElementById(
            "catalogoProductos"
        );


    if (!contenedor)
        return;


    contenedor.className =
        "catalogo-productos";


    contenedor.innerHTML =
        crearProductosHTML(
            categoria
        );

}


/* =========================
   CREAR PRODUCTOS
========================= */

function crearProductosHTML(
    categoria
) {

    if (
        !categoria ||
        !categoria.productos ||
        !categoria.productos.length
    ) {

        return `

            <div class="empty-stores">

                <strong>
                    NO HAY PRODUCTOS
                </strong>

                <p>
                    No hay productos disponibles.
                </p>

            </div>

        `;

    }


    return categoria.productos
        .map(
            (producto, index) => {

                const favoritos =
                    obtenerFavoritos();

                const favorito =
                    favoritos.includes(
                        producto.nombre
                    );


                return `

                    <div
                        class="producto-catalogo"
                        style="
                            animation-delay:
                            ${index * 65}ms
                        "
                    >

                        <!-- IMAGEN / STICKER -->

                        <div
                            class="producto-imagen"
                        >

                            <div
                                class="
                                    producto-sticker
                                "
                            >
                                ${producto.icono}
                            </div>


                            <!-- CORAZÓN -->

                            <button
                                type="button"
                                class="
                                    producto-favorito
                                    ${favorito
                                        ? "favorito-activo"
                                        : ""
                                    }
                                "
                                onclick="
                                    toggleFavorito(
                                        '${escapeJS(
                                            producto.nombre
                                        )}',
                                        this
                                    )
                                "
                                title="Agregar a favoritos"
                            >

                                ${favorito
                                    ? "♥"
                                    : "♡"
                                }

                            </button>

                        </div>


                        <!-- INFORMACIÓN -->

                        <div
                            class="producto-info"
                        >

                            <strong
                                class="
                                    producto-nombre
                                "
                            >

                                ${escapeHTML(
                                    producto.nombre
                                )}

                            </strong>


                            <span
                                class="
                                    producto-presentacion
                                "
                            >

                                ${escapeHTML(
                                    producto.presentacion
                                    || producto.desc
                                    || ""
                                )}

                            </span>


                            <!-- PRECIO -->

                            <div
                                class="producto-precio"
                            >

                                $${Number(
                                    producto.precio
                                ).toFixed(2)}

                            </div>


                            <!-- ESTRELLAS -->

                            <div
                                class="
                                    producto-calificacion
                                "
                            >

                                <span>
                                    ★★★★★
                                </span>

                                <small>
                                    (${producto.resenas || 120})
                                </small>

                            </div>


                            <!-- CADUCIDAD -->

                            <div
                                class="
                                    producto-caducidad
                                "
                            >

                                📅 CAD

                                <strong>
                                    ${escapeHTML(
                                        producto.caducidad
                                    )}
                                </strong>

                            </div>


                            <!-- LOTE -->

                            <div
                                class="producto-lote"
                            >

                                LOTE:

                                ${escapeHTML(
                                    producto.lote
                                )}

                            </div>


                            <!-- AGREGAR -->

                            <button
                                type="button"
                                class="
                                    btn-naranja
                                    producto-agregar
                                "
                                onclick="
                                    agregarProductoCatalogo(
                                        '${escapeJS(
                                            producto.nombre
                                        )}',
                                        ${Number(
                                            producto.precio
                                        )}
                                    )
                                "
                            >

                                🛒 AGREGAR

                            </button>

                        </div>

                    </div>

                `;

            }
        )
        .join("");

}


/* =========================
   AGREGAR PRODUCTO
========================= */

function agregarProductoCatalogo(
    nombre,
    precio
) {

    agregarAlCarrito(
        nombre,
        precio
    );


    mostrarMensajeCatalogo(
        `✓ ${nombre} fue agregado correctamente`
    );

}


/* =========================
   FAVORITOS
========================= */

function obtenerFavoritos() {

    return JSON.parse(
        localStorage.getItem(
            "favoritosMexa"
        ) || "[]"
    );

}


function toggleFavorito(
    nombre,
    boton
) {

    let favoritos =
        obtenerFavoritos();


    const existe =
        favoritos.includes(
            nombre
        );


    if (existe) {

        favoritos =
            favoritos.filter(
                favorito =>
                    favorito !==
                    nombre
            );

        boton.classList.remove(
            "favorito-activo"
        );

        boton.textContent =
            "♡";


        mostrarMensajeFavorito(
            `♡ ${nombre} fue eliminado de favoritos`
        );


    } else {

        favoritos.push(
            nombre
        );


        boton.classList.add(
            "favorito-activo"
        );

        boton.textContent =
            "♥";


        mostrarMensajeFavorito(
            `♥ ${nombre} fue agregado a favoritos`
        );

    }


    localStorage.setItem(
        "favoritosMexa",
        JSON.stringify(
            favoritos
        )
    );

    const modalFav = document.getElementById("modalFavoritos");
    if (modalFav && modalFav.classList.contains("activa")) {
        renderFavoritos();
    }
}


/* =====================================================
   SECCIÓN Y MODAL DE FAVORITOS
===================================================== */

function obtenerTodosLosProductos() {
    const categorias = getCategoriasBase();
    const productos = [];
    const nombresVistos = new Set();

    categorias.forEach(cat => {
        (cat.productos || []).forEach(p => {
            if (!nombresVistos.has(p.nombre)) {
                nombresVistos.add(p.nombre);
                productos.push(p);
            }
        });
    });

    return productos;
}

function abrirFavoritos(conAnimacion = true) {
    let modal = document.getElementById("modalFavoritos");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modalFavoritos";
        modal.className = "ventana-modal";
        document.body.appendChild(modal);

        modal.addEventListener("click", e => {
            if (e.target === modal) {
                cerrarFavoritos();
            }
        });
    }

    let cargando = document.getElementById("loadingFavoritos");
    if (!cargando) {
        cargando = document.createElement("div");
        cargando.id = "loadingFavoritos";
        cargando.className = "ventana-modal";
        document.body.appendChild(cargando);

        cargando.addEventListener("click", e => {
            if (e.target === cargando) {
                if (cargando._timer) clearTimeout(cargando._timer);
                cargando.classList.remove("activa");
            }
        });
    }

    if (cargando._timer) {
        clearTimeout(cargando._timer);
    }

    renderFavoritos();

    if (!conAnimacion) {
        modal.classList.add("activa");
        return;
    }

    modal.classList.remove("activa");

    cargando.innerHTML = `
        <div class="catalogo-loading">
            <div class="catalogo-loading-icon" style="background:transparent;box-shadow:none;border-radius:0;font-size:72px;filter:drop-shadow(0 6px 14px rgba(255,49,91,.25));animation:corazonLatido .75s infinite alternate ease-in-out;">
                ❤️
            </div>
            <div class="catalogo-loading-titulo">
                ABRIENDO FAVORITOS
            </div>
            <div class="catalogo-loading-bar">
                <div style="background:#ff315b;"></div>
            </div>
            <div class="catalogo-loading-texto">
                Preparando tus favoritos...
            </div>
        </div>
    `;

    cargando.classList.add("activa");

    cargando._timer = setTimeout(() => {
        cargando.classList.remove("activa");
        modal.classList.add("activa");
    }, 1250);
}

function cerrarFavoritos() {
    const modal = document.getElementById("modalFavoritos");
    if (modal) {
        modal.classList.remove("activa");
    }
}

function renderFavoritos() {
    const modal = document.getElementById("modalFavoritos");
    if (!modal) return;

    const favoritosNombres = obtenerFavoritos();
    const todosLosProductos = obtenerTodosLosProductos();
    const productosFavoritos = todosLosProductos.filter(p => favoritosNombres.includes(p.nombre));

    if (!productosFavoritos.length) {
        modal.innerHTML = `
            <div class="contenido-modal lista-modal" style="text-align:center;">
                <button class="cerrar-modal" onclick="cerrarFavoritos()" type="button">×</button>
                <span class="section-label" style="color:#ff315b;">TUS PREFERIDOS</span>
                <h2 style="margin:8px 0 16px;">❤️ MIS FAVORITOS</h2>
                <div class="lista-vacia" style="margin-top:10px;">
                    <div class="lista-vacia-icono" style="background:#ffe8ee;font-size:24px;">❤️</div>
                    <strong>Aún no tienes productos favoritos</strong>
                    <p>Explora el catálogo y presiona el corazón en los productos que más te gusten para tenerlos guardados aquí.</p>
                    <button class="btn-naranja" style="margin-top:16px;min-height:36px;padding:0 20px;" onclick="cerrarFavoritos(); entrarTiendaDemo();" type="button">
                        🛍️ EXPLORAR CATÁLOGO
                    </button>
                </div>
            </div>
        `;
        return;
    }

    modal.innerHTML = `
        <div class="contenido-modal catalogo-modal favoritos-modal">
            <button class="cerrar-modal" onclick="cerrarFavoritos()" type="button">×</button>

            <div class="catalogo-encabezado" style="margin-bottom:14px;">
                <div class="catalogo-logo" style="background:#ff315b;box-shadow:0 6px 15px rgba(255,49,91,.25);">
                    ❤️
                </div>
                <div>
                    <span class="section-label" style="color:#ff315b;">TUS PREFERIDOS</span>
                    <h2>MIS FAVORITOS (${productosFavoritos.length})</h2>
                    <p class="catalogo-direccion">
                        Productos guardados para agregarlos rápidamente a tu lista de compra.
                    </p>
                </div>
            </div>

            <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
                <button type="button" class="btn-naranja" style="padding:10px 18px;font-size:10px;font-weight:900;border-radius:8px;" onclick="agregarTodosFavoritos()">
                    🛒 AGREGAR TODOS A MI LISTA
                </button>
                <button type="button" class="btn-outline" style="padding:10px 18px;font-size:10px;font-weight:900;border-radius:8px;" onclick="vaciarFavoritos()">
                    🗑️ VACIAR FAVORITOS
                </button>
            </div>

            <div class="catalogo-productos">
                ${crearProductosFavoritosHTML(productosFavoritos)}
            </div>
        </div>
    `;
}

function entrarTiendaDemo() {
    if (tiendas.length > 0) {
        entrarTienda(tiendas[0].id);
    } else {
        const cat = document.querySelector(".nav-item[data-target='catalogo']");
        if (cat) cat.click();
    }
}

function crearProductosFavoritosHTML(productos) {
    return productos.map((producto, index) => {
        return `
            <div
                class="producto-catalogo"
                style="animation-delay: ${index * 40}ms"
            >
                <div class="producto-imagen">
                    <div class="producto-sticker">
                        ${producto.icono}
                    </div>

                    <button
                        type="button"
                        class="producto-favorito favorito-activo"
                        onclick="toggleFavorito('${escapeJS(producto.nombre)}', this)"
                        title="Quitar de favoritos"
                    >
                        ♥
                    </button>
                </div>

                <div class="producto-info">
                    <strong class="producto-nombre">
                        ${escapeHTML(producto.nombre)}
                    </strong>

                    <span class="producto-presentacion">
                        ${escapeHTML(producto.presentacion || producto.desc || "")}
                    </span>

                    <div class="producto-precio">
                        $${Number(producto.precio).toFixed(2)}
                    </div>

                    <div class="producto-calificacion">
                        <span>★★★★★</span>
                        <small>(${producto.resenas || 120})</small>
                    </div>

                    <div class="producto-caducidad">
                        📅 CAD <strong>${escapeHTML(producto.caducidad)}</strong>
                    </div>

                    <div class="producto-lote">
                        LOTE: ${escapeHTML(producto.lote)}
                    </div>

                    <button
                        type="button"
                        class="btn-naranja producto-agregar"
                        onclick="agregarProductoCatalogo('${escapeJS(producto.nombre)}', ${Number(producto.precio)})"
                    >
                        🛒 AGREGAR
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

function agregarTodosFavoritos() {
    const todos = obtenerTodosLosProductos();
    const favoritos = obtenerFavoritos();
    const prods = todos.filter(p => favoritos.includes(p.nombre));

    if (!prods.length) return;

    prods.forEach(p => {
        const existente = carrito.find(item => item.nombre === p.nombre);
        if (existente) {
            existente.cantidad++;
        } else {
            carrito.push({
                nombre: p.nombre,
                precio: p.precio,
                cantidad: 1,
                comprado: false
            });
        }
    });

    guardar();
    mostrarNotificacionCatalogo("🛒", "¡AGREGADOS A TU LISTA!", `${prods.length} productos fueron agregados a tu lista.`);
}

function vaciarFavoritos() {
    localStorage.setItem("favoritosMexa", JSON.stringify([]));
    renderFavoritos();
    mostrarNotificacionCatalogo("🗑️", "FAVORITOS VACIADOS", "Se eliminaron todos los productos de favoritos.");
}


/* =========================
   MENSAJE PRODUCTO
========================= */

function mostrarMensajeCatalogo(
    mensaje
) {

    mostrarNotificacionCatalogo(
        "✓",
        "¡PRODUCTO AGREGADO CORRECTAMENTE!",
        mensaje
    );

}


/* =========================
   MENSAJE FAVORITO
========================= */

function mostrarMensajeFavorito(
    mensaje
) {

    mostrarNotificacionCatalogo(
        "♥",
        "¡AGREGADO A FAVORITOS!",
        mensaje
    );

}


/* =========================
   NOTIFICACIÓN
========================= */

function mostrarNotificacionCatalogo(
    icono,
    titulo,
    texto
) {

    const anterior =
        document.querySelector(
            ".mensaje-producto-agregado"
        );


    if (anterior) {

        anterior.remove();

    }


    const mensajeDiv =
        document.createElement(
            "div"
        );


    mensajeDiv.className =
        "mensaje-producto-agregado";


    mensajeDiv.innerHTML = `

        <div
            class="
                mensaje-producto-icono
            "
        >
            ${icono}
        </div>

        <div>

            <strong>
                ${titulo}
            </strong>

            <span>
                ${escapeHTML(
                    texto
                )}
            </span>

        </div>

    `;


    document.body.appendChild(
        mensajeDiv
    );


    setTimeout(() => {

        mensajeDiv.classList.add(
            "mostrar"
        );

    }, 20);


    setTimeout(() => {

        mensajeDiv.classList.remove(
            "mostrar"
        );


        setTimeout(() => {

            mensajeDiv.remove();

        }, 300);

    }, 2500);

}


/* =========================
   CERRAR CATÁLOGO
========================= */

function cerrarCatalogo() {

    const catalogo =
        document.getElementById(
            "catalogoTienda"
        );


    if (!catalogo)
        return;


    if (catalogo._timer) {

        clearTimeout(
            catalogo._timer
        );

    }


    catalogo.classList.remove(
        "activa"
    );

}


/* =========================
   CREAR PRODUCTO
========================= */

function productoCatalogo(
    nombre,
    precio,
    presentacion,
    caducidad,
    lote,
    icono,
    resenas
) {

    return {

        nombre,

        precio,

        presentacion,

        desc:
            presentacion,

        caducidad,

        lote,

        icono,

        resenas:
            resenas || 120

    };

}


/* =========================
   CATEGORÍAS
   13 PRODUCTOS CADA UNA
========================= */

function getCategoriasBase() {

    return [

        /* =========================
           ABARROTES - 13
        ========================= */

        {
            nombre:
                "ABARROTES",

            icono:
                "🥫",

            productos: [

                productoCatalogo(
                    "Frijol Negro 900g",
                    32,
                    "Bolsa 900 g",
                    "12/12/2026",
                    "L-8841",
                    "🫘",
                    245
                ),

                productoCatalogo(
                    "Arroz Morelos 1kg",
                    35,
                    "Bolsa 1 kg",
                    "08/03/2027",
                    "L-9021",
                    "🍚",
                    198
                ),

                productoCatalogo(
                    "Aceite Vegetal 1L",
                    48,
                    "Botella 1 L",
                    "15/01/2027",
                    "L-1120",
                    "🫗",
                    176
                ),

                productoCatalogo(
                    "Azúcar Estándar 1kg",
                    29,
                    "Bolsa 1 kg",
                    "20/08/2027",
                    "A-2231",
                    "🍬",
                    143
                ),

                productoCatalogo(
                    "Sal de Mesa 1kg",
                    18,
                    "Bolsa 1 kg",
                    "14/05/2028",
                    "S-3412",
                    "🧂",
                    112
                ),

                productoCatalogo(
                    "Atún en Agua 140g",
                    22,
                    "Lata 140 g",
                    "10/11/2028",
                    "AT-5541",
                    "🐟",
                    221
                ),

                productoCatalogo(
                    "Sopa Instantánea Pollo 85g",
                    12,
                    "Vaso 85 g",
                    "18/09/2027",
                    "SP-1182",
                    "🍜",
                    245
                ),

                productoCatalogo(
                    "Pasta Spaghetti 200g",
                    17,
                    "Paquete 200 g",
                    "22/06/2028",
                    "PS-2201",
                    "🍝",
                    189
                ),

                productoCatalogo(
                    "Avena 400g",
                    28,
                    "Bolsa 400 g",
                    "14/02/2028",
                    "AV-402",
                    "🌾",
                    134
                ),

                productoCatalogo(
                    "Mayonesa 390g",
                    39,
                    "Frasco 390 g",
                    "05/07/2027",
                    "MY-390",
                    "🥚",
                    167
                ),

                productoCatalogo(
                    "Salsa Cátsup 397g",
                    31,
                    "Botella 397 g",
                    "12/08/2027",
                    "SC-397",
                    "🍅",
                    154
                ),

                productoCatalogo(
                    "Puré de Tomate 210g",
                    14,
                    "Lata 210 g",
                    "18/10/2028",
                    "PT-210",
                    "🍅",
                    98
                ),

                productoCatalogo(
                    "Café Soluble 100g",
                    58,
                    "Frasco 100 g",
                    "22/04/2028",
                    "CF-100",
                    "☕",
                    203
                )

            ]
        },


        /* =========================
           LÁCTEOS - 13
        ========================= */

        {
            nombre:
                "LÁCTEOS",

            icono:
                "🥛",

            productos: [

                productoCatalogo(
                    "Leche Entera Neto 1L",
                    26,
                    "Envase 1 L",
                    "20/11/2026",
                    "L-5512",
                    "🥛",
                    201
                ),

                productoCatalogo(
                    "Leche Deslactosada 1L",
                    29,
                    "Envase 1 L",
                    "25/11/2026",
                    "LD-4310",
                    "🥛",
                    187
                ),

                productoCatalogo(
                    "Leche Light 1L",
                    28,
                    "Envase 1 L",
                    "22/11/2026",
                    "LL-2201",
                    "🥛",
                    143
                ),

                productoCatalogo(
                    "Queso Oaxaca 400g",
                    68,
                    "Paquete 400 g",
                    "05/12/2026",
                    "L-5518",
                    "🧀",
                    178
                ),

                productoCatalogo(
                    "Queso Panela 400g",
                    62,
                    "Paquete 400 g",
                    "08/12/2026",
                    "QP-4418",
                    "🧀",
                    165
                ),

                productoCatalogo(
                    "Yogurt Natural 1kg",
                    38,
                    "Envase 1 kg",
                    "28/11/2026",
                    "L-5520",
                    "🥛",
                    143
                ),

                productoCatalogo(
                    "Yogurt Fresa 1kg",
                    42,
                    "Envase 1 kg",
                    "27/11/2026",
                    "YF-3312",
                    "🍓",
                    190
                ),

                productoCatalogo(
                    "Crema Ácida 450ml",
                    35,
                    "Envase 450 ml",
                    "30/11/2026",
                    "CR-7721",
                    "🥛",
                    122
                ),

                productoCatalogo(
                    "Mantequilla 90g",
                    31,
                    "Barra 90 g",
                    "18/01/2027",
                    "MA-8820",
                    "🧈",
                    156
                ),

                productoCatalogo(
                    "Margarina 225g",
                    25,
                    "Barra 225 g",
                    "16/03/2027",
                    "MG-225",
                    "🧈",
                    109
                ),

                productoCatalogo(
                    "Huevo Blanco 18 Piezas",
                    52,
                    "Cartón 18 piezas",
                    "15/12/2026",
                    "HB-018",
                    "🥚",
                    198
                ),

                productoCatalogo(
                    "Bebida Láctea Chocolate 1L",
                    34,
                    "Envase 1 L",
                    "29/11/2026",
                    "BC-100",
                    "🥛",
                    132
                ),

                productoCatalogo(
                    "Requesón 300g",
                    44,
                    "Envase 300 g",
                    "06/12/2026",
                    "RQ-300",
                    "🧀",
                    87
                )

            ]
        },


        /* =========================
           BEBIDAS - 13
        ========================= */

        {
            nombre:
                "BEBIDAS",

            icono:
                "🥤",

            productos: [

                productoCatalogo(
                    "Refresco Cola 3L",
                    35,
                    "Botella 3 L",
                    "10/06/2027",
                    "B-101",
                    "🥤",
                    276
                ),

                productoCatalogo(
                    "Agua Purificada 1.5L",
                    14,
                    "Botella 1.5 L",
                    "10/06/2028",
                    "B-102",
                    "💧",
                    198
                ),

                productoCatalogo(
                    "Jumex Mango 450ml",
                    18,
                    "Botella 450 ml",
                    "15/04/2027",
                    "JM-451",
                    "🥭",
                    189
                ),

                productoCatalogo(
                    "Agua Natural 1L",
                    11,
                    "Botella 1 L",
                    "21/07/2028",
                    "AN-321",
                    "💧",
                    145
                ),

                productoCatalogo(
                    "Refresco Manzana 600ml",
                    19,
                    "Botella 600 ml",
                    "02/08/2027",
                    "RM-602",
                    "🍎",
                    176
                ),

                productoCatalogo(
                    "Bebida de Naranja 1L",
                    24,
                    "Envase 1 L",
                    "19/05/2027",
                    "NA-100",
                    "🍊",
                    134
                ),

                productoCatalogo(
                    "Agua Mineral 600ml",
                    16,
                    "Botella 600 ml",
                    "12/10/2027",
                    "AM-612",
                    "💧",
                    121
                ),

                productoCatalogo(
                    "Jugo de Naranja 1L",
                    32,
                    "Envase 1 L",
                    "05/02/2027",
                    "JO-778",
                    "🍊",
                    203
                ),

                productoCatalogo(
                    "Néctar de Mango 1L",
                    27,
                    "Envase 1 L",
                    "18/04/2027",
                    "NM-100",
                    "🥭",
                    166
                ),

                productoCatalogo(
                    "Té de Limón 1.5L",
                    25,
                    "Botella 1.5 L",
                    "20/05/2027",
                    "TL-150",
                    "🍋",
                    115
                ),

                productoCatalogo(
                    "Bebida de Jamaica 1L",
                    24,
                    "Envase 1 L",
                    "16/05/2027",
                    "BJ-100",
                    "🌺",
                    104
                ),

                productoCatalogo(
                    "Bebida de Horchata 1L",
                    26,
                    "Envase 1 L",
                    "17/05/2027",
                    "BH-100",
                    "🥛",
                    98
                ),

                productoCatalogo(
                    "Café Frío 450ml",
                    29,
                    "Botella 450 ml",
                    "09/04/2027",
                    "CF-450",
                    "☕",
                    142
                )

            ]
        },


        /* =========================
           PAN Y TORTILLAS - 13
        ========================= */

        {
            nombre:
                "PAN Y TORTILLAS",

            icono:
                "🍞",

            productos: [

                productoCatalogo(
                    "Pan Blanco Grande",
                    42,
                    "Pan de caja 680 g",
                    "18/11/2026",
                    "P-201",
                    "🍞",
                    167
                ),

                productoCatalogo(
                    "Pan Integral 680g",
                    48,
                    "Pan de caja integral",
                    "20/11/2026",
                    "PI-301",
                    "🍞",
                    156
                ),

                productoCatalogo(
                    "Pan Dulce Surtido",
                    38,
                    "Caja surtida",
                    "17/11/2026",
                    "PD-442",
                    "🥐",
                    188
                ),

                productoCatalogo(
                    "Bolillo 6 Piezas",
                    28,
                    "Paquete 6 piezas",
                    "15/11/2026",
                    "BO-602",
                    "🥖",
                    142
                ),

                productoCatalogo(
                    "Tostadas de Maíz 300g",
                    31,
                    "Paquete 300 g",
                    "12/04/2027",
                    "TM-331",
                    "🌮",
                    134
                ),

                productoCatalogo(
                    "Tortillas de Maíz 1kg",
                    24,
                    "Paquete 1 kg",
                    "16/11/2026",
                    "P-202",
                    "🌮",
                    134
                ),

                productoCatalogo(
                    "Tortillas de Harina 500g",
                    27,
                    "Paquete 500 g",
                    "19/11/2026",
                    "TH-501",
                    "🌯",
                    119
                ),

                productoCatalogo(
                    "Pan para Hamburguesa 8pz",
                    45,
                    "Paquete 8 piezas",
                    "23/11/2026",
                    "PH-808",
                    "🍔",
                    233
                ),

                productoCatalogo(
                    "Pan Tostado 250g",
                    35,
                    "Paquete 250 g",
                    "25/11/2026",
                    "PT-250",
                    "🍞",
                    101
                ),

                productoCatalogo(
                    "Conchas 6 Piezas",
                    39,
                    "Paquete 6 piezas",
                    "18/11/2026",
                    "CO-606",
                    "🥐",
                    178
                ),

                productoCatalogo(
                    "Galletas Marías 170g",
                    18,
                    "Paquete 170 g",
                    "10/06/2027",
                    "GM-170",
                    "🍪",
                    214
                ),

                productoCatalogo(
                    "Galletas Saladas 186g",
                    20,
                    "Paquete 186 g",
                    "14/07/2027",
                    "GS-186",
                    "🍪",
                    132
                ),

                productoCatalogo(
                    "Roles de Canela 6pz",
                    42,
                    "Paquete 6 piezas",
                    "21/11/2026",
                    "RC-606",
                    "🍩",
                    147
                )

            ]
        },


        /* =========================
           LIMPIEZA - 13
        ========================= */

        {
            nombre:
                "LIMPIEZA",

            icono:
                "🧴",

            productos: [

                productoCatalogo(
                    "Detergente 1kg",
                    52,
                    "Bolsa 1 kg",
                    "01/01/2028",
                    "C-301",
                    "🧺",
                    122
                ),

                productoCatalogo(
                    "Detergente Líquido 1L",
                    58,
                    "Botella 1 L",
                    "10/02/2028",
                    "DL-100",
                    "🧴",
                    156
                ),

                productoCatalogo(
                    "Suavizante 1L",
                    45,
                    "Botella 1 L",
                    "12/03/2028",
                    "C-302",
                    "🧴",
                    143
                ),

                productoCatalogo(
                    "Cloro 1L",
                    24,
                    "Botella 1 L",
                    "08/09/2027",
                    "C-401",
                    "🧴",
                    134
                ),

                productoCatalogo(
                    "Limpiador Multiusos 1L",
                    34,
                    "Botella 1 L",
                    "20/02/2028",
                    "C-402",
                    "🧽",
                    167
                ),

                productoCatalogo(
                    "Jabón para Trastes 750ml",
                    32,
                    "Botella 750 ml",
                    "15/05/2028",
                    "C-503",
                    "🫧",
                    201
                ),

                productoCatalogo(
                    "Esponjas para Cocina 4pz",
                    18,
                    "Paquete 4 piezas",
                    "01/01/2030",
                    "C-601",
                    "🧽",
                    109
                ),

                productoCatalogo(
                    "Limpiavidrios 500ml",
                    29,
                    "Botella 500 ml",
                    "10/08/2028",
                    "C-701",
                    "🪟",
                    118
                ),

                productoCatalogo(
                    "Desinfectante 1L",
                    39,
                    "Botella 1 L",
                    "18/06/2028",
                    "C-801",
                    "🧴",
                    154
                ),

                productoCatalogo(
                    "Bolsas para Basura 30pz",
                    35,
                    "Paquete 30 piezas",
                    "01/01/2030",
                    "BB-030",
                    "🗑️",
                    88
                ),

                productoCatalogo(
                    "Papel Higiénico 4pz",
                    32,
                    "Paquete 4 piezas",
                    "01/01/2030",
                    "PH-004",
                    "🧻",
                    189
                ),

                productoCatalogo(
                    "Servitoallas 120 Hojas",
                    29,
                    "Paquete 120 hojas",
                    "01/01/2030",
                    "ST-120",
                    "🧻",
                    94
                ),

                productoCatalogo(
                    "Jabón de Barra 3pz",
                    27,
                    "Paquete 3 piezas",
                    "01/01/2030",
                    "JB-003",
                    "🧼",
                    145
                )

            ]
        },


        /* =========================
           FRUTAS Y VERDURAS - 13
        ========================= */

        {
            nombre:
                "FRUTAS Y VERDURAS",

            icono:
                "🍎",

            productos: [

                productoCatalogo(
                    "Manzana Roja",
                    45,
                    "1 kg",
                    "10/09/2026",
                    "FR-101",
                    "🍎",
                    156
                ),

                productoCatalogo(
                    "Plátano",
                    28,
                    "1 kg",
                    "11/09/2026",
                    "FR-102",
                    "🍌",
                    203
                ),

                productoCatalogo(
                    "Naranja",
                    32,
                    "1 kg",
                    "13/09/2026",
                    "FR-103",
                    "🍊",
                    178
                ),

                productoCatalogo(
                    "Mandarina",
                    36,
                    "1 kg",
                    "14/09/2026",
                    "FR-104",
                    "🍊",
                    134
                ),

                productoCatalogo(
                    "Limón",
                    39,
                    "1 kg",
                    "13/09/2026",
                    "FR-105",
                    "🍋",
                    211
                ),

                productoCatalogo(
                    "Mango Ataulfo",
                    49,
                    "1 kg",
                    "11/09/2026",
                    "FR-106",
                    "🥭",
                    189
                ),

                productoCatalogo(
                    "Papaya",
                    35,
                    "1 kg",
                    "12/09/2026",
                    "FR-107",
                    "🥭",
                    121
                ),

                productoCatalogo(
                    "Jitomate Saladet",
                    34,
                    "1 kg",
                    "10/09/2026",
                    "VR-101",
                    "🍅",
                    198
                ),

                productoCatalogo(
                    "Cebolla Blanca",
                    29,
                    "1 kg",
                    "15/09/2026",
                    "VR-102",
                    "🧅",
                    142
                ),

                productoCatalogo(
                    "Papa Blanca",
                    31,
                    "1 kg",
                    "18/09/2026",
                    "VR-103",
                    "🥔",
                    167
                ),

                productoCatalogo(
                    "Zanahoria",
                    27,
                    "1 kg",
                    "16/09/2026",
                    "VR-104",
                    "🥕",
                    153
                ),

                productoCatalogo(
                    "Aguacate Hass",
                    69,
                    "1 kg",
                    "12/09/2026",
                    "VR-105",
                    "🥑",
                    245
                ),

                productoCatalogo(
                    "Lechuga Romana",
                    24,
                    "1 pieza",
                    "10/09/2026",
                    "VR-106",
                    "🥬",
                    112
                )

            ]
        }

    ];
    

}

/* =========================
   CARRITO
========================= */

function buscarProductoEnCatalogo(nombre) {
    try {
        const cats = getCategoriasBase();
        for (const cat of cats) {
            const prod = (cat.productos || []).find(p => p.nombre === nombre);
            if (prod) return { ...prod, categoriaLista: cat.nombre };
        }
    } catch (e) {}
    return null;
}

function agregarAlCarrito(
    nombre,
    precio,
    extraData = {}
) {
    const existente = carrito.find(p => p.nombre === nombre);

    if (existente) {
        existente.cantidad = (existente.cantidad || 1) + 1;
    } else {
        const infoCatalogo = buscarProductoEnCatalogo(nombre) || {};
        const caducidad = extraData.caducidad || infoCatalogo.caducidad || "Consumo habitual";
        const icono = extraData.icono || infoCatalogo.icono || "🛒";
        const presentacion = extraData.presentacion || infoCatalogo.presentacion || "";
        const categoriaLista = extraData.categoriaLista || infoCatalogo.categoriaLista || categoriaDeProducto({ nombre });
        const enOferta = Boolean(extraData.enOferta);
        const etiquetaOferta = extraData.etiquetaOferta || (enOferta ? "¡OFERTA!" : "");
        const precioRegular = extraData.precioRegular || (enOferta ? Math.round(precio * 1.2 * 10) / 10 : precio);
        const comparativaTiendas = extraData.comparativaTiendas || generarComparativaTiendas(precio, nombre);

        carrito.push({
            nombre,
            precio,
            precioRegular,
            cantidad: 1,
            caducidad,
            icono,
            presentacion,
            categoriaLista,
            enOferta,
            etiquetaOferta,
            comparativaTiendas,
            comprado: false
        });
    }

    guardar();
}


function guardar() {

    localStorage.setItem(
        "carritoMexa",
        JSON.stringify(carrito)
    );


    actualizarContador();

    renderLista();

}


function actualizarContador() {

    const total =
        carrito.reduce(
            (s, p) =>
                s + p.cantidad,
            0
        );


    if (contadorLista)
        contadorLista.textContent =
            total;


    if (sidebarContador)
        sidebarContador.textContent =
            total;

}


/* =========================
   MOSTRAR LISTA
========================= */

function renderListaLegacy() {

    const cont =
        document.getElementById(
            "contenidoLista"
        );


    if (!cont)
        return;


    if (!carrito.length) {

        cont.innerHTML = `

            <div class="empty-stores">

                <strong>
                    🛒 TU LISTA ESTÁ VACÍA
                </strong>

                <p>
                    Entra a una tienda y agrega productos para comenzar.
                </p>

            </div>

        `;

        return;

    }


    cont.innerHTML =

        carrito
            .map(
                (p, i) => `

                <div class="item-lista">

                    <div class="item-lista-info">

                        <strong>
                            ${escapeHTML(
                                p.nombre
                            )}
                        </strong>

                        <br>

                        <small>

                            $${p.precio.toFixed(2)}

                            ×

                            ${p.cantidad}

                            =

                            $${(
                                p.precio *
                                p.cantidad
                            ).toFixed(2)}

                        </small>

                    </div>


                    <div class="qty">

                        <button
                            onclick="
                                cambiarCantidad(
                                    ${i},
                                    -1
                                )
                            "
                        >
                            −
                        </button>


                        <strong>
                            ${p.cantidad}
                        </strong>


                        <button
                            onclick="
                                cambiarCantidad(
                                    ${i},
                                    1
                                )
                            "
                        >
                            +
                        </button>


                        <button
                            class="delete"
                            onclick="
                                eliminarDeLista(
                                    ${i}
                                )
                            "
                        >
                            ×
                        </button>

                    </div>

                </div>

            `
            )
            .join("")

        +

        `

            <div class="total-lista">

                TOTAL:

                $${carrito
                    .reduce(
                        (s, p) =>
                            s +
                            p.precio *
                            p.cantidad,
                        0
                    )
                    .toFixed(2)}

            </div>

        `;

}


/* =========================
   CANTIDAD
========================= */

function cambiarCantidad(
    i,
    d
) {

    if (!carrito[i])
        return;


    carrito[i].cantidad += d;


    if (
        carrito[i].cantidad <= 0
    ) {

        carrito.splice(i, 1);

    }


    guardar();

}


function eliminarDeLista(i) {

    carrito.splice(i, 1);

    guardar();

}


function vaciarLista() {

    carrito = [];
    detallesTiendaAbiertos = {};

    guardar();

}


/* =========================
   LISTA AUTOMÁTICA
========================= */

function generarListaAutomaticaLegacy() {

    carrito = [

        {
            nombre:
                "Frijol Negro 900g",

            precio:
                32,

            cantidad:
                1
        },


        {
            nombre:
                "Arroz Morelos 1kg",

            precio:
                35,

            cantidad:
                2
        },


        {
            nombre:
                "Leche Entera Neto 1L",

            precio:
                26,

            cantidad:
                2
        },


        {
            nombre:
                "Pan Blanco Grande",

            precio:
                42,

            cantidad:
                1
        }

    ];


    guardar();

    abrirLista(false);

}


function productoSemanal(nombre, precio, cantidad, categoriaLista, options = {}) {
    const enOferta = Boolean(options.enOferta);
    const precioRegular = options.precioRegular || (enOferta ? Math.round(precio * 1.22 * 10) / 10 : precio);
    const comparativa = options.comparativaTiendas || generarComparativaTiendas(precio, nombre);

    return {
        nombre,
        precio,
        precioRegular,
        cantidad: cantidad || 1,
        categoriaLista,
        icono: options.icono || "🛒",
        presentacion: options.presentacion || "",
        caducidad: options.caducidad || "Consumo habitual",
        enOferta,
        etiquetaOferta: options.etiquetaOferta || (enOferta ? "¡OFERTA!" : ""),
        comparativaTiendas: comparativa,
        comprado: false
    };
}

function generarListaAutomatica() {
    detallesTiendaAbiertos = {};
    /* Despensa semanal balanceada, variada y completa con ofertas, caducidades y comparador de tiendas */
    carrito = [
        // Frutas y verduras (frescas para la despensa semanal)
        productoSemanal("Jitomate Saladet 1kg", 26.50, 1, "Frutas y verduras", {
            icono: "🍅",
            presentacion: "1 kg fresco",
            caducidad: "26/09/2026",
            enOferta: true,
            etiquetaOferta: "22% OFF",
            precioRegular: 34.00
        }),
        productoSemanal("Plátano Tabasco 1kg", 22.00, 1, "Frutas y verduras", {
            icono: "🍌",
            presentacion: "1 kg",
            caducidad: "25/09/2026",
            enOferta: true,
            etiquetaOferta: "¡Oferta de Temporada!",
            precioRegular: 28.00
        }),
        productoSemanal("Cebolla Blanca 1kg", 24.00, 1, "Frutas y verduras", {
            icono: "🧅",
            presentacion: "1 kg",
            caducidad: "02/10/2026",
            enOferta: true,
            etiquetaOferta: "17% OFF",
            precioRegular: 29.00
        }),
        productoSemanal("Papa Blanca 1kg", 31.00, 1, "Frutas y verduras", {
            icono: "🥔",
            presentacion: "1 kg",
            caducidad: "05/10/2026"
        }),
        productoSemanal("Manzana Roja 1kg", 42.00, 1, "Frutas y verduras", {
            icono: "🍎",
            presentacion: "1 kg",
            caducidad: "29/09/2026"
        }),
        productoSemanal("Aguacate Hass 1kg", 65.00, 1, "Frutas y verduras", {
            icono: "🥑",
            presentacion: "1 kg",
            caducidad: "26/09/2026",
            enOferta: true,
            etiquetaOferta: "¡Precio Especial!",
            precioRegular: 74.00
        }),
        productoSemanal("Limón con Semilla 1kg", 32.00, 1, "Frutas y verduras", {
            icono: "🍋",
            presentacion: "1 kg",
            caducidad: "01/10/2026",
            enOferta: true,
            etiquetaOferta: "18% OFF",
            precioRegular: 39.00
        }),

        // Abarrotes esenciales
        productoSemanal("Frijol Negro 900g", 27.50, 1, "Abarrotes", {
            icono: "🫘",
            presentacion: "Bolsa 900 g",
            caducidad: "12/12/2026",
            enOferta: true,
            etiquetaOferta: "19% OFF",
            precioRegular: 34.00
        }),
        productoSemanal("Arroz Morelos 1kg", 32.00, 1, "Abarrotes", {
            icono: "🍚",
            presentacion: "Bolsa 1 kg",
            caducidad: "08/03/2027"
        }),
        productoSemanal("Aceite Vegetal 1L", 42.50, 1, "Abarrotes", {
            icono: "🫗",
            presentacion: "Botella 1 L",
            caducidad: "15/01/2027",
            enOferta: true,
            etiquetaOferta: "¡Oferta Semanal!",
            precioRegular: 49.90
        }),
        productoSemanal("Atún en Agua 140g", 18.50, 2, "Abarrotes", {
            icono: "🐟",
            presentacion: "Lata 140 g",
            caducidad: "10/11/2028",
            enOferta: true,
            etiquetaOferta: "20% OFF",
            precioRegular: 23.00
        }),
        productoSemanal("Pasta Spaghetti 200g", 15.00, 1, "Abarrotes", {
            icono: "🍝",
            presentacion: "Paquete 200 g",
            caducidad: "22/06/2028"
        }),
        productoSemanal("Avena Natural 400g", 26.00, 1, "Abarrotes", {
            icono: "🌾",
            presentacion: "Bolsa 400 g",
            caducidad: "14/02/2028"
        }),

        // Lácteos y proteína
        productoSemanal("Leche Entera Neto 1L", 23.50, 2, "Lácteos y proteína", {
            icono: "🥛",
            presentacion: "Envase 1 L",
            caducidad: "20/11/2026",
            enOferta: true,
            etiquetaOferta: "¡En Oferta!",
            precioRegular: 27.00
        }),
        productoSemanal("Huevo Blanco 18 Piezas", 48.00, 1, "Lácteos y proteína", {
            icono: "🥚",
            presentacion: "Cartón 18 piezas",
            caducidad: "15/12/2026",
            enOferta: true,
            etiquetaOferta: "14% OFF",
            precioRegular: 56.00
        }),
        productoSemanal("Queso Oaxaca 400g", 64.00, 1, "Lácteos y proteína", {
            icono: "🧀",
            presentacion: "Paquete 400 g",
            caducidad: "05/12/2026"
        }),
        productoSemanal("Yogurt Natural 1kg", 36.00, 1, "Lácteos y proteína", {
            icono: "🥛",
            presentacion: "Envase 1 kg",
            caducidad: "28/11/2026"
        }),

        // Pan y tortillas
        productoSemanal("Tortillas de Maíz 1kg", 22.00, 1, "Pan y tortillas", {
            icono: "🌮",
            presentacion: "Paquete 1 kg",
            caducidad: "22/09/2026"
        }),
        productoSemanal("Pan Blanco Grande", 38.00, 1, "Pan y tortillas", {
            icono: "🍞",
            presentacion: "Pan de caja 680 g",
            caducidad: "28/11/2026",
            enOferta: true,
            etiquetaOferta: "13% OFF",
            precioRegular: 44.00
        }),

        // Hogar y limpieza
        productoSemanal("Detergente 1kg", 46.00, 1, "Hogar y limpieza", {
            icono: "🧺",
            presentacion: "Bolsa 1 kg",
            caducidad: "01/01/2028",
            enOferta: true,
            etiquetaOferta: "15% OFF",
            precioRegular: 54.00
        }),
        productoSemanal("Cloro 1L", 22.00, 1, "Hogar y limpieza", {
            icono: "🧴",
            presentacion: "Botella 1 L",
            caducidad: "08/09/2027"
        }),
        productoSemanal("Papel Higiénico 4pz", 28.00, 1, "Hogar y limpieza", {
            icono: "🧻",
            presentacion: "Paquete 4 piezas",
            caducidad: "01/01/2030",
            enOferta: true,
            etiquetaOferta: "20% OFF",
            precioRegular: 35.00
        }),
        productoSemanal("Jabón para Trastes 750ml", 29.00, 1, "Hogar y limpieza", {
            icono: "🫧",
            presentacion: "Botella 750 ml",
            caducidad: "15/05/2028"
        })
    ];

    guardar();
    abrirLista(false);
}

/* =========================
   SEGURIDAD HTML
========================= */

function escapeHTML(text) {

    return String(text)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


function escapeJS(text) {

    return String(text)

        .replaceAll(
            "\\",
            "\\\\"
        )

        .replaceAll(
            "'",
            "\\'"
        );

}
