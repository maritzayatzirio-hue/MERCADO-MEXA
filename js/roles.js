/* =====================================================
   MERCADO MEXA - CUENTAS Y ROLES
   Roles: Usuario (Cliente), Chofer (Repartidor), Administrador
===================================================== */

// Helper seguro para escapar HTML
function escapeHTMLSafe(str) {
    if (typeof str !== "string") return str || "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =====================================================
   ALMACENAMIENTO (LOCALSTORAGE)
===================================================== */

function obtenerCuentas() {
    try {
        return JSON.parse(localStorage.getItem("cuentasMexa") || "[]");
    } catch (error) {
        console.error("Error leyendo cuentas:", error);
        return [];
    }
}

function guardarCuentas(cuentas) {
    localStorage.setItem("cuentasMexa", JSON.stringify(cuentas));
}

function obtenerSesionActual() {
    try {
        return JSON.parse(localStorage.getItem("sesionMexa") || "null");
    } catch (error) {
        return null;
    }
}

function guardarSesion(cuenta) {
    const sesion = {
        id: cuenta.id,
        nombre: cuenta.nombre,
        apellidos: cuenta.apellidos || "",
        correo: cuenta.correo,
        telefono: cuenta.telefono || "",
        rol: cuenta.rol || "usuario",
        estadoChofer: cuenta.estadoChofer || "disponible",
        entregas: cuenta.entregas || 0
    };
    localStorage.setItem("sesionMexa", JSON.stringify(sesion));
}

function cerrarSesionMexa() {
    localStorage.removeItem("sesionMexa");
    actualizarBotonCuenta();
}

function obtenerPedidosMexa() {
    try {
        const pedidos = JSON.parse(localStorage.getItem("pedidosMexa") || "null");
        if (pedidos) return pedidos;
    } catch (e) {}

    // Pedidos iniciales de demostración
    const demoPedidos = [
        {
            id: "MX-8912",
            cliente: "Alexandra Gómez",
            telefono: "9511234567",
            direccion: "C. Hidalgo 17, Centro, Tlaxiaco",
            total: 184.00,
            productos: "Leche Entera (2), Pan Blanco (1), Refresco Cola 3L (1)",
            estado: "en_ruta",
            chofer: "Carlos Ramírez",
            fecha: "Hoy, 10:30 AM"
        },
        {
            id: "MX-8915",
            cliente: "Juan Pablo Reyes",
            telefono: "9519876543",
            direccion: "Av. Independencia 45, Barrio San Diego",
            total: 265.50,
            productos: "Huevo Blanco 18pz (1), Detergente 1kg (2), Azúcar 1kg (1)",
            estado: "pendiente",
            chofer: "Carlos Ramírez",
            fecha: "Hoy, 11:15 AM"
        },
        {
            id: "MX-8890",
            cliente: "María Elena Castro",
            telefono: "9514455667",
            direccion: "C. Morelos 8, Barrio San Bartolo",
            total: 142.00,
            productos: "Frijol Negro (1), Arroz Morelos (1), Aceite 1L (1)",
            estado: "entregado",
            chofer: "Carlos Ramírez",
            fecha: "Hoy, 09:10 AM"
        }
    ];
    localStorage.setItem("pedidosMexa", JSON.stringify(demoPedidos));
    return demoPedidos;
}

function guardarPedidosMexa(pedidos) {
    localStorage.setItem("pedidosMexa", JSON.stringify(pedidos));
}

/* =====================================================
   UTILIDADES
===================================================== */

function normalizarCorreo(correo) {
    return String(correo).trim().toLowerCase();
}

function crearIdCuenta() {
    return "MX-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
}

async function hashPassword(password) {
    if (window.crypto && window.crypto.subtle) {
        try {
            const datos = new TextEncoder().encode(password);
            const buffer = await crypto.subtle.digest("SHA-256", datos);
            return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
        } catch (e) {}
    }
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        hash = ((hash << 5) - hash) + password.charCodeAt(i);
        hash |= 0;
    }
    return String(hash);
}

/* =====================================================
   NOTIFICACIÓN TOAST
===================================================== */

function mostrarNotificacionCuenta(titulo, mensaje, icono = "✓") {
    const notificacion = document.getElementById("notificacionCuenta");
    const tituloElemento = document.getElementById("tituloNotificacion");
    const mensajeElemento = document.getElementById("mensajeNotificacion");
    const iconoElemento = document.getElementById("iconoNotificacion");

    if (!notificacion) return;

    if (tituloElemento) tituloElemento.textContent = titulo;
    if (mensajeElemento) mensajeElemento.textContent = mensaje;
    if (iconoElemento) iconoElemento.textContent = icono;

    notificacion.classList.add("mostrar");
    clearTimeout(notificacion._timer);
    notificacion._timer = setTimeout(() => {
        notificacion.classList.remove("mostrar");
    }, 4000);
}

