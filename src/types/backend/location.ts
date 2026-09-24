/** Ubicación exacta OPCIONAL de una entrega (pin) — ver docs/BACKEND_API.md §5 y §3. */

/** Cómo se obtuvo el punto. MANUAL_PIN es lo normal; DEVICE_LOCATION solo si se pulsó "Usar mi ubicación". */
export type LocationSource = 'MANUAL_PIN' | 'DEVICE_LOCATION';

export type DeliveryLocation = {
  latitude: number;
  longitude: number;
  /** Metros; solo cuando vino del GPS del dispositivo. */
  accuracy?: number | null;
  source: LocationSource;
};
