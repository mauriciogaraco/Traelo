/** "Falta: a, b y c." — null si no falta nada. */
function describe(labels: string[]): string | null {
  if (labels.length === 0) return null
  const list = labels.length === 1 ? labels[0]! : `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`
  return `Falta: ${list}.`
}

export type PickupStepInput = {
  description: string
  /** Se eligió un lugar guardado (no se escribe nada). */
  usingSavedPlace: boolean
  /** Un lugar guardado elegido que existe de verdad. */
  savedPlaceChosen: boolean
  place: string
}

/** Paso "¿Qué hay que recoger?": qué falta para poder continuar (mismas reglas que el botón). */
export function describePickupMissing(input: PickupStepInput): string | null {
  const missing: string[] = []
  if (input.description.trim().length < 3) missing.push('qué hay que recoger')
  if (input.usingSavedPlace ? !input.savedPlaceChosen : input.place.trim().length < 3) missing.push('dónde recogerlo')
  return describe(missing)
}

export type DeliveryStepInput = {
  requesterName: string
  /** Los 8 dígitos locales. */
  requesterPhone: string
  isForMe: boolean
  recipientName: string
  recipientPhone: string
  usingSavedAddress: boolean
  savedAddressChosen: boolean
  address: string
  collectEnabled: boolean
  collectAmount: string
  collectAt: 'DELIVERY' | 'OTHER'
  collectPlace: string
}

/** Paso "Entrega y cobro": qué falta para poder continuar (mismas reglas que el botón). */
export function describeDeliveryMissing(input: DeliveryStepInput): string | null {
  const missing: string[] = []
  if (input.requesterName.trim().length < 2) missing.push('tu nombre')
  if (input.requesterPhone.length < 8) missing.push('tu teléfono')
  if (!input.isForMe) {
    if (input.recipientName.trim().length < 2) missing.push('el nombre de quien recibe')
    if (input.recipientPhone.length < 8) missing.push('el teléfono de quien recibe')
  }
  if (input.usingSavedAddress ? !input.savedAddressChosen : input.address.trim().length < 3) missing.push('la dirección de entrega')
  if (input.collectEnabled) {
    if (!(Number(input.collectAmount) > 0)) missing.push('el monto a cobrar')
    if (input.collectAt === 'OTHER' && input.collectPlace.trim().length < 3) missing.push('dónde cobrar')
  }
  return describe(missing)
}
