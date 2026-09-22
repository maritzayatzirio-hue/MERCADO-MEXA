/* ==========================================================================
   MERCADO MEXA - CONTROLADOR DE MAPA GOOGLE MAPS
   Gestión de capas oficiales de Google (Terreno, Estándar, Satélite, Tráfico),
   panel 'Detalles del mapa', herramientas de medición, buscador y controles.
   ========================================================================== */

const GoogleMapsMexa = (() => {
    // Referencias a capas base y overlays
    let capaActualBase = "terreno";
    let capasBase = {};
    let capasSuperpuestas = {
        trafico: null,
        transporte: null,
        bicicleta: null,
        incendios: null,
        aire: null
    };

    // Estado de herramientas
    let modoMedicion = false;
    let puntosMedicion = [];
    let lineaMedicion = null;
    let marcadoresMedicion = [];
    let modoStreetView = false;

    // Toast informativo
    function mostrarToast(mensaje, duracion = 3000) {
        let toast = document.getElementById("gmapsToast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "gmapsToast";
            toast.className = "gmaps-toast";
            document.querySelector(".map-card")?.appendChild(toast);
        }
        toast.textContent = mensaje;
        toast.classList.add("visible");
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.classList.remove("visible");
        }, duracion);
    }

    // Inicializar capas en Leaflet
    function inicializarCapas(mapInstance) {
        if (!mapInstance) return;

        // Capas base de Google Maps (sin API key requerida para teselas estándar)
        capasBase.terreno = L.tileLayer("https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}", {
            maxZoom: 20,
            attribution: "Mapas &copy; Google"
        });

        capasBase.estandar = L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
            maxZoom: 20,
            attribution: "Mapas &copy; Google"
        });

        capasBase.satelite = L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
            maxZoom: 20,
            attribution: "Imágenes &copy; Google"
        });

        // Capa de Tráfico oficial en vivo (Overlay PNG transparente)
        capasSuperpuestas.trafico = L.tileLayer("https://mt1.google.com/vt?lyrs=h,traffic&x={x}&y={y}&z={z}", {
            maxZoom: 20,
            opacity: 0.85,
            zIndex: 400
        });

        // Capa de Transporte público (Líneas y estaciones de tren/metro/autobús)
        capasSuperpuestas.transporte = L.tileLayer("https://tile.memomaps.de/tilegen/{z}/{x}/{y}.png", {
            maxZoom: 18,
            opacity: 0.75,
            zIndex: 410,
            attribution: "&copy; MeMoMaps / OSM"
        });

        // Capa de Rutas ciclistas (CyclOSM)
        capasSuperpuestas.bicicleta = L.tileLayer("https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png", {
            maxZoom: 19,
            opacity: 0.7,
            zIndex: 420,
            attribution: "&copy; CyclOSM"
        });

        // Establecer Terreno por defecto como en la captura
        capasBase.terreno.addTo(mapInstance);
        capaActualBase = "terreno";

        mapInstance.on("click", (e) => {
            cerrarPanelDetalles();
            if (modoMedicion) {
                registrarClicMedicion(e);
            }
        });
    }

    // Cambiar capa base (estándar, terreno, satélite)
    function cambiarTipoMapa(tipo) {
        if (!window.mapa || !capasBase[tipo]) return;

        Object.values(capasBase).forEach(capa => {
            if (window.mapa.hasLayer(capa)) {
                window.mapa.removeLayer(capa);
            }
        });

        capasBase[tipo].addTo(window.mapa);
        capaActualBase = tipo;

        // Actualizar UI del panel
        document.querySelectorAll(".gmaps-type-card").forEach(card => {
            card.classList.toggle("activo", card.dataset.type === tipo);
        });

        // Actualizar botón de capa "Terreno" en la cuadrícula de capas
        const btnTerreno = document.querySelector('.gmaps-layer-btn[data-layer="terreno"]');
        if (btnTerreno) {
            btnTerreno.classList.toggle("activo", tipo === "terreno");
        }

        // Actualizar miniatura de la esquina inferior
        const thumbToggle = document.getElementById("gmapsThumbSwitcher");
        if (thumbToggle) {
            const thumbLabel = thumbToggle.querySelector(".thumb-label");
            if (tipo === "satelite") {
                thumbToggle.style.backgroundImage = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"48\" height=\"48\"><rect width=\"48\" height=\"48\" fill=\"%23d0e3cc\"/><path d=\"M0,48 Q24,10 48,48\" fill=\"%239ebf99\"/></svg>')";
                if (thumbLabel) thumbLabel.textContent = "Terreno";
            } else {
                thumbToggle.style.backgroundImage = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"48\" height=\"48\"><rect width=\"48\" height=\"48\" fill=\"%23223024\"/><circle cx=\"24\" cy=\"24\" r=\"16\" fill=\"%233a4f3e\"/></svg>')";
                if (thumbLabel) thumbLabel.textContent = "Satélite";
            }
        }

        mostrarToast(`Vista cambiada a: ${tipo.toUpperCase()}`);
    }

    // Alternar capa superpuesta
    function alternarCapaSuperpuesta(nombreCapa) {
        if (!window.mapa) return;

        if (nombreCapa === "terreno") {
            cambiarTipoMapa(capaActualBase === "terreno" ? "estandar" : "terreno");
            return;
        }

        if (nombreCapa === "streetview") {
            activarModoStreetView();
            return;
        }

        if (nombreCapa === "incendios" || nombreCapa === "aire") {
            const btn = document.querySelector(`.gmaps-layer-btn[data-layer="${nombreCapa}"]`);
            const activo = btn?.classList.toggle("activo");
            mostrarToast(activo ? `Capa de ${nombreCapa.toUpperCase()} activada` : `Capa desactivada`);
            return;
        }

        const capa = capasSuperpuestas[nombreCapa];
        if (!capa) return;

        const btn = document.querySelector(`.gmaps-layer-btn[data-layer="${nombreCapa}"]`);

        if (window.mapa.hasLayer(capa)) {
            window.mapa.removeLayer(capa);
            btn?.classList.remove("activo");
            mostrarToast(`Capa de ${nombreCapa} desactivada`);
        } else {
            capa.addTo(window.mapa);
            btn?.classList.add("activo");
            mostrarToast(`Capa de ${nombreCapa} activada`);
        }
    }

    // Herramienta de medición de distancia
    function iniciarMedicion() {
        if (modoMedicion) {
            finalizarMedicion();
            return;
        }

        modoMedicion = true;
        puntosMedicion = [];
        const btnMedir = document.querySelector('.gmaps-tool-btn[data-tool="medicion"]');
        btnMedir?.classList.add("activo");

        const measureBar = document.getElementById("gmapsMeasureBar");
        if (measureBar) {
            measureBar.classList.add("activa");
            const valSpan = document.getElementById("gmapsMeasureVal");
            if (valSpan) valSpan.textContent = "0.00 km";
        }

        mostrarToast("Modo medición activo: Haz clic en el mapa para medir distancias");
        cerrarPanelDetalles();
    }

    function finalizarMedicion() {
        modoMedicion = false;
        puntosMedicion = [];

        if (lineaMedicion && window.mapa) {
            window.mapa.removeLayer(lineaMedicion);
            lineaMedicion = null;
        }

        marcadoresMedicion.forEach(m => window.mapa?.removeLayer(m));
        marcadoresMedicion = [];

        const btnMedir = document.querySelector('.gmaps-tool-btn[data-tool="medicion"]');
        btnMedir?.classList.remove("activo");

        const measureBar = document.getElementById("gmapsMeasureBar");
        if (measureBar) measureBar.classList.remove("activa");
    }

    function registrarClicMedicion(e) {
        if (!modoMedicion || !window.mapa) return;

        const latlng = e.latlng;
        puntosMedicion.push(latlng);

        // Marcador del punto de medición
        const marker = L.circleMarker(latlng, {
            radius: 5,
            color: "#ffffff",
            weight: 2,
            fillColor: "#1a73e8",
            fillOpacity: 1
        }).addTo(window.mapa);
        marcadoresMedicion.push(marker);

        // Dibujar polilínea
        if (!lineaMedicion) {
            lineaMedicion = L.polyline(puntosMedicion, {
                color: "#1a73e8",
                weight: 4,
                dashArray: "6, 8"
            }).addTo(window.mapa);
        } else {
            lineaMedicion.setLatLngs(puntosMedicion);
        }

        // Calcular distancia acumulada
        let distanciaMetros = 0;
        for (let i = 0; i < puntosMedicion.length - 1; i++) {
            distanciaMetros += puntosMedicion[i].distanceTo(puntosMedicion[i + 1]);
        }

        const km = (distanciaMetros / 1000).toFixed(2);
        const metros = Math.round(distanciaMetros);
        const texto = distanciaMetros >= 1000 ? `${km} km` : `${metros} m`;

        const valSpan = document.getElementById("gmapsMeasureVal");
        if (valSpan) valSpan.textContent = texto;
    }

    // Street View (abre Google Street View en la coordenada actual o seleccionada)
    function activarModoStreetView() {
        if (!window.mapa) return;
        const center = window.mapa.getCenter();
        const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${center.lat},${center.lng}`;
        window.open(url, "_blank");
        mostrarToast("Abriendo Street View de la zona actual...");
    }

    // Panel de Detalles del mapa
    function togglePanelDetalles() {
        const drawer = document.getElementById("gmapsDetailsDrawer");
        if (drawer) {
            drawer.classList.toggle("abierto");
        }
    }

    function abrirPanelDetalles() {
        const drawer = document.getElementById("gmapsDetailsDrawer");
        if (drawer) drawer.classList.add("abierto");
    }

    function cerrarPanelDetalles() {
        const drawer = document.getElementById("gmapsDetailsDrawer");
        if (drawer) drawer.classList.remove("abierto");
    }

    // Búsqueda de lugares / colonias con Nominatim
    async function buscarLugar(texto) {
        if (!texto || !texto.trim() || !window.mapa) return;

        mostrarToast("Buscando ubicación...");

        try {
            const query = encodeURIComponent(texto.trim());
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=mx&limit=1`;
            const resp = await fetch(url, { headers: { "Accept-Language": "es" } });
            const data = await resp.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                window.mapa.flyTo([lat, lon], 14, { duration: 1.5 });

                L.popup()
                    .setLatLng([lat, lon])
                    .setContent(`<div style="padding:6px 8px;font-family:Inter,sans-serif"><strong>📍 ${data[0].display_name.split(",")[0]}</strong><p style="margin:4px 0 0 0;font-size:11px;color:#555">${data[0].display_name}</p></div>`)
                    .openOn(window.mapa);

                mostrarToast(`Ubicado: ${data[0].display_name.split(",")[0]}`);

                // Si la función de crearTiendasReales existe, buscar tiendas en la nueva zona
                if (typeof window.crearTiendasReales === "function") {
                    window.crearTiendasReales(lat, lon);
                }
            } else {
                mostrarToast("No se encontraron resultados en el mapa.");
            }
        } catch (err) {
            console.error("Error al geocodificar:", err);
            mostrarToast("No se pudo conectar con el servicio de búsqueda.");
        }
    }

    // Filtrar por categoría desde los chips
    function filtrarPorCategoria(categoria) {
        document.querySelectorAll(".gmaps-chip").forEach(c => {
            c.classList.toggle("activo", c.dataset.categoria === categoria);
        });

        if (categoria === "todos") {
            if (typeof window.crearTiendasReales === "function" && window.ubicacionUsuario) {
                window.crearTiendasReales(window.ubicacionUsuario.lat, window.ubicacionUsuario.lng);
            }
            mostrarToast("Mostrando todas las Tiendas Neto cercanas");
        } else if (categoria === "cercana") {
            if (window.tiendas && window.tiendas.length > 0 && window.mapa) {
                const masCercana = window.tiendas[0];
                window.mapa.flyTo([masCercana.lat, masCercana.lng], 16, { duration: 1.2 });
                mostrarToast(`Tienda Neto más cercana: a ${masCercana.distancia.toFixed(2)} km`);
            } else {
                mostrarToast("Localizando la Tienda Neto más cercana...");
            }
        } else if (categoria === "abiertas") {
            mostrarToast("🕒 Tiendas Neto: Abiertas hoy en horario regular (7:00 am - 10:00 pm)");
        } else if (categoria === "catalogo") {
            mostrarToast("🛒 Abriendo catálogo de productos de Tiendas Neto...");
            const btnCat = document.querySelector(".nav-item[data-target='catalogo']");
            if (btnCat) btnCat.click();
        } else if (categoria === "ia") {
            mostrarToast("✨ Asistente Neto: Encuentra productos de canasta básica al mejor precio.");
        }
    }

    // Configurar listeners de la interfaz
    function configurarEventos() {
        if (configurarEventos._iniciado) return;
        configurarEventos._iniciado = true;

        // Botón menú hamburguesa -> Abre panel Detalles
        document.getElementById("gmapsMenuBtn")?.addEventListener("click", (e) => {
            e.stopPropagation();
            togglePanelDetalles();
        });

        // Botón cerrar panel
        document.getElementById("gmapsClosePanel")?.addEventListener("click", cerrarPanelDetalles);

        // Input de búsqueda
        const searchInput = document.getElementById("gmapsSearchInput");
        const clearBtn = document.getElementById("gmapsClearBtn");

        searchInput?.addEventListener("input", () => {
            if (clearBtn) {
                clearBtn.classList.toggle("visible", searchInput.value.length > 0);
            }
        });

        searchInput?.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                buscarLugar(searchInput.value);
            }
        });

        clearBtn?.addEventListener("click", () => {
            if (searchInput) {
                searchInput.value = "";
                clearBtn.classList.remove("visible");
                searchInput.focus();
            }
        });

        document.getElementById("gmapsSearchBtn")?.addEventListener("click", () => {
            if (searchInput) buscarLugar(searchInput.value);
        });

        document.getElementById("gmapsDirectionsBtn")?.addEventListener("click", () => {
            mostrarToast("Selecciona una tienda en la lista para ver la ruta.");
            document.getElementById("listaTiendas")?.scrollIntoView({ behavior: "smooth" });
        });

        // Chips de categorías
        document.querySelectorAll(".gmaps-chip").forEach(chip => {
            chip.addEventListener("click", () => {
                filtrarPorCategoria(chip.dataset.categoria);
            });
        });

        // Flecha deslizar chips
        document.getElementById("gmapsChipsNext")?.addEventListener("click", () => {
            const wrapper = document.getElementById("gmapsChipsWrapper");
            if (wrapper) wrapper.scrollBy({ left: 160, behavior: "smooth" });
        });

        // Cuadrícula de capas en el panel lateral
        document.querySelectorAll(".gmaps-layer-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const capa = btn.dataset.layer;
                alternarCapaSuperpuesta(capa);
            });
        });

        // Herramientas del mapa
        document.querySelectorAll(".gmaps-tool-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const tool = btn.dataset.tool;
                if (tool === "medicion") {
                    iniciarMedicion();
                } else if (tool === "duracion") {
                    mostrarToast("Selecciona cualquier tienda para consultar tiempos y rutas.");
                    cerrarPanelDetalles();
                }
            });
        });

        // Cerrar medición
        document.getElementById("gmapsMeasureClose")?.addEventListener("click", finalizarMedicion);

        // Tipo de mapa (Miniaturas en el panel)
        document.querySelectorAll(".gmaps-type-card").forEach(card => {
            card.addEventListener("click", () => {
                const type = card.dataset.type;
                cambiarTipoMapa(type);
            });
        });

        // Miniatura rápida de satélite/terreno en la esquina inferior derecha
        document.getElementById("gmapsThumbSwitcher")?.addEventListener("click", () => {
            if (capaActualBase === "satelite") {
                cambiarTipoMapa("terreno");
            } else {
                cambiarTipoMapa("satelite");
            }
        });

        // Controles de zoom flotantes
        document.getElementById("gmapsZoomIn")?.addEventListener("click", () => {
            window.mapa?.zoomIn();
        });

        document.getElementById("gmapsZoomOut")?.addEventListener("click", () => {
            window.mapa?.zoomOut();
        });

        // Botón GPS centrar
        document.getElementById("gmapsLocateBtn")?.addEventListener("click", () => {
            if (window.mapa && window.ubicacionUsuario) {
                window.mapa.flyTo([window.ubicacionUsuario.lat, window.ubicacionUsuario.lng], 15, { duration: 1.2 });
                mostrarToast("Centrado en tu ubicación GPS");
            } else if (typeof window.obtenerUbicacion === "function") {
                window.obtenerUbicacion();
            }
        });

        // Pegman Street View
        document.getElementById("gmapsPegmanBtn")?.addEventListener("click", activarModoStreetView);

    }

    return {
        inicializarCapas,
        configurarEventos,
        cambiarTipoMapa,
        alternarCapaSuperpuesta,
        iniciarMedicion,
        finalizarMedicion,
        mostrarToast
    };
})();

window.GoogleMapsMexa = GoogleMapsMexa;
