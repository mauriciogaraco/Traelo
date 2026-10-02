import { useCallback, useEffect, useRef, useState } from 'react'
import { APP_DOWNLOAD } from '../config/appDownload'

export type DownloadPlatform = 'android' | 'ios' | 'desktop'

export type DownloadState =
  | { status: 'idle' }
  /** Se pidió el archivo pero todavía no llega ningún byte (el servidor puede tardar en responder). */
  | { status: 'preparing' }
  | { status: 'downloading'; received: number; total: number | null }
  | { status: 'done'; total: number; mode: 'progress' | 'direct' }
  | { status: 'error'; message: string }

/** Navegadores dentro de otras apps (Facebook, Instagram, WebView de Android…): suelen bloquear
 * las descargas armadas en el navegador, así que ahí se usa el enlace directo. */
function isInAppBrowser(ua: string): boolean {
  return /FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|; wv\)/i.test(ua)
}

export function detectPlatform(ua: string = typeof navigator === 'undefined' ? '' : navigator.userAgent): DownloadPlatform {
  if (/android/i.test(ua)) return 'android'
  // iPadOS se presenta como Mac con pantalla táctil.
  if (/iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1)) return 'ios'
  return 'desktop'
}

/** Descarga el archivo con el enlace directo del navegador (sin progreso). */
function directDownload(): void {
  const a = document.createElement('a')
  a.href = APP_DOWNLOAD.url
  a.download = APP_DOWNLOAD.fileName
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** Guarda en el teléfono un archivo ya descargado en memoria. */
function saveBlob(blob: Blob): void {
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = APP_DOWNLOAD.fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Se libera después: algunos navegadores leen el blob un rato después del clic.
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
}

/**
 * Descarga del APK con progreso real: se lee el archivo por partes (fetch + stream) para mostrar
 * el % y los MB, y al terminar se guarda con su nombre. Si el navegador no permite leer por partes
 * o está dentro de otra app, se usa el enlace directo (sin %, pero la descarga empieza igual).
 */
export function useApkDownload() {
  const [state, setState] = useState<DownloadState>({ status: 'idle' })
  const [sizeBytes, setSizeBytes] = useState<number | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const sizeRequested = useRef(false)

  // Tamaño real del archivo (HEAD, sin bajarlo): se pide una sola vez, cuando el flyer se muestra.
  const loadSize = useCallback(() => {
    if (sizeRequested.current) return
    sizeRequested.current = true
    fetch(APP_DOWNLOAD.url, { method: 'HEAD', cache: 'no-store' })
      .then((res) => {
        const length = Number(res.headers.get('content-length'))
        setSizeBytes(res.ok && length > 0 ? length : APP_DOWNLOAD.fallbackSizeBytes)
      })
      .catch(() => setSizeBytes(APP_DOWNLOAD.fallbackSizeBytes))
  }, [])

  useEffect(() => () => controllerRef.current?.abort(), [])

  const start = useCallback(async () => {
    if (controllerRef.current) return
    const ua = navigator.userAgent
    const canStream = typeof ReadableStream !== 'undefined' && 'body' in Response.prototype

    if (isInAppBrowser(ua) || !canStream) {
      directDownload()
      setState({ status: 'done', total: sizeBytes ?? APP_DOWNLOAD.fallbackSizeBytes, mode: 'direct' })
      return
    }

    const controller = new AbortController()
    controllerRef.current = controller
    setState({ status: 'preparing' })
    try {
      const res = await fetch(APP_DOWNLOAD.url, { signal: controller.signal, cache: 'no-store' })
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
      const total = Number(res.headers.get('content-length')) || sizeBytes || null
      const reader = res.body.getReader()
      const chunks: BlobPart[] = []
      let received = 0
      let lastPaint = 0
      setState({ status: 'downloading', received: 0, total })
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        received += value.byteLength
        // Se repinta como mucho ~12 veces por segundo: suficiente para que la barra se vea fluida.
        const now = performance.now()
        if (now - lastPaint > 80) {
          lastPaint = now
          setState({ status: 'downloading', received, total })
        }
      }
      saveBlob(new Blob(chunks, { type: APP_DOWNLOAD.mimeType }))
      setState({ status: 'done', total: received, mode: 'progress' })
    } catch {
      if (controller.signal.aborted) {
        setState({ status: 'idle' })
      } else {
        setState({
          status: 'error',
          message: navigator.onLine === false ? 'Se perdió la conexión.' : 'No pudimos completar la descarga.',
        })
      }
    } finally {
      controllerRef.current = null
    }
  }, [sizeBytes])

  const cancel = useCallback(() => controllerRef.current?.abort(), [])
  const reset = useCallback(() => setState({ status: 'idle' }), [])

  return { state, sizeBytes, loadSize, start, cancel, reset, directDownload }
}

export function formatMegabytes(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return `${mb.toLocaleString('es', { maximumFractionDigits: mb < 10 ? 1 : 0 })} MB`
}
