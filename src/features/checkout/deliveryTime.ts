/**
 * Hora de entrega elegida: "Lo antes posible" o una hora de HOY en pasos de 15 minutos, desde ahora
 * hasta las 23:45, siempre en hora de Cuba (nunca la del teléfono: si el reloj del cliente está mal,
 * las opciones no se corren). Es informativa para el equipo (viaja como `scheduledFor`); el servidor
 * decide si el pedido se acepta según su horario y su corte del día.
 */
export const ASAP_LABEL = 'Lo antes posible';
const STEP_MINUTES = 15;
const LAST_SLOT_MINUTES = 23 * 60 + 45;
export const HAVANA_TIME_ZONE = 'America/Havana';

/** Minutos transcurridos del día en La Habana (0–1439). */
export function havanaMinutesOfDay(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: HAVANA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return (hour % 24) * 60 + minute;
}

/** "7:30 pm" para unos minutos del día. */
export function formatSlot(minutesOfDay: number): string {
  const hour24 = Math.floor(minutesOfDay / 60);
  const minute = minutesOfDay % 60;
  const suffix = hour24 >= 12 ? 'pm' : 'am';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

/** Horas de hoy disponibles: desde el próximo cuarto de hora hasta las 23:45 (vacío si ya pasó). */
export function deliveryTimeOptions(now: Date): string[] {
  const first = (Math.floor(havanaMinutesOfDay(now) / STEP_MINUTES) + 1) * STEP_MINUTES;
  const slots: string[] = [];
  for (let minutes = first; minutes <= LAST_SLOT_MINUTES; minutes += STEP_MINUTES) slots.push(formatSlot(minutes));
  return slots;
}

/** Lo que se manda al servidor: "Lo antes posible" u "Hoy 7:30 pm". */
export function scheduledForValue(choice: string | null): string {
  return choice ? `Hoy ${choice}` : ASAP_LABEL;
}
