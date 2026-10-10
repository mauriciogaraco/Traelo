import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { track } from '../analytics'
import { useNavigate } from 'react-router-dom'
import { formatCup } from '../components/catalog/Price'
import { Button } from '../components/ui/Button'
import { ChipRow } from '../components/ui/ChipRow'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'
import { PhoneField } from '../components/ui/PhoneField'
import { TextField } from '../components/ui/TextField'
import { useToast } from '../context/ToastContext'
import { getCartItemCount, getCartSubtotalEstimate } from '../features/cart'
import { describeMissing, getMissingDeliveryDetails } from '../features/checkout/deliveryDetails'
import { ASAP_LABEL, deliveryTimeOptions, scheduledForValue } from '../features/checkout/deliveryTime'
import { formatPoints, validApplied } from '../features/rewards'
import { useIsOnline } from '../hooks/useIsOnline'
import { setOrderInFlight } from '../pwa'
import { generateLocalId } from '../lib/id'
import { sanitizeCubanPhone, toCubanE164 } from '../lib/phone'
import { rememberDeliveryAddress } from '../services/addressBookService'
import { requestCheckoutQuote, submitCheckout } from '../services/checkoutService'
import { useAddressStore } from '../store/addressStore'
import { useCartStore } from '../store/cartStore'
import { useCheckoutDraftStore } from '../store/checkoutDraftStore'
import { useGuestProfileStore } from '../store/guestStore'
import { useRewardsStore } from '../store/rewardsStore'
import type { OrderQuote, RedemptionRequest } from '../types/backend/rewards'

/** Cuánto esperar tras el último cambio del carrito antes de pedir la cotización. */
const QUOTE_DEBOUNCE_MS = 400

type Step = 'where' | 'review'
type DeliveryForm = { name: string; phone: string; address: string; reference: string }

/**
 * Confirmar pedido — `CheckoutScreen` de mobile, en dos pasos cortos: 1) ¿Dónde entregamos? y
 * 2) Revisa y confirma, con la cotización del servidor. NO exige cuenta: con sesión el pedido
 * queda vinculado a la cuenta igual (createCheckoutOrder adjunta el Bearer si existe), sin
 * cambiar el formulario. Las direcciones viven en este navegador (libreta local): se elige una
 * guardada o se escribe una nueva, que queda guardada sola al pedir. La hora de entrega elegida
 * viaja como `scheduledFor` (informativa para el equipo).
 *
 * Diferencia con mobile: sin el pin opcional en el mapa (la dirección escrita es lo obligatorio;
 * el pin nunca bloquea el pedido).
 */
