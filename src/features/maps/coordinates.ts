/**
 * Coordenadas del dominio de Tráelo: siempre { latitude, longitude }. MapLibre (y GeoJSON) usan
 * [longitud, latitud] — el orden contrario. TODA conversión pasa por estas funciones para que ese
 * cambio de orden (fuente clásica de errores) viva en un solo lugar.
 */
export type LatLng = { latitude: number; longitude: number };

/** Caja geográfica; es [oeste, sur, este, norte] en MapLibre. */
export type MapBounds = { west: number; south: number; east: number; north: number };

export type LngLatTuple = [longitude: number, latitude: number];
export type LngLatBoundsTuple = [west: number, south: number, east: number, north: number];

export function toLngLat(point: LatLng): LngLatTuple {
  return [point.longitude, point.latitude];
}

export function fromLngLat([longitude, latitude]: readonly number[]): LatLng {
  return { latitude: latitude as number, longitude: longitude as number };
}

export function toBoundsTuple(bounds: MapBounds): LngLatBoundsTuple {
  return [bounds.west, bounds.south, bounds.east, bounds.north];
}

export function fromBoundsTuple([west, south, east, north]: readonly number[]): MapBounds {
  return { west: west as number, south: south as number, east: east as number, north: north as number };
}

/** Separación mínima (~450 m): con un solo punto, o dos muy cerca, el mapa no se pega al marcador. */
const MIN_SPAN = 0.004;
/** Aire alrededor de los puntos para que los marcadores no queden en el borde. */
const PADDING_FACTOR = 1.6;

/** Caja que encuadra todos los puntos dados, con aire alrededor; null si no hay ninguno. */
export function boundsForPoints(points: LatLng[]): MapBounds | null {
  if (points.length === 0) return null;
  const latitudes = points.map((p) => p.latitude);
  const longitudes = points.map((p) => p.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const halfLat = Math.max((maxLat - minLat) * PADDING_FACTOR, MIN_SPAN) / 2;
  const halfLng = Math.max((maxLng - minLng) * PADDING_FACTOR, MIN_SPAN) / 2;
  return { west: centerLng - halfLng, south: centerLat - halfLat, east: centerLng + halfLng, north: centerLat + halfLat };
}

/**
 * Tramo de la ruta que FALTA por recorrer desde `position`: la línea parte del marcador y no
 * dibuja lo que ya quedó atrás, ni deja hueco si el mensajero se apartó un poco de la calle
 * calculada. Busca el segmento de la ruta más cercano (proyección plana local, de sobra precisa a
 * escala de ciudad) y devuelve [posición, ...vértices que siguen]. Siempre ≥ 2 puntos si la ruta
 * no está vacía.
 */
export function routeFromPosition(route: LatLng[], position: LatLng): LatLng[] {
  if (route.length === 0) return [];
  if (route.length === 1) return [position, route[0] as LatLng];

  const metersPerDegLat = 110_540;
  const metersPerDegLng = 111_320 * Math.cos((position.latitude * Math.PI) / 180);
  const toXY = (p: LatLng) => ({
    x: (p.longitude - position.longitude) * metersPerDegLng,
    y: (p.latitude - position.latitude) * metersPerDegLat,
  });

  let bestIndex = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < route.length - 1; i += 1) {
    const a = toXY(route[i] as LatLng);
    const b = toXY(route[i + 1] as LatLng);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared === 0 ? 0 : Math.min(1, Math.max(0, -(a.x * dx + a.y * dy) / lengthSquared));
    const distance = Math.hypot(a.x + t * dx, a.y + t * dy);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  return [position, ...route.slice(bestIndex + 1)];
}

/**
 * ¿El punto está dentro de la caja, dejando `margin` (fracción del tamaño de la caja) libre en los
 * bordes? Sirve para decidir si el mensajero "se sale" de lo que la persona está viendo.
 */
export function isInsideBounds(point: LatLng, bounds: MapBounds, margin = 0): boolean {
  const latMargin = (bounds.north - bounds.south) * margin;
  const lngMargin = (bounds.east - bounds.west) * margin;
  return (
    point.latitude <= bounds.north - latMargin &&
    point.latitude >= bounds.south + latMargin &&
    point.longitude <= bounds.east - lngMargin &&
    point.longitude >= bounds.west + lngMargin
  );
}
