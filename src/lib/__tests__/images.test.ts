import { optimizedImageUrl } from '../images'

describe('optimizedImageUrl', () => {
  it('no pide transformaciones a Cloudinary: la URL sale tal cual (cada variante gasta créditos)', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/traelo/businesses/b1/products/foto.jpg'
    expect(optimizedImageUrl(url, 400)).toBe(url)
    expect(optimizedImageUrl(url, 1200)).toBe(url)
  })

  it('otras URLs también salen tal cual', () => {
    expect(optimizedImageUrl('https://cdn.example.com/a.webp', 200)).toBe('https://cdn.example.com/a.webp')
  })

  it('sin imagen devuelve null', () => {
    expect(optimizedImageUrl(null, 200)).toBeNull()
    expect(optimizedImageUrl(undefined, 200)).toBeNull()
    expect(optimizedImageUrl('', 200)).toBeNull()
  })
})
