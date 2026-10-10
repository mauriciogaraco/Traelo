import { looksLikePersonalData, searchQueryProperties } from '../privacy'

describe('looksLikePersonalData', () => {
  it.each(['juan@correo.com', '+53 5555 1234', '55551234', '5355-551-234', 'llámame al 5 5551234'])('%s es dato personal', (text) => {
    expect(looksLikePersonalData(text)).toBe(true)
  })

  it.each(['pizza', 'cake 6 leches', 'agua 1.5 litros', 'combo 2x1', 'pan con queso'])('%s es una búsqueda normal', (text) => {
    expect(looksLikePersonalData(text)).toBe(false)
  })
})

describe('searchQueryProperties', () => {
  it('normaliza: sin espacios de más y en minúsculas, para poder agrupar', () => {
    expect(searchQueryProperties('  Pizza   Familiar ')).toEqual({ query: 'pizza familiar' })
  })

  it('un texto que parece teléfono o correo no se envía: solo que fue redactado y su longitud', () => {
    expect(searchQueryProperties('+53 5555 1234')).toEqual({ query: null, queryRedacted: true, queryLength: 13 })
    expect(searchQueryProperties('juan@correo.com')).toEqual({ query: null, queryRedacted: true, queryLength: 15 })
  })

  it('recorta a 100 caracteres', () => {
    expect(searchQueryProperties('a'.repeat(250)).query).toHaveLength(100)
  })
})