/* =====================================================
   CUENTAS DEMO INICIALES
===================================================== */

async function inicializarCuentasDemo() {
    const cuentas = obtenerCuentas();

    const cuentasDemo = [
        {
            nombre: "Alexandra",
            apellidos: "Gómez",
            correo: "usuario@mexamexa.com",
            telefono: "9511234567",
            password: "Usuario123",
            rol: "usuario"
        },
        {
            nombre: "Carlos",
            apellidos: "Ramírez",
            correo: "chofer@mexamexa.com",
            telefono: "9512345678",
            password: "Chofer123",
            rol: "chofer",
            estadoChofer: "disponible",
            entregas: 14
        },
        {
            nombre: "Administrador",
            apellidos: "Mercado Mexa",
            correo: "admin@mexamexa.com",
            telefono: "9513456789",
            password: "Admin123",
            rol: "admin"
        }
    ];

    for (const demo of cuentasDemo) {
        const existe = cuentas.some(c => normalizarCorreo(c.correo) === normalizarCorreo(demo.correo));
        if (!existe) {
            const passHash = await hashPassword(demo.password);
            cuentas.push({
                id: crearIdCuenta(),
                nombre: demo.nombre,
                apellidos: demo.apellidos,
                correo: normalizarCorreo(demo.correo),
                telefono: demo.telefono,
                passwordHash: passHash,
                rol: demo.rol,
                estadoChofer: demo.estadoChofer || "disponible",
                entregas: demo.entregas || 0,
                activo: true,
                fechaRegistro: new Date().toISOString(),
                cuentaDemo: true
            });
        }
    }

    guardarCuentas(cuentas);
    obtenerPedidosMexa(); // inicializa pedidos de demo
}

/* =====================================================
   ACTUALIZAR BOTÓN DE CUENTA EN EL HEADER
===================================================== */

function actualizarBotonCuenta() {
    const boton = document.getElementById("botonCuenta");
    if (!boton) return;

    const sesion = obtenerSesionActual();
    if (!sesion) {
        boton.innerHTML = "👤";
        boton.title = "Mi Cuenta | Iniciar sesión";
        boton.style.borderColor = "";
        boton.style.background = "";
        return;
    }

    let iconoRol = "👤";
    let colorBorde = "#1683ff";
    if (sesion.rol === "chofer") {
        iconoRol = "🚚";
        colorBorde = "#ff7700";
    } else if (sesion.rol === "admin") {
        iconoRol = "⚙️";
        colorBorde = "#ff4b12";
    }

    const inicial = sesion.nombre ? sesion.nombre.charAt(0).toUpperCase() : iconoRol;
    boton.innerHTML = `<span style="font-size: 13px; font-weight: 900;">${inicial}</span>`;
    boton.title = `${sesion.nombre} (${sesion.rol.toUpperCase()}) - Clic para ver panel`;
    boton.style.borderColor = colorBorde;
    boton.style.boxShadow = `0 0 0 2px ${colorBorde}33`;
}

/* =====================================================
   RESTAURAR CUENTA INICIAL (NO LOGUEADO)
===================================================== */

function restaurarCuentaInicial() {
    const modalCuenta = document.getElementById("modalCuenta");
    if (!modalCuenta) return;

    const contenido = modalCuenta.querySelector(".contenido-modal");
    if (!contenido) return;

    contenido.innerHTML = `
        <button class="cerrar-modal" id="cerrarCuenta" type="button">×</button>

        <div class="cuenta-icon">👤</div>

        <span class="section-label">MERCADO MEXA</span>
        <h2>MI CUENTA</h2>
        <p class="modal-subtitulo">
            Inicia sesión o crea una cuenta para disfrutar de Mercado Mexa y acceder a tu panel.
        </p>

        <!-- PREVIEW DE ROLES -->
        <div class="roles-preview-grid">
            <div class="rol-preview-card" onclick="abrirRegistroConRol('usuario')">
                <div class="rol-card-badge">👤</div>
                <strong>Usuario</strong>
                <p>Haz compras, favoritos y pedidos a domicilio.</p>
                <span class="rol-pill">Cliente</span>
            </div>

            <div class="rol-preview-card" onclick="abrirRegistroConRol('chofer')">
                <div class="rol-card-badge">🚚</div>
                <strong>Chofer</strong>
                <p>Gestiona entregas y pedidos en ruta.</p>
                <span class="rol-pill">Repartidor</span>
            </div>

            <div class="rol-preview-card" onclick="abrirRegistroConRol('admin')">
                <div class="rol-card-badge">⚙️</div>
                <strong>Administrador</strong>
                <p>Control de usuarios, pedidos y tiendas.</p>
                <span class="rol-pill">Control total</span>
            </div>
        </div>

        <div class="acciones-cuenta-inicial">
            <button class="btn-naranja grande" id="btnAbrirLogin" type="button">
                INICIAR SESIÓN
            </button>
            <button class="btn-outline grande" id="btnAbrirRegistro" type="button">
                CREAR CUENTA
            </button>
        </div>
    `;

    conectarEventosIniciales();
}