export function CheckoutPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const online = useIsOnline()
  const items = useCartStore((state) => state.items)

  // Llegó a empezar el pedido (una vez por visita a la pantalla): si no lo envía, es una compra abandonada.
  useEffect(() => {
    const current = useCartStore.getState().items
    track('checkout_started', {
      properties: { itemCount: getCartItemCount(current), businessCount: new Set(current.map((item) => item.businessId)).size },
    })
  }, [])
  const savedAddresses = useAddressStore((state) => state.addresses)
  const guestProfile = useGuestProfileStore()
  const appliedRedemption = useRewardsStore((state) => state.applied)
  const applied = useMemo(() => validApplied(appliedRedemption, items), [appliedRedemption, items])
  const redemption: RedemptionRequest | undefined = applied
    ? { rewardId: applied.reward.id, expectedBalance: applied.expectedBalance }
    : undefined

  // Borrador: si hubo que volver al carrito (un agotado, un local cerrado…), lo escrito sigue ahí.
  const restored = useRef(useCheckoutDraftStore.getState().draft).current
  const [step, setStep] = useState<Step>(restored?.step ?? 'where')
  const [form, setForm] = useState<DeliveryForm>(() => ({
    name: restored?.name ?? guestProfile.name,
    phone: restored?.phone ?? sanitizeCubanPhone(guestProfile.phone),
    address: restored?.address ?? (savedAddresses.length === 0 ? guestProfile.address : ''),
    reference: restored?.reference ?? (savedAddresses.length === 0 ? guestProfile.addressReference : ''),
  }))
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    restored?.selectedAddressId ?? (savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0])?.id ?? null,
  )
  const [useNewAddress, setUseNewAddress] = useState(restored?.useNewAddress ?? savedAddresses.length === 0)
  // Hora de entrega: null = lo antes posible; si no, una hora de hoy (hora de Cuba, cada 15 min).
  const [deliveryTime, setDeliveryTime] = useState<string | null>(restored?.deliveryTime ?? null)
  const [submitting, setSubmitting] = useState(false)
  const [quote, setQuote] = useState<OrderQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const clientRequestId = useRef(generateLocalId('checkout'))
  const orderCreated = useRef(false)

  useEffect(() => {
    if (orderCreated.current) return
    useCheckoutDraftStore.getState().save({
      ...form,
      selectedAddressId,
      useNewAddress,
      pinOverride: undefined,
      step,
      deliveryTime,
    })
  }, [form, selectedAddressId, useNewAddress, step, deliveryTime])

  const patchForm = useCallback((patch: Partial<DeliveryForm>) => setForm((current) => ({ ...current, ...patch })), [])

  // Cotización autoritativa del servidor al llegar a "Revisa y confirma" (con debounce). No bloquea:
  // si falla se muestra el estimado; el backend valida el total real al crear el pedido.
  const cartFingerprint = items
    .map((i) => `${i.productId}:${i.quantity}:${i.optionName ?? ''}:${i.addonName ?? ''}:${i.packagingName ?? ''}`)
    .join('|')
  useEffect(() => {
    if (step !== 'review') {
      setQuote(null)
      setQuoteLoading(false)
      return
    }
    let cancelled = false
    setQuoteLoading(true)
    const timer = window.setTimeout(async () => {
      const result = await requestCheckoutQuote(useCartStore.getState().items, redemption)
      if (cancelled) return
      setQuoteLoading(false)
      setQuote(result.ok ? result.quote : null)
    }, QUOTE_DEBOUNCE_MS)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
    // redemption resume a `applied` por contenido (id + saldo esperado): comparar el objeto entero recrearía la petición en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, cartFingerprint, applied?.reward.id])

  // Las horas se calculan en hora de Cuba y se refrescan al cambiar de paso (no cada segundo).
  const deliveryTimes = useMemo(() => deliveryTimeOptions(new Date()), [step])

  if (items.length === 0 && !orderCreated.current) {
    return (
      <>
        <FlowHeader title="Confirmar pedido" onBack={() => navigate('/carrito')} />
        <EmptyState icon="cart" title="Tu carrito está vacío" description="Agrega productos antes de continuar." />
      </>
    )
  }

  const showFreeForm = useNewAddress || savedAddresses.length === 0
  const selectedSaved = showFreeForm ? null : (savedAddresses.find((a) => a.id === selectedAddressId) ?? null)
  const missing = getMissingDeliveryDetails({
    isGuest: true,
    name: form.name,
    phone: form.phone,
    usingSavedAddress: !showFreeForm,
    address: form.address,
    reference: form.reference,
  })
  const canContinue = missing.length === 0 && (showFreeForm || selectedSaved !== null)
  const missingText = describeMissing(missing)
  const deliveryLabel = scheduledForValue(deliveryTime)
  const reviewAddress = showFreeForm ? form.address.trim() : (selectedSaved?.address ?? '')
  const reviewReference = showFreeForm ? form.reference.trim() : (selectedSaved?.reference ?? '')

  const handleConfirm = async () => {
    if (!online) {
      showToast('Sin conexión: no podemos confirmar tu pedido ahora. Conéctate a Internet para continuar.', 'error')
      return
    }
    if (submitting || !canContinue) return
    setSubmitting(true)
    // Mientras se envía, una versión nueva de la web no recarga la página (ver pwa.ts).
    setOrderInFlight(true)
    const result = await submitCheckout({
      items,
      clientRequestId: clientRequestId.current,
      scheduledFor: deliveryLabel,
      // La dirección viaja SIEMPRE como texto dentro del pedido (la libreta es de este navegador).
      address: reviewAddress,
      addressReference: reviewReference || undefined,
      customerName: form.name.trim(),
      customerPhone: toCubanE164(form.phone),
      redemption,
    })
    setOrderInFlight(false)
    setSubmitting(false)
    if (result.ok) {
      orderCreated.current = true
      useCheckoutDraftStore.getState().clear()
      if (showFreeForm) rememberDeliveryAddress({ address: form.address, reference: form.reference })
      showToast(`Pedido #${result.order.orderNumber} recibido`, 'success')
      navigate(`/pedido/${result.order.id}`, { replace: true })
      return
    }
    if (result.code === 'CART_CHANGED') {
      const issues = useCartStore.getState().checkoutIssues
      const detail =
        issues.length === 1 ? issues[0]!.message : issues.length > 1 ? `${issues.length} productos o negocios cambiaron.` : 'Revisa los productos afectados.'
      showToast(`Tu carrito cambió: ${detail}`, 'error')
      navigate('/carrito')
      return
    }
    showToast(`No pudimos confirmar tu pedido. ${result.message}`, 'error')
  }

  return (
    <>
      <FlowHeader
        title={step === 'where' ? '¿Dónde entregamos?' : 'Revisa y confirma'}
        stepLabel={`Paso ${step === 'where' ? 1 : 2} de 2`}
        onBack={() => (step === 'review' ? setStep('where') : navigate('/carrito'))}
      />

      <div className="px-4 lg:px-0 pb-10 space-y-5">
        {step === 'where' ? (
          <>
            <section className="space-y-3">
              <h2 className="text-h3 text-text-primary">Tus datos</h2>
              <TextField label="Nombre completo" autoComplete="name" value={form.name} onChange={(e) => patchForm({ name: e.target.value })} />
              <PhoneField value={form.phone} onChange={(phone) => patchForm({ phone })} />
            </section>

            <section className="space-y-3">
              <h2 className="text-h3 text-text-primary">Dirección de entrega</h2>
              {!showFreeForm ? (
                <>
                  <div role="radiogroup" aria-label="Direcciones guardadas" className="space-y-2">
                    {savedAddresses.map((saved) => {
                      const selected = selectedAddressId === saved.id
                      return (
                        <button
                          key={saved.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setSelectedAddressId(saved.id)}
                          className={`w-full text-left rounded-r-md bg-surface p-3 transition ${
                            selected ? 'border-2 border-primary' : 'border border-border hover:border-primary/40'
                          }`}
                        >
                          <span className="block text-[15px] font-semibold text-text-primary">{saved.label}</span>
                          <span className="block text-caption text-text-secondary">{saved.address}</span>
                          {saved.reference && <span className="block text-caption text-text-secondary">{saved.reference}</span>}
                        </button>
                      )
                    })}
                  </div>
                  <button type="button" onClick={() => setUseNewAddress(true)} className="text-caption font-semibold text-primary-text hover:underline">
                    Usar otra dirección
                  </button>
                </>
              ) : (
                <>
                  <TextField
                    label="Dirección (calle, número, entre calles...)"
                    autoComplete="street-address"
                    value={form.address}
                    onChange={(e) => patchForm({ address: e.target.value })}
                  />
                  <TextField
                    label="Referencia (opcional, ej.: casa azul frente al parque)"
                    value={form.reference}
                    onChange={(e) => patchForm({ reference: e.target.value })}
                  />
                  {savedAddresses.length > 0 && (
                    <button type="button" onClick={() => setUseNewAddress(false)} className="text-caption font-semibold text-primary-text hover:underline">
                      Usar una dirección guardada
                    </button>
                  )}
                </>
              )}
            </section>

            <section className="space-y-2">
              <h2 className="text-h3 text-text-primary">¿Cuándo lo entregamos?</h2>
              <ChipRow
                label="Hora de entrega"
                items={[
                  { key: 'asap', label: ASAP_LABEL, selected: deliveryTime === null },
                  ...(deliveryTimes.length > 0 ? [{ key: 'later', label: 'Programar para hoy', selected: deliveryTime !== null }] : []),
                ]}
                onPress={(key) => setDeliveryTime(key === 'asap' ? null : (deliveryTime ?? deliveryTimes[0] ?? null))}
              />
              {deliveryTime !== null && (
                <label className="block">
                  <span className="block mb-1 text-label text-text-secondary">Hora (hoy, hora de Cuba)</span>
                  <select
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="w-full h-12 rounded-r-md border border-border bg-surface px-3 text-body text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {deliveryTimes.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </section>

            {missingText && <p className="text-caption text-text-secondary">{missingText}</p>}
            <Button fullWidth disabled={!canContinue} onClick={() => {
                if (!canContinue) return
                track('checkout_step_completed', { properties: { step: 'where' } })
                setStep('review')
              }}>
              Continuar
            </Button>
          </>
        ) : (
          <ReviewStep
            name={form.name.trim()}
            phone={toCubanE164(form.phone)}
            address={reviewAddress}
            reference={reviewReference}
            deliveryLabel={deliveryLabel}
            itemCount={getCartItemCount(items)}
            subtotalEstimate={getCartSubtotalEstimate(items)}
            quote={quote}
            quoteLoading={quoteLoading}
            online={online}
            submitting={submitting}
            onBack={() => setStep('where')}
            onConfirm={handleConfirm}
          />
        )}
      </div>
    </>
  )
}

function FlowHeader({ title, stepLabel, onBack }: { title: string; stepLabel?: string; onBack: () => void }) {
  return (
    <header className="flex items-start gap-3 px-4 lg:px-0 pt-[max(16px,env(safe-area-inset-top))] lg:pt-6 pb-4">
      <button
        type="button"
        onClick={onBack}
        aria-label="Volver"
        className="w-10 h-10 shrink-0 rounded-full bg-surface border border-border flex items-center justify-center text-text-primary hover:bg-surface-muted"
      >
        <Icon name="chevron-left" size={20} />
      </button>
      <div>
        {stepLabel && <p className="text-caption text-text-secondary">{stepLabel}</p>}
        <h1 className="text-h1 text-text-primary">{title}</h1>
      </div>
    </header>
  )
}

function QuoteRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? 'font-bold text-text-primary text-base pt-1' : 'text-body text-text-primary'}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}

/** Paso 2 — `ReviewStep` de mobile: la entrega, el desglose que calcula el servidor y confirmar. */
function ReviewStep(props: {
  name: string
  phone: string
  address: string
  reference: string
  deliveryLabel: string
  itemCount: number
  subtotalEstimate: number
  quote: OrderQuote | null
  quoteLoading: boolean
  online: boolean
  submitting: boolean
  onBack: () => void
  onConfirm: () => void
}) {
  const { quote } = props
  return (
    <>
      <section className="rounded-r-md bg-surface border border-border p-3 space-y-1">
        <h2 className="text-h3 text-text-primary">Entrega</h2>
        <p className="text-body text-text-primary">
          {props.name} · {props.phone}
        </p>
        <p className="text-body text-text-primary">{props.address}</p>
        <p className={`text-caption ${props.deliveryLabel === ASAP_LABEL ? 'text-text-secondary' : 'font-semibold text-warning-text'}`}>
          {props.deliveryLabel}
        </p>
        {props.reference && <p className="text-caption text-text-secondary">{props.reference}</p>}
      </section>

      {quote ? (
        <section aria-label="Total del pedido" className="rounded-r-md bg-surface border border-border p-3 space-y-1">
          <QuoteRow label="Productos" value={formatCup(quote.productsTotal - quote.packagingTotal)} />
          {quote.packagingTotal > 0 && <QuoteRow label="Empaque" value={formatCup(quote.packagingTotal)} />}
          {quote.redemption && (
            <QuoteRow label={`🎁 ${quote.redemption.rewardName} (${formatPoints(quote.redemption.pointsCost)})`} value={`−${formatCup(quote.pointsDiscount)}`} />
          )}
          <QuoteRow label="Mensajería" value={formatCup(quote.deliveryFee)} />
          <QuoteRow label="Servicio Tráelo" value={formatCup(quote.platformFee)} />
          <QuoteRow label="Total a pagar" value={formatCup(quote.total)} strong />
          <p className="text-caption text-text-secondary">Calculado por Tráelo — el servidor lo vuelve a confirmar al crear el pedido.</p>
        </section>
      ) : (
        <>
          <section className="flex justify-between rounded-r-md bg-surface border border-border p-3">
            <span className="text-body text-text-primary">
              {props.itemCount} {props.itemCount === 1 ? 'producto' : 'productos'}
            </span>
            <span className="font-semibold text-text-primary">{formatCup(props.subtotalEstimate)}</span>
          </section>
          <p className="text-caption text-text-secondary" aria-live="polite">
            {props.quoteLoading ? 'Calculando el total exacto…' : 'El delivery, el servicio Tráelo y el total final los calcula el backend al confirmar.'}
          </p>
        </>
      )}

      {!props.online && (
        <p className="text-caption font-semibold text-danger-text">
          Sin conexión — no podemos confirmar tu pedido ahora. Conéctate a Internet para continuar.
        </p>
      )}

      <div className="space-y-2">
        <Button fullWidth loading={props.submitting} disabled={!props.online} onClick={props.onConfirm}>
          Confirmar pedido
        </Button>
        <Button fullWidth variant="outline" disabled={props.submitting} onClick={props.onBack}>
          Cambiar datos de entrega
        </Button>
      </div>
    </>
  )
}
