/* =====================================================
   MERCADO MEXA - Cliente de la API
   Helpers para hablar con los archivos PHP de /api
   ===================================================== */

const API = {
    base: "api/",

    async pedir(ruta, opciones = {}) {
        const respuesta = await fetch(this.base + ruta, {
            method: opciones.method || "GET",
            // Imprescindible para que viaje la cookie de sesion PHP
            credentials: "same-origin",
            headers: { "Content-Type": "application/json", ...opciones.headers },
            body: opciones.body
        });

        // Si el servidor devuelve HTML (por ejemplo un error de PHP)
        // en vez de JSON, esto da un mensaje claro en vez de un error raro.
        const texto = await respuesta.text();
        let datos;
        try {
            datos = JSON.parse(texto);
        } catch (e) {
            throw new Error(`El servidor devolvio una respuesta no valida (HTTP ${respuesta.status})`);
        }

        if (!respuesta.ok || datos.ok === false) {
            throw new Error(datos.error || `Error ${respuesta.status}`);
        }

        return datos;
    },

    /* Catalogo de productos */
    async productos() {
        const datos = await this.pedir("productos.php");
        return datos.categorias;
    },

    /* Tiendas desde la base de datos.
       El id de cada tienda es su slug, la misma clave que
       espera el servidor al confirmar un pedido. */
    async tiendas() {
        const datos = await this.pedir("productos.php");
        return datos.tiendas || [];
    },

    /* Consultar la sesion actual (GET) */
    async sesion() {
        return this.pedir("auth.php");
    },

    /* Iniciar sesion */
    async login(correo, password) {
        return this.pedir("auth.php", {
            method: "POST",
            body: JSON.stringify({ accion: "login", correo, password })
        });
    },

    /* Cambia el estado de ruta del chofer que tiene la sesion
       abierta ("PASAR A RUTA" / "DISPONIBLE"). */
    async estadoChofer(estado) {
        return this.pedir("auth.php", {
            method: "POST",
            body: JSON.stringify({
                accion: "estadoChofer",
                estado
            })
        });
    },

    /* Crear cuenta.
       Nota: el rol SIEMPRE es "usuario". El cliente no puede
       pedir admin ni chofer, porque eso lo decide el servidor. */
    async registro(datos) {
        return this.pedir("auth.php", {
            method: "POST",
            body: JSON.stringify({
                accion: "registro",
                nombre: datos.nombre,
                apellidos: datos.apellidos,
                correo: datos.correo,
                telefono: datos.telefono,
                password: datos.password,
                direccion: datos.direccion || ""
            })
        });
    },

    /* Cerrar sesion */
    async logout() {
        return this.pedir("auth.php", {
            method: "POST",
            body: JSON.stringify({ accion: "logout" })
        });
    },

    /* ---- Carrito (guardado en MySQL) ---- */

    /* Descarga el carrito del servidor */
    async carrito() {
        const datos = await this.pedir("carrito.php");
        return datos.carrito;
    },

    /* Agrega un producto. El precio lo pone el servidor. */
    async carritoAgregar(nombre, cantidad = 1) {
        const datos = await this.pedir("carrito.php", {
            method: "POST",
            body: JSON.stringify({ accion: "agregar", nombre, cantidad })
        });
        return datos.carrito;
    },

    /* Cambia la cantidad. Con 0 se elimina. */
    async carritoCantidad(nombre, cantidad) {
        const datos = await this.pedir("carrito.php", {
            method: "POST",
            body: JSON.stringify({ accion: "cantidad", nombre, cantidad })
        });
        return datos.carrito;
    },

    async carritoEliminar(nombre) {
        const datos = await this.pedir("carrito.php", {
            method: "POST",
            body: JSON.stringify({ accion: "eliminar", nombre })
        });
        return datos.carrito;
    },

    async carritoVaciar() {
        const datos = await this.pedir("carrito.php", {
            method: "POST",
            body: JSON.stringify({ accion: "vaciar" })
        });
        return datos.carrito;
    },

    /* ---- Pedidos (guardados en MySQL) ---- */

    /* Lista los pedidos del usuario */
    async pedidos() {
        const datos = await this.pedir("pedidos.php");
        return datos.pedidos;
    },

    /* Confirma un pedido.
       Los productos y el total los saca el servidor del carrito,
       por eso aqui solo van los datos de entrega. */
    async pedidoCrear(datos) {
        const r = await this.pedir("pedidos.php", {
            method: "POST",
            body: JSON.stringify({
                accion: "crear",
                tienda: datos.tienda,
                modalidad: datos.modalidad,
                direccion: datos.direccion,
                referencias: datos.referencias || "",
                metodoPago: datos.metodoPago || "Efectivo al recibir"
            })
        });
        return r.pedido;
    },

    /* Crea el pedido con precios del servidor y una preferencia de Mercado Pago. */
    async pedidoPagar(datos) {
        const r = await this.pedir("pedidos.php", {
            method: "POST",
            body: JSON.stringify({
                accion: "crear_pago_mp",
                tienda: datos.tienda,
                modalidad: datos.modalidad,
                direccion: datos.direccion,
                referencias: datos.referencias || "",
                cliente: datos.cliente,
                correo: datos.correo,
                telefono: datos.telefono
            })
        });
        return r.pedido;
    },

    /* Confirma el pago consultando Mercado Pago desde el servidor. */
    async pedidoConfirmarPago(folio, paymentId) {
        const r = await this.pedir("pedidos.php", {
            method: "POST",
            body: JSON.stringify({
                accion: "confirmar_pago_mp",
                folio,
                paymentId
            })
        });
        return r.pedido;
    },

    /* Marca un pedido como entregado (solo chofer o admin).
       El codigo es el de 6 digitos que se le dio al cliente,
       y el servidor lo revisa antes de guardar nada. */
    async pedidoEntregar(folio, codigo) {
        const r = await this.pedir("pedidos.php", {
            method: "POST",
            body: JSON.stringify({
                accion: "entregar",
                folio,
                codigo
            })
        });
        return r.pedido;
    },

    /* ---- Usuarios (solo el administrador) ---- */

    /* Lista las cuentas registradas en MySQL.
       El password_hash nunca sale del servidor. */
    async usuarios() {
        const datos = await this.pedir("usuarios.php");
        return datos.usuarios;
    },

    /* Cambia el rol de una cuenta.
       El servidor no deja bajarse al unico administrador. */
    async usuarioRol(usuarioId, rol) {
        const r = await this.pedir("usuarios.php", {
            method: "POST",
            body: JSON.stringify({
                accion: "rol",
                usuarioId,
                rol
            })
        });
        return r.usuario;
    },

    /* ---- Favoritos (guardados en MySQL) ---- */

    async favoritos() {
        const datos = await this.pedir("favoritos.php");
        return datos.favoritos;
    },

    async favoritoAlternar(nombre) {
        return this.pedir("favoritos.php", {
            method: "POST",
            body: JSON.stringify({ accion: "alternar", nombre })
        });
    }
};
