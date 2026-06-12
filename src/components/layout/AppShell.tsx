import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";

/** Rutas "enfocadas" que ocultan la barra inferior (tienen su propia barra de acción). */
const FULLSCREEN_PREFIXES = ["/producto/"];
// Ejemplo de ruta que no se oculta: /producto/1234
/**
 * Contenedor tipo "app móvil": ancho de teléfono centrado en pantallas grandes,
 * fondo cálido y barra de navegación inferior fija. Mobile-first.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const hideNav = FULLSCREEN_PREFIXES.some((p) => pathname.startsWith(p));

  return (
    <div className="mx-auto w-full max-w-[440px] min-h-screen bg-background relative shadow-[0_0_60px_-15px_rgba(0,0,0,0.15)]">
      <main className={hideNav ? "" : "pb-24"}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
