/**
 * Geometría del recorrido horizontal del pedido. Todo son cuentas puras (sin React) para probarlas:
 * el ancho total se reparte en columnas iguales, una por paso, y la motico viaja entre los centros.
 */

/** Centro horizontal (px) del paso `index` cuando hay `count` pasos repartidos en `width` px. */
export function stepCenter(index: number, count: number, width: number): number {
  if (count <= 0 || width <= 0) return 0;
  const clamped = Math.min(Math.max(index, 0), count - 1);
  return ((clamped + 0.5) * width) / count;
}

/**
 * Duración (ms) del viaje de la motico: base + un tramo por cada paso recorrido, para que cruzar
 * varios pasos de una vez (p. ej. abrir un pedido ya entregado) no sea ni brusco ni eterno.
 */
export function travelDuration(fromIndex: number, toIndex: number): number {
  const steps = Math.abs(toIndex - fromIndex);
  return Math.min(700 + steps * 300, 2200);
}
