import type { ReactNode } from 'react'

/** Sección del Home/negocio: título h3 como en mobile, con acción opcional a la derecha. */
export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-h3 text-text-primary">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/**
 * Carrusel horizontal de mobile. En teléfono/tablet se desliza de lado (con el borde de la pantalla
 * como en la app); en escritorio (lg+) se reparte en una grilla para aprovechar el ancho.
 */
export function Rail({ children, desktopColumns = 5 }: { children: ReactNode; desktopColumns?: 3 | 4 | 5 | 6 }) {
  const grid = { 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6' }[desktopColumns]
  return (
    <div
      // scroll-pl-4: sin esto, con snap-x el navegador puede "adelantar" el scroll inicial hasta el
      // padding (la primera tarjeta queda pegada al borde) en vez de respetarlo como el punto de
      // inicio — se nota con 2+ tarjetas (la fila realmente se puede desplazar); con una sola no se
      // ve porque no hay nada que desplazar.
      className={`flex gap-3 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1 snap-x scroll-pl-4 lg:mx-0 lg:px-0 lg:scroll-pl-0 lg:grid ${grid} lg:overflow-visible [&>*]:snap-start`}
    >
      {children}
    </div>
  )
}
