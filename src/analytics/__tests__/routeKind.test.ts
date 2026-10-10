import { recordRoute, routeKind, sourceOfCurrentRoute } from '../routeKind'

describe('routeKind', () => {
  it.each([
    ['/', 'home'],
    ['/buscar', 'buscar'],
    ['/buscar?q=pizza', 'buscar'],
    ['/categorias', 'categorias'],
    ['/favoritos', 'favoritos'],
    ['/negocio/la-marina', 'negocio'],
    ['/producto/abc', 'producto'],
    ['/carrito', 'carrito'],
    ['/checkout', 'carrito'],
    ['/pedido/123', 'pedido'],
    ['/cuenta', 'otro'],
  ])('%s -> %s', (path, expected) => {
    expect(routeKind(path)).toBe(expected)
  })

  it('sin pantalla anterior (enlace directo) es "directo"', () => {
    expect(routeKind(null)).toBe('directo')
  })
})

describe('recordRoute / sourceOfCurrentRoute', () => {
  it('la primera ruta no tiene origen; después, el origen es la pantalla anterior', () => {
    recordRoute('/')
    expect(sourceOfCurrentRoute()).toBe('directo')
    recordRoute('/buscar')
    expect(sourceOfCurrentRoute()).toBe('home')
    recordRoute('/negocio/la-marina')
    expect(sourceOfCurrentRoute()).toBe('buscar')
  })

  it('repetir la misma ruta (re-render) no pisa el origen', () => {
    recordRoute('/producto/p1')
    recordRoute('/producto/p1')
    expect(sourceOfCurrentRoute()).toBe('negocio')
  })
})
