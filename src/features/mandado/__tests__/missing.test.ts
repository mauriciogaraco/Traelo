import { describeDeliveryMissing, describePickupMissing, type DeliveryStepInput } from '../missing'

describe('describePickupMissing', () => {
  const ok = { description: 'Un cake de cumpleaños', usingSavedPlace: true, savedPlaceChosen: true, place: '' }

  it('con todo listo no dice nada', () => {
    expect(describePickupMissing(ok)).toBeNull()
  })

  it('falta qué recoger', () => {
    expect(describePickupMissing({ ...ok, description: 'ab' })).toBe('Falta: qué hay que recoger.')
  })

  it('con lugar escrito, falta el lugar', () => {
    expect(describePickupMissing({ ...ok, usingSavedPlace: false, place: '' })).toBe('Falta: dónde recogerlo.')
  })

  it('con un lugar guardado que no está elegido, también lo dice (antes el botón quedaba apagado sin explicar)', () => {
    expect(describePickupMissing({ ...ok, savedPlaceChosen: false })).toBe('Falta: dónde recogerlo.')
  })

  it('lista varias cosas con "y"', () => {
    expect(describePickupMissing({ ...ok, description: '', usingSavedPlace: false, place: '' })).toBe('Falta: qué hay que recoger y dónde recogerlo.')
  })
})

describe('describeDeliveryMissing', () => {
  const ok: DeliveryStepInput = {
    requesterName: 'Ana',
    requesterPhone: '55551234',
    isForMe: true,
    recipientName: '',
    recipientPhone: '',
    usingSavedAddress: true,
    savedAddressChosen: true,
    address: '',
    collectEnabled: false,
    collectAmount: '',
    collectAt: 'DELIVERY',
    collectPlace: '',
  }

  it('con todo listo no dice nada', () => {
    expect(describeDeliveryMissing(ok)).toBeNull()
  })

  it('un cliente nuevo: faltan nombre y teléfono', () => {
    expect(describeDeliveryMissing({ ...ok, requesterName: '', requesterPhone: '' })).toBe('Falta: tu nombre y tu teléfono.')
  })

  it('si es para otra persona, pide los datos de quien recibe', () => {
    expect(describeDeliveryMissing({ ...ok, isForMe: false })).toBe('Falta: el nombre de quien recibe y el teléfono de quien recibe.')
  })

  it('con dirección escrita, falta la dirección; con una guardada no elegida, también', () => {
    expect(describeDeliveryMissing({ ...ok, usingSavedAddress: false })).toBe('Falta: la dirección de entrega.')
    expect(describeDeliveryMissing({ ...ok, savedAddressChosen: false })).toBe('Falta: la dirección de entrega.')
  })

  it('cobrar dinero: monto y, si es en otro lugar, dónde', () => {
    expect(describeDeliveryMissing({ ...ok, collectEnabled: true })).toBe('Falta: el monto a cobrar.')
    expect(describeDeliveryMissing({ ...ok, collectEnabled: true, collectAmount: '500', collectAt: 'OTHER' })).toBe('Falta: dónde cobrar.')
    expect(describeDeliveryMissing({ ...ok, collectEnabled: true, collectAmount: '500', collectAt: 'OTHER', collectPlace: 'En la esquina' })).toBeNull()
  })

  it('cobrar apagado no pide monto', () => {
    expect(describeDeliveryMissing({ ...ok, collectEnabled: false, collectAmount: '' })).toBeNull()
  })
})
