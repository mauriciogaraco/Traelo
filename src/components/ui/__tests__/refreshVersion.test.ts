import { isOlderVersion, WEB_VERSION } from '../RefreshModal'

describe('versión de la web — cuándo se avisa que hubo cambios', () => {
  it('esta versión es la 1.0.1 (mayor.menor.parche)', () => {
    expect(WEB_VERSION).toBe('1.0.1')
    expect(WEB_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('quien no tiene versión guardada ve el aviso', () => {
    expect(isOlderVersion(null, '1.0.1')).toBe(true)
    expect(isOlderVersion(undefined, '1.0.1')).toBe(true)
    expect(isOlderVersion('', '1.0.1')).toBe(true)
  })

  it('el aviso viejo (una fecha) no cuenta como versión: se avisa', () => {
    expect(isOlderVersion('2026-09-24', '1.0.1')).toBe(true)
  })

  it('quien aceptó la versión del formato viejo (1.9, 1.10…) vuelve a ver el aviso', () => {
    expect(isOlderVersion('1.9', '1.0.1')).toBe(true)
    expect(isOlderVersion('1.10', '1.0.1')).toBe(true)
    expect(isOlderVersion('1.11', '1.0.1')).toBe(true)
  })

  it('una versión menor ve el aviso (comparando número a número: 1.0.9 < 1.0.10)', () => {
    expect(isOlderVersion('1.0.0', '1.0.1')).toBe(true)
    expect(isOlderVersion('1.0.9', '1.0.10')).toBe(true)
    expect(isOlderVersion('0.9.9', '1.0.1')).toBe(true)
  })

  it('la misma versión o una mayor no lo ve', () => {
    expect(isOlderVersion('1.0.1', '1.0.1')).toBe(false)
    expect(isOlderVersion('1.0.2', '1.0.1')).toBe(false)
    expect(isOlderVersion('1.1.0', '1.0.1')).toBe(false)
    expect(isOlderVersion('2.0.0', '1.0.1')).toBe(false)
  })
})
