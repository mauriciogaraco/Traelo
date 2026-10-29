import { isOlderVersion, WEB_VERSION } from '../RefreshModal'

describe('versión de la web — cuándo se avisa que hubo cambios', () => {
  it('esta versión es la 1.11', () => {
    expect(WEB_VERSION).toBe('1.11')
  })

  it('quien no tiene versión guardada ve el aviso', () => {
    expect(isOlderVersion(null, '1.10')).toBe(true)
    expect(isOlderVersion(undefined, '1.10')).toBe(true)
    expect(isOlderVersion('', '1.10')).toBe(true)
  })

  it('el aviso viejo (una fecha) no cuenta como versión: se avisa', () => {
    expect(isOlderVersion('2026-09-24', '1.10')).toBe(true)
  })

  it('una versión menor ve el aviso (comparando número a número: 1.9 < 1.10)', () => {
    expect(isOlderVersion('1.9', '1.10')).toBe(true)
    expect(isOlderVersion('1.0', '1.10')).toBe(true)
    expect(isOlderVersion('0.99', '1.10')).toBe(true)
  })

  it('la misma versión o una mayor no lo ve', () => {
    expect(isOlderVersion('1.10', '1.10')).toBe(false)
    expect(isOlderVersion('1.10.0', '1.10')).toBe(false)
    expect(isOlderVersion('1.11', '1.10')).toBe(false)
    expect(isOlderVersion('2.0', '1.10')).toBe(false)
  })
})