function abrirRegistroConRol(rol) {
    const modalCuenta = document.getElementById("modalCuenta");
    const modalRegistro = document.getElementById("modalRegistro");
    modalCuenta?.classList.remove("activa");
    modalRegistro?.classList.add("activa");

    const radio = document.querySelector(`input[name="registroRol"][value="${rol}"]`);
    if (radio) radio.checked = true;
}

/* =====================================================
   CONECTAR EVENTOS INICIALES
===================================================== */

function conectarEventosIniciales() {
    const modalCuenta = document.getElementById("modalCuenta");
    const modalLogin = document.getElementById("modalLogin");
    const modalRegistro = document.getElementById("modalRegistro");

    document.getElementById("cerrarCuenta")?.addEventListener("click", () => {
        modalCuenta?.classList.remove("activa");
    });

    document.getElementById("btnAbrirLogin")?.addEventListener("click", () => {
        modalCuenta?.classList.remove("activa");
        modalLogin?.classList.add("activa");
    });

    document.getElementById("btnAbrirRegistro")?.addEventListener("click", () => {
        modalCuenta?.classList.remove("activa");
        modalRegistro?.classList.add("activa");
    });
}

/* =====================================================
   MOSTRAR CUENTA POR ROL (SESIÓN INICIADA)
===================================================== */

