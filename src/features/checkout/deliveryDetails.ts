export type DeliveryDetailField = 'name' | 'phone' | 'address';

export type DeliveryDetailsInput = {
  /** Sin cuenta: el nombre y el teléfono se escriben aquí. Con cuenta salen de la cuenta. */
  isGuest: boolean;
  name: string;
  /** Los 8 dígitos locales que entrega PhoneField (el "+53" es fijo, no se escribe ni se valida acá). */
  phone: string;
  /** true = una dirección guardada elegida (no se escribe dirección). */
  usingSavedAddress: boolean;
  address: string;
  /** Opcional: nunca bloquea. Se mantiene en la entrada por compatibilidad con el formulario. */
  reference?: string;
};

const LABELS: Record<DeliveryDetailField, string> = {
  name: 'nombre',
  phone: 'teléfono',
  address: 'dirección',
};

/**
 * Paso "¿Dónde entregamos?": qué falta para poder continuar. Nombre, teléfono, dirección y
 * son obligatorios (la dirección escrita es lo que permite entregar). La referencia y la ubicación
 * exacta (pin) NO aparecen aquí a propósito: son opcionales y nunca bloquean nada.
 */
export function getMissingDeliveryDetails(input: DeliveryDetailsInput): DeliveryDetailField[] {
  const missing: DeliveryDetailField[] = [];
  if (input.isGuest) {
    if (input.name.trim().length < 2) missing.push('name');
    if (input.phone.trim().length !== 8) missing.push('phone');
  }
  if (!input.usingSavedAddress) {
    if (input.address.trim().length < 3) missing.push('address');
  }
  return missing;
}

/** "Falta: dirección y referencia." — null si no falta nada. */
export function describeMissing(missing: DeliveryDetailField[]): string | null {
  if (missing.length === 0) return null;
  const labels = missing.map((field) => LABELS[field]);
  const list = labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`;
  return `Falta: ${list}.`;
}
