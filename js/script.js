let mapa = null;
let ubicacionUsuario = null;
let rutaActual = null;
let marcadoresRuta = [];
let marcadorUsuario = null;
let marcadoresTiendas = [];
let tiendas = [];
let tiendasVisibles = 6;

let carrito = JSON.parse(localStorage.getItem("carritoMexa") || "[]");
carrito = carrito.map(p => ({ ...p, cantidad: p.cantidad || 1 }));

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
        ?.addEventListener("click", abrirLista);

    document
        .getElementById("navLista")
        ?.addEventListener("click", abrirLista);


    document
        .getElementById("cerrarLista")
        ?.addEventListener("click", () => {

            document
                .getElementById("modalLista")
                ?.classList.remove("activa");

        });


    document
        .getElementById("botonCuenta")
        ?.addEventListener("click", () => {

            document
                .getElementById("modalCuenta")
                ?.classList.add("activa");

        });


    document
        .getElementById("cerrarCuenta")
        ?.addEventListener("click", () => {

            document
                .getElementById("modalCuenta")
                ?.classList.remove("activa");

        });


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

            });

        });

}


/* =========================
   LISTA
========================= */

function abrirLista() {

    renderLista();

    document
        .getElementById("modalLista")
        ?.classList.add("activa");
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

        zoomControl: true,

        attributionControl: true

    }).setView(
        [lat, lng],
        13
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {

            maxZoom: 19,

            attribution:
                "&copy; OpenStreetMap contributors"

        }

    ).addTo(mapa);


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