function mostrarCuentaPorRol(sesion) {
    const modalCuenta = document.getElementById("modalCuenta");
    if (!modalCuenta) return;

    const contenido = modalCuenta.querySelector(".contenido-modal");
    if (!contenido) return;

    let iconoRol = "👤";
    let nombreRol = "USUARIO (CLIENTE)";
    let claseBadge = "badge-rol-usuario";

    if (sesion.rol === "chofer") {
        iconoRol = "🚚";
        nombreRol = "CHOFER (REPARTIDOR)";
        claseBadge = "badge-rol-chofer";
    } else if (sesion.rol === "admin") {
        iconoRol = "⚙️";
        nombreRol = "ADMINISTRADOR GENERAL";
        claseBadge = "badge-rol-admin";
    }

    const inicial = sesion.nombre ? sesion.nombre.charAt(0).toUpperCase() : "U";

    // Panel específico según el rol
    let panelHTML = "";
    const pedidos = obtenerPedidosMexa();
    const cuentas = obtenerCuentas();

    /* =========================
       1. PANEL USUARIO
    ========================= */
    if (sesion.rol === "usuario") {
        const pedidosUsuario = pedidos.filter(p => p.cliente.toLowerCase().includes(sesion.nombre.toLowerCase()) || p.cliente === "Alexandra Gómez");
        
        panelHTML = `
            <div class="panel-rol-contenedor">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong style="font-size: 12px; text-transform: uppercase;">📦 Mis Pedidos Recientes:</strong>
                    <span style="font-size: 10px; color: var(--naranja); font-weight: 800;">${pedidosUsuario.length} activo(s)</span>
                </div>

                ${pedidosUsuario.map(ped => `
                    <div class="pedido-chofer-card">
                        <div class="pedido-chofer-head">
                            <strong>Pedido #${ped.id}</strong>
                            <span class="pedido-chofer-badge" style="background: ${ped.estado === 'entregado' ? '#eafaf1; color: #27ae60' : '#fff0e5; color: #ff4b12'}">
                                ${ped.estado === 'entregado' ? '✅ ENTREGADO' : (ped.estado === 'en_ruta' ? '🚚 EN CAMINO' : '⏳ PENDIENTE')}
                            </span>
                        </div>
                        <div class="pedido-chofer-datos">
                            <p><strong>Productos:</strong> ${escapeHTMLSafe(ped.productos)}</p>
                            <p><strong>Dirección de entrega:</strong> ${escapeHTMLSafe(ped.direccion)}</p>
                            <p><strong>Total:</strong> <b style="color: var(--naranja);">$${Number(ped.total).toFixed(2)} MXN</b></p>
                        </div>
                    </div>
                `).join('')}

                <div class="usuario-accesos-grid" style="margin-top: 8px;">
                    <button type="button" class="usuario-acceso-btn" id="btnIrCatalogo">
                        <span>🛒</span> Ir al Catálogo
                    </button>
                    <button type="button" class="usuario-acceso-btn" id="btnVerMiLista">
                        <span>📋</span> Ver Mi Lista
                    </button>
                    <button type="button" class="usuario-acceso-btn" id="btnVerFavoritos">
                        <span>❤️</span> Mis Favoritos
                    </button>
                    <button type="button" class="usuario-acceso-btn" id="btnVerMapaTiendas">
                        <span>🗺️</span> Tiendas Cercanas
                    </button>
                </div>
            </div>
        `;
    }

    /* =========================
       2. PANEL CHOFER
    ========================= */
    else if (sesion.rol === "chofer") {
        const pedidosAsignados = pedidos.filter(p => p.estado !== "entregado");
        const pedidosEntregados = pedidos.filter(p => p.estado === "entregado");
        const estadoChofer = sesion.estadoChofer || "disponible";

        panelHTML = `
            <div class="panel-rol-contenedor">
                <!-- ESTADO DEL CHOFER -->
                <div class="chofer-estado-tarjeta">
                    <div class="chofer-estado-info">
                        <strong>Estado del Repartidor:</strong>
                        <small id="textoEstadoChofer">
                            ${estadoChofer === 'disponible' ? '🟢 Disponible para recibir entregas' : '🟡 En ruta realizando entregas'}
                        </small>
                    </div>
                    <button type="button" class="btn-toggle-estado-chofer ${estadoChofer === 'en_ruta' ? 'en-ruta' : ''}" id="btnToggleEstadoChofer">
                        ${estadoChofer === 'disponible' ? 'PASAR A RUTA' : 'DISPONIBLE'}
                    </button>
                </div>

                <!-- RESUMEN DE ENTREGAS -->
                <div class="admin-metricas-grid" style="margin-top: 5px;">
                    <div class="admin-metrica-card">
                        <span>📦</span>
                        <strong id="contadorPendientes">${pedidosAsignados.length}</strong>
                        <small>Por Entregar</small>
                    </div>
                    <div class="admin-metrica-card">
                        <span>✅</span>
                        <strong id="contadorEntregados">${sesion.entregas || pedidosEntregados.length}</strong>
                        <small>Completadas</small>
                    </div>
                </div>

                <!-- PEDIDOS EN COLA -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0 6px;">
                    <strong style="font-size: 12px; text-transform: uppercase;">🚚 Pedidos Asignados para Entregar:</strong>
                </div>

                ${pedidosAsignados.length === 0 ? `
                    <div style="padding: 20px; text-align: center; background: white; border: 1.5px dashed #ded9d0; border-radius: 12px; color: var(--gris); font-size: 11px;">
                        🎉 ¡Excelente trabajo! No tienes entregas pendientes por ahora.
                    </div>
                ` : pedidosAsignados.map(ped => `
                    <div class="pedido-chofer-card" id="card-pedido-${ped.id}">
                        <div class="pedido-chofer-head">
                            <strong>Pedido #${ped.id}</strong>
                            <span class="pedido-chofer-badge">
                                ${ped.estado === 'en_ruta' ? 'EN RUTA' : 'PENDIENTE'}
                            </span>
                        </div>
                        <div class="pedido-chofer-datos">
                            <p><strong>Cliente:</strong> ${escapeHTMLSafe(ped.cliente)} (📞 ${ped.telefono})</p>
                            <p><strong>Destino:</strong> 📍 ${escapeHTMLSafe(ped.direccion)}</p>
                            <p><strong>Productos:</strong> ${escapeHTMLSafe(ped.productos)}</p>
                            <p><strong>Cobro al entregar:</strong> <b style="color: var(--naranja);">$${Number(ped.total).toFixed(2)} MXN</b></p>
                        </div>
                        <button type="button" class="btn-completar-entrega" onclick="completarEntregaChofer('${ped.id}')">
                            ✅ Marcar Pedido como Entregado
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /* =========================
       3. PANEL ADMINISTRADOR
    ========================= */
    else if (sesion.rol === "admin") {
        const totalUsuarios = cuentas.filter(c => c.rol === "usuario").length;
        const totalChoferes = cuentas.filter(c => c.rol === "chofer").length;
        const totalVentas = pedidos.reduce((acc, p) => acc + Number(p.total || 0), 0);

        panelHTML = `
            <div class="panel-rol-contenedor">
                <!-- MÉTRICAS EN TIEMPO REAL -->
                <div class="admin-metricas-grid">
                    <div class="admin-metrica-card">
                        <span>👥</span>
                        <strong>${totalUsuarios}</strong>
                        <small>Clientes</small>
                    </div>
                    <div class="admin-metrica-card">
                        <span>🚚</span>
                        <strong>${totalChoferes}</strong>
                        <small>Choferes</small>
                    </div>
                    <div class="admin-metrica-card">
                        <span>📦</span>
                        <strong>${pedidos.length}</strong>
                        <small>Pedidos</small>
                    </div>
                    <div class="admin-metrica-card">
                        <span>💰</span>
                        <strong>$${totalVentas.toFixed(0)}</strong>
                        <small>Ventas ($ MXN)</small>
                    </div>
                </div>

                <!-- USUARIOS REGISTRADOS -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0 6px;">
                    <strong style="font-size: 12px; text-transform: uppercase;">👥 Gestión de Cuentas y Roles:</strong>
                    <small style="font-size: 10px; color: var(--gris);">${cuentas.length} cuentas registradas</small>
                </div>

                <div class="admin-usuarios-lista">
                    ${cuentas.map(u => `
                        <div class="admin-user-item">
                            <div class="admin-user-info">
                                <strong>${escapeHTMLSafe(u.nombre)} ${escapeHTMLSafe(u.apellidos || '')}</strong>
                                <small>${escapeHTMLSafe(u.correo)}</small>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span class="badge-rol-tag badge-rol-${u.rol || 'usuario'}" style="font-size: 8px; padding: 2px 7px;">
                                    ${(u.rol || 'usuario').toUpperCase()}
                                </span>
                                <button type="button" onclick="cambiarRolUsuarioAdmin('${u.id}')" title="Cambiar rol" style="padding: 3px 8px; border: 1px solid #ded9d0; border-radius: 6px; background: white; font-size: 9px; cursor: pointer;">
                                    ↻ Rol
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /* =========================
       RENDERIZAR CONTENIDO
    ========================= */
    contenido.innerHTML = `
        <button class="cerrar-modal" id="cerrarCuentaRol" type="button">×</button>

        <span class="section-label">MERCADO MEXA - PANEL DE CONTROL</span>

        <!-- CABECERA DEL PERFIL -->
        <div class="perfil-usuario-cabecera">
            <div class="perfil-avatar-badge">${inicial}</div>
            <div class="perfil-info-datos">
                <h3>${escapeHTMLSafe(sesion.nombre)} ${escapeHTMLSafe(sesion.apellidos || '')}</h3>
                <p>${escapeHTMLSafe(sesion.correo)} ${sesion.telefono ? '• 📞 ' + escapeHTMLSafe(sesion.telefono) : ''}</p>
                <span class="badge-rol-tag ${claseBadge}">
                    ${iconoRol} ${nombreRol}
                </span>
            </div>
        </div>

        <!-- SWITCHER DE PRUEBA (CAMBIAR ROL AL VUELO) -->
        <div class="switcher-roles-prueba">
            <small>⚡ Probar otro rol en este momento (1 clic):</small>
            <div class="switcher-pills">
                <button type="button" class="btn-switch-rol ${sesion.rol === 'usuario' ? 'activo' : ''}" onclick="cambiarRolSesion('usuario')">
                    👤 Usuario
                </button>
                <button type="button" class="btn-switch-rol ${sesion.rol === 'chofer' ? 'activo' : ''}" onclick="cambiarRolSesion('chofer')">
                    🚚 Chofer
                </button>
                <button type="button" class="btn-switch-rol ${sesion.rol === 'admin' ? 'activo' : ''}" onclick="cambiarRolSesion('admin')">
                    ⚙️ Admin
                </button>
            </div>
        </div>

        <!-- PANEL DE ACCIÓN SEGÚN ROL -->
        ${panelHTML}

        <!-- BOTÓN CERRAR SESIÓN -->
        <button type="button" class="btn-cerrar-sesion-mexa" id="btnCerrarSesionMexa">
            🚪 CERRAR SESIÓN
        </button>
    `;

    // Conectar eventos del panel
    document.getElementById("cerrarCuentaRol")?.addEventListener("click", () => {
        modalCuenta?.classList.remove("activa");
    });

    document.getElementById("btnCerrarSesionMexa")?.addEventListener("click", () => {
        cerrarSesionMexa();
        restaurarCuentaInicial();
        modalCuenta?.classList.remove("activa");
        mostrarNotificacionCuenta("Sesión cerrada", "Has salido de tu cuenta correctamente.", "👋");
    });

    // Eventos específicos de Usuario
    document.getElementById("btnIrCatalogo")?.addEventListener("click", () => {
        modalCuenta?.classList.remove("activa");
        document.querySelector('[data-target="catalogo"]')?.click();
    });
    document.getElementById("btnVerMiLista")?.addEventListener("click", () => {
        modalCuenta?.classList.remove("activa");
        document.getElementById("botonLista")?.click();
    });
    document.getElementById("btnVerFavoritos")?.addEventListener("click", () => {
        modalCuenta?.classList.remove("activa");
        document.querySelector('[data-target="favoritos"]')?.click();
    });
    document.getElementById("btnVerMapaTiendas")?.addEventListener("click", () => {
        modalCuenta?.classList.remove("activa");
        document.querySelector('[data-target="mapa"]')?.click();
    });

    // Eventos específicos de Chofer
    document.getElementById("btnToggleEstadoChofer")?.addEventListener("click", () => {
        const nuevoEstado = (sesion.estadoChofer === "disponible") ? "en_ruta" : "disponible";
        sesion.estadoChofer = nuevoEstado;
        guardarSesion(sesion);
        mostrarCuentaPorRol(sesion);
        mostrarNotificacionCuenta(
            nuevoEstado === "en_ruta" ? "Estado: En Ruta" : "Estado: Disponible",
            nuevoEstado === "en_ruta" ? "Ahora apareces en camino con pedidos." : "Disponible para recibir asignaciones.",
            nuevoEstado === "en_ruta" ? "🚚" : "🟢"
        );
    });
}

/* =====================================================
   ACCIONES GLOBALES DE ROLES
===================================================== */

// Cambiar de rol en la sesión para pruebas
window.cambiarRolSesion = function(nuevoRol) {
    const sesion = obtenerSesionActual();
    if (!sesion) return;

    sesion.rol = nuevoRol;
    guardarSesion(sesion);
    actualizarBotonCuenta();
    mostrarCuentaPorRol(sesion);

    const nombres = { usuario: "Usuario (Cliente)", chofer: "Chofer (Repartidor)", admin: "Administrador" };
    const iconos = { usuario: "👤", chofer: "🚚", admin: "⚙️" };
    mostrarNotificacionCuenta("Rol cambiado", `Ahora estás visualizando el panel como ${nombres[nuevoRol]}.`, iconos[nuevoRol]);
};

// Chofer completa entrega
window.completarEntregaChofer = function(pedidoId) {
    const pedidos = obtenerPedidosMexa();
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;

    pedido.estado = "entregado";
    guardarPedidosMexa(pedidos);

    const sesion = obtenerSesionActual();
    if (sesion) {
        sesion.entregas = (sesion.entregas || 0) + 1;
        guardarSesion(sesion);
    }

    mostrarCuentaPorRol(sesion);
    mostrarNotificacionCuenta("¡Entrega completada!", `El pedido #${pedidoId} fue marcado como entregado correctamente.`, "✅");
};

// Admin cambia el rol de un usuario registrado
window.cambiarRolUsuarioAdmin = function(usuarioId) {
    const cuentas = obtenerCuentas();
    const cuenta = cuentas.find(c => c.id === usuarioId);
    if (!cuenta) return;

    const roles = ["usuario", "chofer", "admin"];
    const siguienteIndex = (roles.indexOf(cuenta.rol) + 1) % roles.length;
    cuenta.rol = roles[siguienteIndex];
    guardarCuentas(cuentas);

    const sesion = obtenerSesionActual();
    if (sesion && sesion.id === usuarioId) {
        sesion.rol = cuenta.rol;
        guardarSesion(sesion);
        actualizarBotonCuenta();
    }

    mostrarCuentaPorRol(sesion);
    mostrarNotificacionCuenta("Rol actualizado", `${cuenta.nombre} ahora tiene el rol: ${cuenta.rol.toUpperCase()}.`, "↻");
};

/* =====================================================
   REGISTRO
===================================================== */

function inicializarFormularioRegistro() {
    const formRegistro = document.getElementById("formRegistro");
    const modalRegistro = document.getElementById("modalRegistro");
    const modalLogin = document.getElementById("modalLogin");

    formRegistro?.addEventListener("submit", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const nombre = document.getElementById("registroNombre")?.value.trim() || "";
        const apellidos = document.getElementById("registroApellidos")?.value.trim() || "";
        const correo = normalizarCorreo(document.getElementById("registroCorreo")?.value || "");
        const telefono = document.getElementById("registroTelefono")?.value.trim() || "";
        const password = document.getElementById("registroPassword")?.value || "";
        const passwordConfirm = document.getElementById("registroPasswordConfirm")?.value || "";
        const terminos = document.getElementById("registroTerminos")?.checked || false;
        
        // Obtener rol seleccionado
        const rolSeleccionado = document.querySelector('input[name="registroRol"]:checked')?.value || "usuario";

        if (!nombre || !apellidos || !correo || !telefono || !password || !passwordConfirm) {
            mostrarNotificacionCuenta("Datos incompletos", "Por favor completa todos los campos requeridos.", "⚠️");
            return;
        }

        const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
        if (!correoValido) {
            mostrarNotificacionCuenta("Correo no válido", "Ingresa un correo electrónico válido.", "⚠️");
            return;
        }

        if (password.length < 6) {
            mostrarNotificacionCuenta("Contraseña corta", "La contraseña debe tener al menos 6 caracteres.", "⚠️");
            return;
        }

        if (password !== passwordConfirm) {
            mostrarNotificacionCuenta("Contraseñas distintas", "Las contraseñas no coinciden.", "⚠️");
            return;
        }

        if (!terminos) {
            mostrarNotificacionCuenta("Acepta los términos", "Debes aceptar los términos y condiciones.", "⚠️");
            return;
        }

        const cuentas = obtenerCuentas();
        const existe = cuentas.some(c => normalizarCorreo(c.correo) === correo);
        if (existe) {
            mostrarNotificacionCuenta("Correo ya registrado", "Ya existe una cuenta con este correo.", "⚠️");
            return;
        }

        const passwordHash = await hashPassword(password);
        const nuevaCuenta = {
            id: crearIdCuenta(),
            nombre,
            apellidos,
            correo,
            telefono,
            passwordHash,
            rol: rolSeleccionado,
            estadoChofer: "disponible",
            entregas: 0,
            activo: true,
            fechaRegistro: new Date().toISOString()
        };

        cuentas.push(nuevaCuenta);
        guardarCuentas(cuentas);
        formRegistro.reset();

        // Iniciar sesión directamente con la nueva cuenta
        guardarSesion(nuevaCuenta);
        actualizarBotonCuenta();
        modalRegistro?.classList.remove("activa");

        const nombresRoles = { usuario: "Cliente / Usuario", chofer: "Chofer / Repartidor", admin: "Administrador" };
        mostrarNotificacionCuenta(
            "¡Cuenta creada con éxito!",
            `Bienvenido(a) ${nombre}. Has ingresado con el rol de ${nombresRoles[rolSeleccionado]}.`,
            "🎉"
        );

        // Abrir panel
        const modalCuenta = document.getElementById("modalCuenta");
        mostrarCuentaPorRol(nuevaCuenta);
        modalCuenta?.classList.add("activa");
    });
}

/* =====================================================
   LOGIN
===================================================== */

function inicializarFormularioLogin() {
    const formLogin = document.getElementById("formLogin");
    const modalLogin = document.getElementById("modalLogin");
    const modalCuenta = document.getElementById("modalCuenta");

    formLogin?.addEventListener("submit", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const correo = normalizarCorreo(document.getElementById("loginCorreo")?.value || "");
        const password = document.getElementById("loginPassword")?.value || "";

        if (!correo || !password) {
            mostrarNotificacionCuenta("Datos incompletos", "Ingresa tu correo y contraseña.", "⚠️");
            return;
        }

        const cuentas = obtenerCuentas();
        const cuenta = cuentas.find(c => normalizarCorreo(c.correo) === correo);

        if (!cuenta) {
            mostrarNotificacionCuenta("Cuenta no encontrada", "No existe ninguna cuenta con ese correo.", "❌");
            return;
        }

        if (cuenta.activo === false) {
            mostrarNotificacionCuenta("Cuenta desactivada", "Esta cuenta está temporalmente suspendida.", "❌");
            return;
        }

        const passwordHash = await hashPassword(password);
        if (cuenta.passwordHash !== passwordHash) {
            mostrarNotificacionCuenta("Contraseña incorrecta", "Verifica tu contraseña e intenta de nuevo.", "❌");
            return;
        }

        guardarSesion(cuenta);
        actualizarBotonCuenta();
        modalLogin?.classList.remove("activa");
        formLogin.reset();

        mostrarNotificacionCuenta("¡Bienvenido(a)!", `Hola ${cuenta.nombre}, has iniciado sesión como ${cuenta.rol.toUpperCase()}.`, "👋");

        mostrarCuentaPorRol(cuenta);
        modalCuenta?.classList.add("activa");
    });

    // BOTONES DE ACCESO RÁPIDO DEMO
    document.querySelectorAll(".btn-demo-rol").forEach(btn => {
        btn.addEventListener("click", () => {
            const demoRol = btn.getAttribute("data-demo");
            const cuentas = obtenerCuentas();
            const cuentaDemo = cuentas.find(c => c.rol === demoRol && c.cuentaDemo);

            if (cuentaDemo) {
                guardarSesion(cuentaDemo);
                actualizarBotonCuenta();
                modalLogin?.classList.remove("activa");

                mostrarNotificacionCuenta(
                    "¡Acceso de prueba!",
                    `Ingresaste como ${cuentaDemo.nombre} (${cuentaDemo.rol.toUpperCase()}).`,
                    "⚡"
                );

                mostrarCuentaPorRol(cuentaDemo);
                modalCuenta?.classList.add("activa");
            }
        });
    });
}

