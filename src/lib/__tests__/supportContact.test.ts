import { supportContactFor, SUPPORT_WHATSAPP } from '../config'

describe('supportContactFor', () => {
  it('San Antonio de los Baños tiene su propio número', () => {
    const contact = supportContactFor('san-antonio-de-los-banos')
    expect(contact.whatsapp).toBe('5358202510')
    expect(contact.whatsappUrl).toBe('https://wa.me/5358202510')
    expect(contact.phoneLabel).toBe('+53 5 8202510')
  })

  it('Güira de Melena conserva el de siempre', () => {
    expect(supportContactFor('guira-de-melena').whatsapp).toBe(SUPPORT_WHATSAPP)
  })

  it('una localidad sin número propio, o sin localidad, usa el de siempre', () => {
    expect(supportContactFor('otra-ciudad').whatsapp).toBe(SUPPORT_WHATSAPP)
    expect(supportContactFor(null).whatsapp).toBe(SUPPORT_WHATSAPP)
    expect(supportContactFor(undefined).whatsapp).toBe(SUPPORT_WHATSAPP)
  })
})
