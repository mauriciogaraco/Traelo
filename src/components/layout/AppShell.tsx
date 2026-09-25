import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { FloatingTabBar } from './FloatingTabBar'
import { TopHeader } from './TopHeader'
import { OfflineBanner } from '../ui/OfflineBanner'
import { isFlowRoute } from './navigation'

/**
 * Estructura de la app, igual que mobile: header compartido arriba + barra flotante abajo.
 *
 * - Teléfono/tablet: ancho completo, barra flotante; las pantallas de flujo (producto, checkout)
 *   ocultan header y barra porque tienen su propio "Volver" y barra de acción.
 * - Escritorio (lg+): header con la navegación; el contenido se centra en una columna
 *   de hasta 6xl; las pantallas migradas usan grids y las que no, una columna (`Narrow` en App).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const flow = isFlowRoute(pathname)

  return (
    <div className="min-h-screen bg-background">
      <TopHeader hideOnMobile={flow} />
      <OfflineBanner />
      <main className={`mx-auto w-full max-w-6xl ${flow ? 'pb-6' : 'pb-28 lg:pb-12'}`}>{children}</main>
      {!flow && <FloatingTabBar />}
    </div>
  )
}
