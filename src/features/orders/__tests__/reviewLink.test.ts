import { reviewLinkUrl, reviewLinkView, type ReviewLinkInput } from '../reviewLink'

const base: ReviewLinkInput = {
  authLoading: false,
  isAuthenticated: true,
  isGuestOrderHere: false,
  orderLoading: false,
  hasOrder: true,
  status: 'COMPLETED',
  review: { canReview: true, hasPending: true },
}
const view = (overrides: Partial<ReviewLinkInput> = {}) => reviewLinkView({ ...base, ...overrides })

describe('reviewLinkUrl', () => {
  it('arma el enlace que se le pasa al cliente', () => {
    expect(reviewLinkUrl('https://www.traelo-market.com', 'cmvbs5ep80000dcuh5h815x8v')).toBe(
      'https://www.traelo-market.com/valorar/cmvbs5ep80000dcuh5h815x8v',
    )
  })

  it('el id del pedido va escapado (no puede colar otra ruta)', () => {
    expect(reviewLinkUrl('https://x.com', '../admin?a=1')).toBe('https://x.com/valorar/..%2Fadmin%3Fa%3D1')
  })
})

describe('reviewLinkView', () => {
  it('cuenta, pedido entregado y algo por valorar: abre la valoración', () => {
    expect(view()).toBe('review')
  })

  it('mientras carga la sesión o el pedido, no decide todavía', () => {
    expect(view({ authLoading: true })).toBe('loading')
    expect(view({ hasOrder: false, orderLoading: true })).toBe('loading')
    expect(view({ review: null })).toBe('loading')
  })

  it('sin sesión: invita a iniciar sesión (la valoración exige cuenta)', () => {
    expect(view({ isAuthenticated: false })).toBe('login')
  })

  it('pedido hecho sin cuenta desde este navegador: explica que hace falta una cuenta', () => {
    expect(view({ isAuthenticated: false, isGuestOrderHere: true })).toBe('guest-order')
  })

  it('con sesión pero el pedido no existe o es de otra cuenta: no lo encuentra (sin revelar nada)', () => {
    expect(view({ hasOrder: false })).toBe('not-found')
  })

  it('aún no entregado (en camino, pendiente, cancelado…): todavía no se puede valorar', () => {
    for (const status of ['PENDING', 'ASSIGNED', 'HEADING_OUT', 'CANCELLED', undefined]) {
      expect(view({ status })).toBe('not-delivered')
    }
  })

  it('el servidor manda: si dice que no se puede valorar, no se ofrece', () => {
    expect(view({ review: { canReview: false, hasPending: false } })).toBe('not-delivered')
  })

  it('ya valoró todo: agradece y no vuelve a pedir', () => {
    expect(view({ review: { canReview: true, hasPending: false } })).toBe('already-reviewed')
  })
})