function crearTiendasReales(
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


    /*
     * Copiamos las tiendas de nuestra
     * base local.
     */

    tiendas =
        tiendasNetoZona.map(
            tienda => ({

                ...tienda,

                distancia:
                    calcularDistancia(
                        lat,
                        lng,
                        tienda.lat,
                        tienda.lng
                    )

            })
        );


    /*
     * Solo tiendas dentro de 50 km.
     */

    tiendas =
        tiendas.filter(
            tienda =>
                tienda.distancia <= 50
        );


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
                    No encontramos tiendas
                    dentro de 50 km.
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


function abrirCatalogo(
    tienda
) {

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


    const categorias =
        getCategoriasBase();


    catalogo.innerHTML = `

        <div
            class="contenido-modal"
            style="width:min(1000px,95vw)"
        >

            <button
                class="cerrar-modal"
                onclick="cerrarCatalogo()"
            >
                ×
            </button>


            <span class="section-label">
                CATÁLOGO
            </span>


            <h2>
                ${escapeHTML(
                    tienda.nombre
                )}
            </h2>


            <p
                style="
                    font-size:10px;
                    color:#666
                "
            >

                📍
                ${escapeHTML(
                    tienda.direccion
                )}

                ·

                ${tienda.distancia.toFixed(2)}
                km

            </p>


            <div class="categorias-catalogo">

                ${categorias.map(
                    (c, i) => `

                    <button
                        class="btn-outline categoria-btn"
                        style="
                            margin:5px 4px 0 0
                        "
                        onclick="
                            mostrarCategoria(
                                ${i},
                                this
                            )
                        "
                    >

                        ${c.icono}
                        ${c.nombre}

                    </button>

                `
                ).join("")}

            </div>


            <div
                id="catalogoProductos"
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(
                            auto-fit,
                            minmax(180px,1fr)
                        );
                    gap:12px;
                    margin-top:20px;
                "
            >

                ${crearProductosHTML(
                    categorias[0]
                )}

            </div>

        </div>

    `;


    catalogo.classList.add(
        "activa"
    );

}


function mostrarCategoria(
    index,
    btn
) {

    const categorias =
        getCategoriasBase();


    const categoria =
        categorias[index];


    document
        .querySelectorAll(
            ".categoria-btn"
        )
        .forEach(b => {

            b.style.background =
                "white";

            b.style.color =
                "#111820";

        });


    btn.style.background =
        "#ff4b12";

    btn.style.color =
        "white";


    document
        .getElementById(
            "catalogoProductos"
        )
        .innerHTML =
            crearProductosHTML(
                categoria
            );

}


function crearProductosHTML(
    categoria
) {

    return categoria.productos
        .map(
            p => `

            <div
                style="
                    padding:14px;
                    border:
                        1px solid #ded9d0;
                    border-radius:12px;
                    background:white;
                "
            >

                <div
                    style="
                        height:75px;
                        display:grid;
                        place-items:center;
                        border-radius:9px;
                        background:#f0ede7;
                        font-size:38px;
                    "
                >

                    ${categoria.icono}

                </div>


                <strong
                    style="
                        display:block;
                        margin-top:10px;
                        font-size:11px
                    "
                >

                    ${escapeHTML(
                        p.nombre
                    )}

                </strong>


                <small
                    style="
                        display:block;
                        margin-top:4px;
                        color:#666;
                        font-size:8px
                    "
                >

                    ${escapeHTML(
                        p.desc
                    )}

                </small>


                <div
                    style="
                        margin-top:8px;
                        color:#ff4b12;
                        font-size:8px;
                        font-weight:800;
                    "
                >

                    📅 CAD
                    ${p.caducidad}
                    ·
                    ${p.lote}

                </div>


                <div
                    style="
                        margin-top:9px;
                        font-size:19px;
                        font-weight:900
                    "
                >

                    $${p.precio.toFixed(2)}

                </div>


                <button
                    class="btn-naranja"
                    style="
                        width:100%;
                        margin-top:9px
                    "
                    onclick="
                        agregarAlCarrito(
                            '${escapeJS(p.nombre)}',
                            ${p.precio}
                        )
                    "
                >

                    🛒 AGREGAR

                </button>

            </div>

        `
        )
        .join("");

}


function cerrarCatalogo() {

    document
        .getElementById(
            "catalogoTienda"
        )
        ?.classList.remove(
            "activa"
        );

}


/* =========================
   CATEGORÍAS
========================= */

function getCategoriasBase() {

    return [

        {

            nombre:
                "ABARROTES",

            icono:
                "🥫",

            productos: [

                {
                    nombre:
                        "Frijol Negro 900g",

                    precio:
                        32,

                    desc:
                        "Cosecha Mixteca, alto en proteína",

                    caducidad:
                        "12/12/2026",

                    lote:
                        "L-8841"
                },


                {
                    nombre:
                        "Arroz Morelos 1kg",

                    precio:
                        35,

                    desc:
                        "Grano largo 100% mexicano",

                    caducidad:
                        "08/03/2027",

                    lote:
                        "L-9021"
                },


                {
                    nombre:
                        "Aceite Vegetal 1L",

                    precio:
                        48,

                    desc:
                        "Aceite mixto",

                    caducidad:
                        "15/01/2027",

                    lote:
                        "L-1120"
                }

            ]

        },


        {

            nombre:
                "LÁCTEOS",

            icono:
                "🥛",

            productos: [

                {
                    nombre:
                        "Leche Entera Neto 1L",

                    precio:
                        26,

                    desc:
                        "Leche ultrapasteurizada",

                    caducidad:
                        "20/11/2026",

                    lote:
                        "L-5512"
                },


                {
                    nombre:
                        "Queso Oaxaca 400g",

                    precio:
                        68,

                    desc:
                        "Queso fresco tipo hebra",

                    caducidad:
                        "05/12/2026",

                    lote:
                        "L-5518"
                },


                {
                    nombre:
                        "Yogurt Natural 1kg",

                    precio:
                        38,

                    desc:
                        "Con probióticos",

                    caducidad:
                        "28/11/2026",

                    lote:
                        "L-5520"
                }

            ]

        },


        {

            nombre:
                "BEBIDAS",

            icono:
                "🥤",

            productos: [

                {
                    nombre:
                        "Refresco Cola 3L",

                    precio:
                        35,

                    desc:
                        "Bebida carbonatada",

                    caducidad:
                        "10/06/2027",

                    lote:
                        "B-101"
                },


                {
                    nombre:
                        "Agua Purificada 1.5L",

                    precio:
                        14,

                    desc:
                        "Agua purificada",

                    caducidad:
                        "10/06/2028",

                    lote:
                        "B-102"
                }

            ]

        },


        {

            nombre:
                "PAN Y TORTILLAS",

            icono:
                "🍞",

            productos: [

                {
                    nombre:
                        "Pan Blanco Grande",

                    precio:
                        42,

                    desc:
                        "Pan de caja 680g",

                    caducidad:
                        "18/11/2026",

                    lote:
                        "P-201"
                },


                {
                    nombre:
                        "Tortillas de Maíz 1kg",

                    precio:
                        24,

                    desc:
                        "Nixtamalizadas",

                    caducidad:
                        "16/11/2026",

                    lote:
                        "P-202"
                }

            ]

        },


        {

            nombre:
                "LIMPIEZA",

            icono:
                "🧴",

            productos: [

                {
                    nombre:
                        "Detergente 1kg",

                    precio:
                        52,

                    desc:
                        "Ropa blanca y color",

                    caducidad:
                        "01/01/2028",

                    lote:
                        "C-301"
                }

            ]

        }

    ];

}


/* =========================
   CARRITO
========================= */

function agregarAlCarrito(
    nombre,
    precio
) {

    const existente =
        carrito.find(
            p =>
                p.nombre ===
                nombre
        );


    if (existente) {

        existente.cantidad++;

    } else {

        carrito.push({

            nombre,

            precio,

            cantidad: 1

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

function renderLista() {

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

    guardar();

}


/* =========================
   LISTA AUTOMÁTICA
========================= */

function generarListaAutomatica() {

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

    abrirLista();

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