import { countdownParts, msUntil, startLabel } from '../countdown'

describe('countdownParts', () => {
  it('descompone horas, minutos y segundos', () => {
    expect(countdownParts((4 * 3600 + 17 * 60 + 30) * 1000)).toEqual({ days: 0, hours: 4, minutes: 17, seconds: 30, done: false })
  })

  it('incluye días cuando falta más de uno', () => {
    expect(countdownParts((26 * 3600 + 5) * 1000)).toMatchObject({ days: 1, hours: 2, minutes: 0, seconds: 5, done: false })
  })

  it('redondea hacia arriba: con 400 ms todavía muestra 1 s (no se llega a 0 antes de tiempo)', () => {
    expect(countdownParts(400)).toMatchObject({ seconds: 1, done: false })
  })

  it('en 0, negativo o NaN está terminado', () => {
    for (const ms of [0, -5, Number.NaN]) {
      expect(countdownParts(ms)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, done: true })
    }
  })
})

describe('msUntil usa el reloj del servidor', () => {
  it('con el teléfono 10 min atrasado, igual cuenta contra la hora del servidor', () => {
    const startsAt = '2026-10-17T13:00:00.000Z'
    const serverNow = Date.parse('2026-10-17T12:00:00.000Z')
    const phoneNow = serverNow - 10 * 60 * 1000
    const offset = serverNow - phoneNow
    expect(msUntil(startsAt, phoneNow, offset)).toBe(60 * 60 * 1000)
  })
})

describe('startLabel (hora de La Habana)', () => {
  const startsAt = new Date('2026-10-17T09:00:00-04:00')

  it('el mismo día: "hoy a las 9:00 a. m."', () => {
    const label = startLabel(startsAt, new Date('2026-10-17T04:42:00-04:00'))
    expect(label).toMatch(/^hoy a las 9:00/)
  })

  it('otro día: con la fecha', () => {
    const label = startLabel(startsAt, new Date('2026-10-15T10:00:00-04:00'))
    expect(label).toMatch(/^el 17 de octubre a las 9:00/)
  })
})
