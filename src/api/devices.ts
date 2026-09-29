import { apiDelete, apiPatch, apiPost } from './client'

// Todo lo de /customers/me exige sesión: el cliente sale del token, nunca de un id en la URL.
const AUTH = { auth: true } as const

export type WebPushSubscriptionInput = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export type RegisterDeviceInput = {
  platform: 'WEB'
  pushSubscription: WebPushSubscriptionInput
  appVersion?: string
}

export type CustomerDevice = {
  id: string
  customerId: string
  platform: 'ANDROID' | 'IOS' | 'WEB'
  pushToken: string | null
  pushSubscription: WebPushSubscriptionInput | null
  appVersion: string | null
  active: boolean
  lastSeenAt: string | null
  createdAt: string
  updatedAt: string
}

export function registerDevice(input: RegisterDeviceInput) {
  return apiPost<CustomerDevice>('/customers/me/devices', input, AUTH)
}

export function updateDevice(deviceId: string, input: Partial<RegisterDeviceInput> & { active?: boolean }) {
  return apiPatch<CustomerDevice>(`/customers/me/devices/${deviceId}`, input, AUTH)
}

export function deleteDevice(deviceId: string) {
  return apiDelete(`/customers/me/devices/${deviceId}`, AUTH)
}
