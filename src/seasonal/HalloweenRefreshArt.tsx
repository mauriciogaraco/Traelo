import { Bat, Cobweb, Pumpkin } from './HalloweenArt'

/** Adorno del aviso "Actualizamos Tráelo" en campaña: telaraña en la esquina y una calabaza con dos murciélagos (reemplaza al 🔄). */
export function HalloweenRefreshArt() {
  return (
    <>
      <Cobweb className="pointer-events-none absolute right-0 top-2 h-20 w-20 -scale-x-100 text-text-primary/15" />
      <div className="mb-4 flex items-end justify-center gap-2" aria-hidden="true">
        <Bat className="season-float mb-10 h-4 w-8 text-text-secondary" />
        <Pumpkin className="h-16 w-[4.4rem] drop-shadow-[0_6px_8px_rgba(124,45,18,0.35)]" />
        <Bat className="season-float-slow mb-12 h-3 w-6 text-text-tertiary" />
      </div>
    </>
  )
}
