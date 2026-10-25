import { describe, expect, it } from 'vitest'
import { SESSION_STARTED_KEY, claimSessionStart, sessionStartProperties } from '../session'

const base = { referrer: '', ownHost: 'traelo.example' }

describe('sessionStartProperties', () => {
  it('la entrada es el primer tramo de la ruta, o home en la raíz', () => {
    expect(sessionStartProperties({ ...base, href: 'https://traelo.example/' }).entry).toBe('home')
    expect(sessionStartProperties({ ...base, href: 'https://traelo.example/negocio/abc123/productos' }).entry).toBe('negocio')
  })

  it('del referrer externo guarda solo el dominio, sin ruta ni búsqueda ni www', () => {
    const props = sessionStartProperties({
      ...base,
      href: 'https://traelo.example/',
      referrer: 'https://www.facebook.com/groups/12345/posts/9?token=secreto',
    })
    expect(props.referrer).toBe('facebook.com')
    expect(JSON.stringify(props)).not.toContain('secreto')
  })

  it('un referrer de la propia web no cuenta', () => {
    const props = sessionStartProperties({ ...base, href: 'https://traelo.example/', referrer: 'https://www.traelo.example/carrito' })
    expect(props).not.toHaveProperty('referrer')
  })

  it('un referrer inválido no rompe nada', () => {
    expect(sessionStartProperties({ ...base, href: 'https://traelo.example/', referrer: 'no es una url' })).toEqual({ entry: 'home' })
  })

  it('recoge las etiquetas utm_* en minúsculas y acotadas, y marca si vino con ?ciudad=', () => {
    const props = sessionStartProperties({
      ...base,
      href: `https://traelo.example/?ciudad=san-antonio-de-los-banos&utm_source=WhatsApp&utm_medium=grupo&utm_campaign=${'x'.repeat(200)}`,
    })
    expect(props.utmSource).toBe('whatsapp')
    expect(props.utmMedium).toBe('grupo')
    expect((props.utmCampaign as string).length).toBe(60)
    expect(props.viaCityLink).toBe(true)
  })

  it('sin utm ni ciudad no añade claves vacías', () => {
    expect(sessionStartProperties({ ...base, href: 'https://traelo.example/' })).toEqual({ entry: 'home' })
  })

  it('una dirección inválida devuelve vacío', () => {
    expect(sessionStartProperties({ ...base, href: '::' })).toEqual({})
  })
})

describe('claimSessionStart', () => {
  function memory() {
    const data = new Map<string, string>()
    return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), data }
  }

  it('la primera vez de una sesión sí, y recargar o remontar no la repite', () => {
    const storage = memory()
    expect(claimSessionStart(storage, 'sesion-1')).toBe(true)
    expect(claimSessionStart(storage, 'sesion-1')).toBe(false)
    expect(storage.data.get(SESSION_STARTED_KEY)).toBe('sesion-1')
  })

  it('una sesión nueva (otra pestaña, o tras cerrar sesión) se vuelve a registrar', () => {
    const storage = memory()
    claimSessionStart(storage, 'sesion-1')
    expect(claimSessionStart(storage, 'sesion-2')).toBe(true)
  })

  it('sin almacenamiento o con almacenamiento que falla, se registra igual', () => {
    expect(claimSessionStart(null, 'sesion-1')).toBe(true)
    const broken = {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('bloqueado')
      },
    }
    expect(claimSessionStart(broken, 'sesion-1')).toBe(true)
  })
})
