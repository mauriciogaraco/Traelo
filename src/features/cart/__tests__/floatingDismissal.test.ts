import { SWIPE_DISMISS_PX, isCartBarVisible, shouldDismissSwipe } from '../floatingDismissal'

describe('shouldDismissSwipe', () => {
  it('quita el aviso al arrastrar lo suficiente, hacia cualquier lado', () => {
    expect(shouldDismissSwipe(SWIPE_DISMISS_PX)).toBe(true)
    expect(shouldDismissSwipe(-SWIPE_DISMISS_PX - 5)).toBe(true)
  })

  it('un arrastre corto no lo quita', () => {
    expect(shouldDismissSwipe(SWIPE_DISMISS_PX - 1)).toBe(false)
    expect(shouldDismissSwipe(0)).toBe(false)
  })
})

describe('isCartBarVisible', () => {
  it('sin productos no se muestra', () => {
    expect(isCartBarVisible(0, null)).toBe(false)
  })

  it('con productos y sin haberlo quitado, se muestra', () => {
    expect(isCartBarVisible(2, null)).toBe(true)
  })

  it('quitado con 2 productos: sigue oculto con 2 (o menos) y vuelve al agregar uno más', () => {
    expect(isCartBarVisible(2, 2)).toBe(false)
    expect(isCartBarVisible(1, 2)).toBe(false)
    expect(isCartBarVisible(3, 2)).toBe(true)
  })
})
