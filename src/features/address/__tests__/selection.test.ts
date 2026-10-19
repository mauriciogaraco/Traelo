import { effectiveSavedAddressId } from '../selection'

const casa = { id: 'a1', isDefault: true }
const trabajo = { id: 'a2', isDefault: false }

describe('effectiveSavedAddressId', () => {
  it('respeta la elegida si todavía existe', () => {
    expect(effectiveSavedAddressId([casa, trabajo], 'a2')).toBe('a2')
  })

  // Regresión: una dirección elegida que ya no existe (borrador viejo, se borró, cambió la libreta) dejaba
  // "Continuar" apagado y SIN decir por qué.
  it('si la elegida ya no existe, cae a la predeterminada', () => {
    expect(effectiveSavedAddressId([trabajo, casa], 'borrada')).toBe('a1')
  })

  it('sin elegida, toma la predeterminada', () => {
    expect(effectiveSavedAddressId([trabajo, casa], null)).toBe('a1')
  })

  it('sin predeterminada, toma la primera', () => {
    expect(effectiveSavedAddressId([{ id: 'x' }, { id: 'y' }], 'otra')).toBe('x')
  })

  it('sin direcciones guardadas, nada', () => {
    expect(effectiveSavedAddressId([], null)).toBeNull()
    expect(effectiveSavedAddressId([], 'a1')).toBeNull()
  })
})
