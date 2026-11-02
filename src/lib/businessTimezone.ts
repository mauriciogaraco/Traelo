/**
 * Zona horaria del negocio: la hora de Cuba, con la que se calculan las horas de entrega y las fechas de la promo.
 *
 * Es UTC-4 FIJO (`Etc/GMT+4`, con el signo invertido a propósito por la base de datos de zonas), no `America/Havana`:
 * esa zona retrocede una hora el primer domingo de noviembre (UTC-5), y en 2026 Cuba NO cambió el reloj. Con
 * `America/Havana` la web mostraba una hora de menos. Es la misma zona que usa el servidor
 * (`BUSINESS_TIMEZONE` del backend): si algún día cambia allí, cambia aquí.
 */
export const BUSINESS_TIME_ZONE = 'Etc/GMT+4'
