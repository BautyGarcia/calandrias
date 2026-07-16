-- Backstop de idempotencia para el webhook de MercadoPago.
--
-- `getReservationByMpPaymentId` es un check-then-insert sin garantía atómica:
-- dos notificaciones aprobadas simultáneas del mismo pago podrían pasar ambas el
-- chequeo y generar dos reservas. Este índice único parcial hace que el segundo
-- INSERT falle con unique_violation (Postgres 23505), que la capa de datos
-- traduce a Error('DUPLICATE_MP_PAYMENT') y el webhook trata como "ya procesado".
--
-- Es PARCIAL (`where mp_payment_id is not null`) para no colisionar entre las
-- muchas reservas sin pago de MP (bloqueos, reservas de Airbnb, pendientes),
-- cuyo `mp_payment_id` es NULL.
create unique index if not exists uq_reservations_mp_payment_id
    on reservations (mp_payment_id)
    where mp_payment_id is not null;
