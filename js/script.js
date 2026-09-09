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
let favoritosMexa =
    JSON.parse(
        localStorage.getItem("favoritosMexa") || "[]"
    );

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