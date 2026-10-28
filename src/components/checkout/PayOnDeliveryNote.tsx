/**
 * Aviso de confianza: el cliente NO paga por adelantado, paga cuando recibe su pedido. Va en el carrito y en el
 * checkout, justo donde la gente duda antes de confirmar.
 */
export function PayOnDeliveryNote({ variant = 'full' }: { variant?: 'compact' | 'full' }) {
  if (variant === 'compact') {
    return (
      <p
        className="flex items-center gap-1.5 text-caption font-semibold text-success-text"
        data-testid="pay-on-delivery-note"
      >
        <span aria-hidden="true">🤝</span>
        Pagas cuando recibes tu pedido, no antes.
      </p>
    )
  }
  return (
    <section
      className="flex items-start gap-3 rounded-r-md bg-success/10 p-3"
      aria-label="Pago al recibir"
      data-testid="pay-on-delivery-note"
    >
      <span className="text-xl leading-none" aria-hidden="true">
        🤝
      </span>
      <div className="space-y-0.5">
        <p className="text-[15px] font-bold text-success-text">Pagas después de la entrega</p>
        <p className="text-caption text-success-text">
          No pagas nada ahora ni por adelantado: primero recibes tu pedido y pagas cuando lo tienes en tus manos. Compra con tranquilidad.
        </p>
      </div>
    </section>
  )
}
