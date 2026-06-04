/** Aviso de pago de un negocio (ej: solo billetes de 50 en adelante). */
export function PaymentNote({ note }: { note: string }) {
  return (
    <div className="flex items-start gap-2 px-4 py-2 bg-amber-50 border-y border-amber-100">
      <span className="text-sm flex-shrink-0" aria-hidden="true">💵</span>
      <p className="text-[11px] font-semibold text-amber-800 leading-snug">{note}</p>
    </div>
  )
}
