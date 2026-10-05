-- Ejecutar una sola vez en las instalaciones existentes de Mercado Mexa.
ALTER TABLE pedidos
    ADD COLUMN estado_pago VARCHAR(20) NOT NULL DEFAULT 'no_aplica',
    ADD COLUMN mp_preferencia_id VARCHAR(100) NULL,
    ADD COLUMN mp_pago_id VARCHAR(100) NULL,
    ADD COLUMN mp_carrito_limpiado TINYINT(1) NOT NULL DEFAULT 0;