/* =====================================================
   INICIALIZACIÓN GENERAL DE EVENTOS DE MODALES
===================================================== */

function iniciarModuloCuentas() {
    const botonCuenta = document.getElementById("botonCuenta");
    const modalCuenta = document.getElementById("modalCuenta");
    const modalLogin = document.getElementById("modalLogin");
    const modalRegistro = document.getElementById("modalRegistro");
    const modalTerminos = document.getElementById("modalTerminos");

    // Botón principal de cuenta en el header
    botonCuenta?.addEventListener("click", () => {
        const sesion = obtenerSesionActual();
        if (sesion) {
            mostrarCuentaPorRol(sesion);
        } else {
            restaurarCuentaInicial();
        }
        modalCuenta?.classList.add("activa");
    });

    // Cerrar Login
    document.getElementById("cerrarLogin")?.addEventListener("click", () => {
        modalLogin?.classList.remove("activa");
    });

    // Cerrar Registro
    document.getElementById("cerrarRegistro")?.addEventListener("click", () => {
        modalRegistro?.classList.remove("activa");
    });

    // Switch Login -> Registro
    document.getElementById("btnRegistroDesdeLogin")?.addEventListener("click", () => {
        modalLogin?.classList.remove("activa");
        modalRegistro?.classList.add("activa");
    });

    // Switch Registro -> Login
    document.getElementById("btnLoginDesdeRegistro")?.addEventListener("click", () => {
        modalRegistro?.classList.remove("activa");
        modalLogin?.classList.add("activa");
    });

    // Recuperar Contraseña
    document.getElementById("btnRecuperarPassword")?.addEventListener("click", () => {
        mostrarNotificacionCuenta("Recuperar contraseña", "Para pruebas, utiliza las cuentas demo disponibles con 1 clic.", "ℹ️");
    });

    // Términos y condiciones
    document.getElementById("btnVerTerminos")?.addEventListener("click", (e) => {
        e.preventDefault();
        modalTerminos?.classList.add("activa");
    });

    document.getElementById("cerrarTerminos")?.addEventListener("click", () => {
        modalTerminos?.classList.remove("activa");
    });

    document.getElementById("btnAceptarTerminos")?.addEventListener("click", () => {
        const check = document.getElementById("registroTerminos");
        if (check) check.checked = true;
        modalTerminos?.classList.remove("activa");
        mostrarNotificacionCuenta("Términos aceptados", "Has aceptado los términos y condiciones de uso.", "✓");
    });

    // Cerrar modales al hacer clic en el backdrop oscuro
    [modalCuenta, modalLogin, modalRegistro, modalTerminos].forEach(modal => {
        modal?.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.remove("activa");
            }
        });
    });

    // Conectar formularios
    inicializarFormularioRegistro();
    inicializarFormularioLogin();
    conectarEventosIniciales();

    // Actualizar estado en header
    actualizarBotonCuenta();
}

// Arrancar al cargar el documento
document.addEventListener("DOMContentLoaded", async () => {
    await inicializarCuentasDemo();
    iniciarModuloCuentas();
});

// Fallback por si DOM ya estaba listo
if (document.readyState === "interactive" || document.readyState === "complete") {
    inicializarCuentasDemo().then(iniciarModuloCuentas);
}