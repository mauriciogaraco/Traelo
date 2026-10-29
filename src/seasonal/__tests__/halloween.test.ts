import { HALLOWEEN_END, HALLOWEEN_START, isInHalloweenWindow, resolveHalloween } from '../halloween'

const day = (iso: string) => new Date(`${iso}T12:00:00`)

describe('isInHalloweenWindow', () => {
  it('incluye el primer y el último día de la campaña', () => {
    expect(isInHalloweenWindow(day(HALLOWEEN_START))).toBe(true)
    expect(isInHalloweenWindow(day('2026-10-31'))).toBe(true)
    expect(isInHalloweenWindow(day(HALLOWEEN_END))).toBe(true)
  })
  it('queda fuera antes y después', () => {
    expect(isInHalloweenWindow(day('2026-10-27'))).toBe(false)
    expect(isInHalloweenWindow(day('2026-11-03'))).toBe(false)
    expect(isInHalloweenWindow(day('2027-10-31'))).toBe(false)
  })
})

describe('resolveHalloween', () => {
  it('sin override sigue la fecha', () => {
    expect(resolveHalloween(day('2026-10-31'), null)).toBe(true)
    expect(resolveHalloween(day('2026-12-01'), null)).toBe(false)
  })
  it('?halloween=on/off la fuerza para probar', () => {
    expect(resolveHalloween(day('2026-12-01'), 'on')).toBe(true)
    expect(resolveHalloween(day('2026-10-31'), 'off')).toBe(false)
  })
  it('VITE_HALLOWEEN=off la apaga siempre', () => {
    expect(resolveHalloween(day('2026-10-31'), 'on', 'off')).toBe(false)
  })
  it('un valor raro en ?halloween= se ignora', () => {
    expect(resolveHalloween(day('2026-10-31'), 'quizas')).toBe(true)
    expect(resolveHalloween(day('2026-12-01'), 'quizas')).toBe(false)
  })
})
