import { beforeEach, describe, expect, it } from 'vitest'
import {
  capturePendingReferralCode,
  clearPendingReferralCode,
  getPendingReferralCode,
} from '../referralAttribution'

beforeEach(() => {
  clearPendingReferralCode()
})

describe('capturePendingReferralCode / getPendingReferralCode', () => {
  it('guarda el código en mayúsculas', () => {
    capturePendingReferralCode('mauri25')
    expect(getPendingReferralCode()).toBe('MAURI25')
  })

  it('null si todavía no se capturó nada', () => {
    expect(getPendingReferralCode()).toBeNull()
  })

  it('ignora un código con formato inválido (espacios, símbolos)', () => {
    capturePendingReferralCode('no valido!')
    expect(getPendingReferralCode()).toBeNull()
  })

  it('el primer código capturado gana: uno posterior no lo reemplaza', () => {
    capturePendingReferralCode('PRIMERO')
    capturePendingReferralCode('SEGUNDO')
    expect(getPendingReferralCode()).toBe('PRIMERO')
  })
})

describe('clearPendingReferralCode', () => {
  it('borra el código guardado', () => {
    capturePendingReferralCode('MAURI25')
    clearPendingReferralCode()
    expect(getPendingReferralCode()).toBeNull()
  })

  it('después de borrar, un código nuevo sí se guarda', () => {
    capturePendingReferralCode('PRIMERO')
    clearPendingReferralCode()
    capturePendingReferralCode('SEGUNDO')
    expect(getPendingReferralCode()).toBe('SEGUNDO')
  })
})
