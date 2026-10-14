import { useCallback, useState } from 'react';
import type { DeliveryLocation } from '../types/backend/location';

export type DeviceLocationState = 'idle' | 'loading' | 'granted' | 'denied' | 'error';

/**
 * Pin de ubicación opcional vía GPS del navegador ("usar mi ubicación actual"). Nunca bloquea: si
 * el navegador no soporta geolocalización, o la persona la niega, o falla, el flujo sigue con la
 * dirección escrita a mano — ver MandadoPage.tsx.
 */
export function useDeviceLocation() {
  const [state, setState] = useState<DeviceLocationState>('idle');
  const [location, setLocation] = useState<DeliveryLocation | null>(null);

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState('error');
      return;
    }
    setState('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'DEVICE_LOCATION',
        });
        setState('granted');
      },
      () => setState('denied'),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  return { state, location, request };
}
