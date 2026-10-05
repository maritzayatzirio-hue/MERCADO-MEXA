# MERCADO MEXA

## Mercado Pago (Checkout Pro)

El checkout redirige a Mercado Pago Checkout Pro. Los datos de tarjeta se capturan
en la página de Mercado Pago; esta tienda no recibe ni almacena el número ni el CVV.
El pedido y el código único de entrega solo se muestran como pagados después de
verificar el pago en el servidor.

Antes de habilitar el cobro:

1. Configura en el entorno del servidor PHP `MERCADO_PAGO_ACCESS_TOKEN` con el
   access token de prueba o producción correspondiente a la cuenta de Mercado Pago.
2. Configura `MERCADO_MEXA_BASE_URL` con la URL HTTPS pública de la raíz de la tienda
   (por ejemplo, `https://tienda.example.com/mercado-mexa`, sin `/` final).
3. Configura `MERCADO_PAGO_WEBHOOK_SECRET` con la clave secreta de firma de
   notificaciones de Mercado Pago. Registra en Mercado Pago la URL
   `https://tu-dominio/api/mercadopago_webhook.php` para notificaciones de pagos.
4. Asegúrate de que PHP tenga habilitada la extensión cURL y que el servidor pueda
   recibir notificaciones HTTPS desde Mercado Pago.
5. En una base existente, ejecuta una sola vez
   `database/migracion_mercado_pago.sql`. En una instalación nueva, importa
   `database/mercado_mexa.sql`, que ya incluye las columnas de pago.

No publiques ni guardes el access token o el secreto de webhook en JavaScript,
HTML, archivos versionados ni mensajes. Configúralos como variables privadas del
entorno del servidor. Valida primero el flujo con credenciales de prueba.

Al confirmarse el pago, el cliente puede descargar el ticket PDF y abrir WhatsApp
con un mensaje preparado. Por seguridad y las limitaciones de WhatsApp Web, debe
adjuntar manualmente el PDF descargado en la conversación.
