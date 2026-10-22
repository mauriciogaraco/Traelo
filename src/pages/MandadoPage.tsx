import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DeliveryCityPicker, type DeliveryPreview } from '../components/city/DeliveryCityPicker'
import { formatCup } from '../components/catalog/Price'
import { Button } from '../components/ui/Button'
import { ChipRow } from '../components/ui/ChipRow'
import { Icon } from '../components/ui/Icon'
import { PhoneField } from '../components/ui/PhoneField'
import { TextField } from '../components/ui/TextField'
import { useToast } from '../context/ToastContext'
import { useActiveCity } from '../hooks/useActiveCity'
import { useDeviceLocation } from '../hooks/useDeviceLocation'
import {
  CITY_COORDINATES_MISSING_CODE,
  DELIVERY_ROUTE_UNAVAILABLE_CODE,
  ELSEWHERE_CODE,
  deliveryCityIdFor,
  findCity,
  isCrossCityDelivery,
  resolveDeliveryCityCode,
} from '../features/city'
import { useIsOnline } from '../hooks/useIsOnline'
import { generateLocalId } from '../lib/id'
import { sanitizeCubanPhone, toCubanE164 } from '../lib/phone'
import { setOrderInFlight } from '../pwa'
import { rememberDeliveryAddress } from '../services/addressBookService'
import { requestMandadoQuote, submitMandado } from '../services/mandadoService'
import { useAddressStore } from '../store/addressStore'
import { useGuestProfileStore } from '../store/guestStore'
import { useSessionStore } from '../store/sessionStore'
import type { PickupClarity } from '../types/backend/mandado'
import { effectiveSavedAddressId, SWITCH_ADDRESS_MODE_CLASS } from '../features/address/selection'
import { describeDeliveryMissing, describePickupMissing } from '../features/mandado/missing'
import type { MandadoQuote } from '../types/backend/mandado'

const QUOTE_DEBOUNCE_MS = 400

type Step = 'pickup' | 'delivery' | 'review'

const CLARITY_OPTIONS: { key: PickupClarity; label: string }[] = [
  { key: 'EXACT', label: 'Sé la dirección exacta' },
  { key: 'APPROXIMATE', label: 'Sé el lugar, no la dirección' },
  { key: 'VAGUE', label: 'No sé bien, hay que averiguar' },
]

/**
 * Mandado — encargo personalizado sin catálogo (comprar/recoger algo en un lugar a veces
 * impreciso y llevarlo a una dirección, a otra persona, y a veces cobrar dinero en otro lugar).
 * Mismo patrón de wizard que CheckoutPage, en 3 pasos: Recogida → Entrega y cobro → Revisar.
 * Al confirmar se crea un pedido real (ver mandado.service.ts del backend) y se navega a
 * /pedido/:id — el tracking es el mismo que cualquier pedido, sin cambios.
 */
export function MandadoPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const online = useIsOnline()
  const savedAddresses = useAddressStore((state) => state.addresses)
  const guestProfile = useGuestProfileStore()
  const account = useSessionStore((state) => state.customer)
  const deviceLocation = useDeviceLocation()
  const { cities, cityCode: activeCityCode, city: activeCity, showSelector } = useActiveCity()

  const [step, setStep] = useState<Step>('pickup')
  const [submitting, setSubmitting] = useState(false)
  const [quote, setQuote] = useState<MandadoQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  // ¿En qué localidad se entrega? Por defecto la misma desde la que se pide (ver DeliveryCityPicker).
  const IDLE_PREVIEW: DeliveryPreview = { state: 'idle', fee: null, message: null, distanceKm: null, ratePerKm: null }
  const [deliveryCityOverride, setDeliveryCityOverride] = useState<string | null>(null)
  const [crossCity, setCrossCity] = useState<DeliveryPreview>(IDLE_PREVIEW)
  const clientRequestId = useRef(generateLocalId('mandado'))
  const orderCreated = useRef(false)

  // Paso 1 — Recogida. La dirección puede ser una ya guardada (ej.: "Casa de mamá") o un lugar
  // libre, que a veces ni se conoce bien del todo (ver pickupClarity) — por eso el texto libre es
  // el modo por defecto si no hay direcciones guardadas, igual que en la entrega.
  const [pickupDescription, setPickupDescription] = useState('')
  const [pickupPlace, setPickupPlace] = useState('')
  const [pickupClarity, setPickupClarity] = useState<PickupClarity>('EXACT')
  const [pickupAddressId, setPickupAddressId] = useState<string | null>(
    (savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0])?.id ?? null,
  )
  const [useNewPickupPlace, setUseNewPickupPlace] = useState(savedAddresses.length === 0)

  // Solicitante (tus datos): con cuenta, los datos del perfil; sin cuenta, la libreta de este
  // navegador (igual que CheckoutPage). Si la sesión todavía se está leyendo al abrir esta
  // pantalla, el efecto de abajo rellena en cuanto llega — sin pisar lo que ya se haya escrito.
  const [customerName, setCustomerName] = useState(account?.name ?? guestProfile.name)
  const [customerPhone, setCustomerPhone] = useState(sanitizeCubanPhone(account?.phone ?? guestProfile.phone))

  useEffect(() => {
    if (!account) return
    setCustomerName((current) => current || account.name)
    setCustomerPhone((current) => current || sanitizeCubanPhone(account.phone))
    // Solo rellena cuando la sesión llega (cuenta aún no cargada al montar); no debe repetirse en cada tecla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account])

  // Paso 2 — Entrega.
  const [isForMe, setIsForMe] = useState(true)
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    (savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0])?.id ?? null,
  )
  const [useNewAddress, setUseNewAddress] = useState(savedAddresses.length === 0)
  const [address, setAddress] = useState(savedAddresses.length === 0 ? guestProfile.address : '')
  const [addressReference, setAddressReference] = useState(
    savedAddresses.length === 0 ? guestProfile.addressReference : '',
  )

  // Paso 2 — Cobro de dinero (opcional).
  const [collectEnabled, setCollectEnabled] = useState(false)
  const [collectAmount, setCollectAmount] = useState('')
  const [collectAt, setCollectAt] = useState<'DELIVERY' | 'OTHER'>('DELIVERY')
  const [collectPlace, setCollectPlace] = useState('')

  const effectiveRecipientName = isForMe ? customerName : recipientName
  const effectiveRecipientPhone = isForMe ? customerPhone : recipientPhone

  const showFreeForm = useNewAddress || savedAddresses.length === 0
  // El id elegido puede haber dejado de existir (se borró o cambió la libreta): se cae a la predeterminada.
  const effectiveAddressId = effectiveSavedAddressId(savedAddresses, selectedAddressId)
  const selectedSaved = showFreeForm ? null : (savedAddresses.find((a) => a.id === effectiveAddressId) ?? null)
  const reviewAddress = showFreeForm ? address.trim() : (selectedSaved?.address ?? '')
  const reviewReference = showFreeForm ? addressReference.trim() : (selectedSaved?.reference ?? '')

  const showPickupFreeForm = useNewPickupPlace || savedAddresses.length === 0
  const effectivePickupId = effectiveSavedAddressId(savedAddresses, pickupAddressId)
  const selectedPickupSaved = showPickupFreeForm ? null : (savedAddresses.find((a) => a.id === effectivePickupId) ?? null)
  const reviewPickupPlace = showPickupFreeForm
    ? pickupPlace.trim()
    : selectedPickupSaved
      ? `${selectedPickupSaved.address}${selectedPickupSaved.reference ? ` (${selectedPickupSaved.reference})` : ''}`
      : ''

  const pickupValid = pickupDescription.trim().length >= 3 && (showPickupFreeForm ? pickupPlace.trim().length >= 3 : selectedPickupSaved !== null)
  const requesterValid = customerName.trim().length >= 2 && customerPhone.length >= 8
  const recipientValid = effectiveRecipientName.trim().length >= 2 && effectiveRecipientPhone.length >= 8
  const addressValid = showFreeForm ? reviewAddress.length >= 3 : selectedSaved !== null
  const collectValid = !collectEnabled || (Number(collectAmount) > 0 && (collectAt === 'DELIVERY' || collectPlace.trim().length >= 3))
  // Localidad de entrega: la guardada con la dirección elegida > la de la persona > la de origen (como en el checkout).
  const savedForCity = showFreeForm ? null : selectedSaved
  const elsewhere = showSelector && deliveryCityOverride === ELSEWHERE_CODE
  const deliveryCityCode = showSelector
    ? resolveDeliveryCityCode({
        override: elsewhere ? null : deliveryCityOverride,
        savedAddressCityCode: elsewhere ? null : savedForCity?.cityCode,
        activeCityCode,
        cities,
      })
    : null
  const crossCityDelivery = showSelector && !elsewhere && isCrossCityDelivery(deliveryCityCode, activeCityCode, cities)
  // Solo con 2+ localidades se manda la de origen y la de entrega; con una sola todo es como siempre.
  const originCityId = showSelector ? activeCity?.apiId : undefined
  const deliveryCityId = crossCityDelivery ? deliveryCityIdFor(deliveryCityCode, cities) : undefined
  const elsewhereLocation = elsewhere ? deviceLocation.location : null
  const deliveryKey = elsewhereLocation
    ? `km:${elsewhereLocation.latitude.toFixed(4)},${elsewhereLocation.longitude.toFixed(4)}`
    : (deliveryCityId ?? '')
  // "Otra ubicación" necesita la ubicación del cliente (sin ella no se puede medir la mensajería).
  const deliveryChoiceValid = crossCity.state !== 'unavailable' && (!elsewhere || elsewhereLocation !== null)
  const deliveryValid = requesterValid && recipientValid && addressValid && collectValid && deliveryChoiceValid

  // Por qué está apagado "Continuar" (mismas reglas que arriba): nunca queda un botón apagado sin explicación.
  const pickupMissingText = describePickupMissing({
    description: pickupDescription,
    usingSavedPlace: !showPickupFreeForm,
    savedPlaceChosen: selectedPickupSaved !== null,
    place: pickupPlace,
  })
  const deliveryMissingText = describeDeliveryMissing({
    requesterName: customerName,
    requesterPhone: customerPhone,
    isForMe,
    recipientName,
    recipientPhone,
    usingSavedAddress: !showFreeForm,
    savedAddressChosen: selectedSaved !== null,
    address,
    collectEnabled,
    collectAmount,
    collectAt,
    collectPlace,
  })

  // Cotización autoritativa del servidor al llegar a "Revisar" (con debounce). No bloquea: si
  // falla se confirma igual — el backend recalcula el precio real al crear el mandado. Con otra
  // localidad / "otra ubicación" también se pide en el paso de entrega, para mostrar el precio al elegirla.
  const hasDeliveryChoice = deliveryCityId !== undefined || elsewhereLocation !== null
  useEffect(() => {
    if (step === 'pickup' || (step === 'delivery' && !hasDeliveryChoice)) {
      setQuote(null)
      setQuoteLoading(false)
      setCrossCity(IDLE_PREVIEW)
      return
    }
    let cancelled = false
    setQuoteLoading(true)
    if (hasDeliveryChoice) setCrossCity((current) => ({ ...current, state: 'loading' }))
    const timer = window.setTimeout(async () => {
      const result = await requestMandadoQuote({
        pickupClarity,
        destination: deviceLocation.location,
        ...(originCityId ? { cityId: originCityId } : {}),
        ...(deliveryCityId ? { deliveryCityId } : {}),
        ...(elsewhereLocation ? { deliveryElsewhere: true as const } : {}),
      })
      if (cancelled) return
      setQuoteLoading(false)
      setQuote(result.ok ? result.quote : null)
      if (!hasDeliveryChoice) return
      if (result.ok) {
        const km = result.quote.elsewhereDelivery
        setCrossCity({ state: 'ready', fee: result.quote.deliveryFee, message: null, distanceKm: km?.distanceKm ?? null, ratePerKm: km?.ratePerKm ?? null })
      } else if (result.code === DELIVERY_ROUTE_UNAVAILABLE_CODE || result.code === CITY_COORDINATES_MISSING_CODE) {
        setCrossCity({ ...IDLE_PREVIEW, state: 'unavailable', message: result.message })
      } else {
        setCrossCity(IDLE_PREVIEW)
      }
    }, QUOTE_DEBOUNCE_MS)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, pickupClarity, deviceLocation.location, originCityId, deliveryKey])

  const handleConfirm = async () => {
    if (!online) {
      showToast('Sin conexión: no podemos confirmar tu mandado ahora. Conéctate a Internet para continuar.', 'error')
      return
    }
    if (submitting || !deliveryValid) return
    setSubmitting(true)
    setOrderInFlight(true)
    const result = await submitMandado({
      customerName: customerName.trim(),
      customerPhone: toCubanE164(customerPhone),
      pickupDescription: pickupDescription.trim(),
      pickupPlace: reviewPickupPlace,
      pickupClarity,
      recipientName: effectiveRecipientName.trim(),
      recipientPhone: toCubanE164(effectiveRecipientPhone),
      deliveryAddress: reviewAddress,
      deliveryAddressReference: reviewReference || undefined,
      destination: deviceLocation.location,
      ...(originCityId ? { cityId: originCityId } : {}),
      ...(deliveryCityId ? { deliveryCityId } : {}),
      ...(elsewhereLocation ? { deliveryElsewhere: true as const } : {}),
      collectAmount: collectEnabled ? Number(collectAmount) : undefined,
      collectAt: collectEnabled ? collectAt : undefined,
      collectPlace: collectEnabled && collectAt === 'OTHER' ? collectPlace.trim() : undefined,
      clientRequestId: clientRequestId.current,
    })
    setOrderInFlight(false)
    setSubmitting(false)
    if (result.ok) {
      orderCreated.current = true
      if (showFreeForm) {
        rememberDeliveryAddress({
          address,
          reference: addressReference,
          cityCode: showSelector && !elsewhere ? deliveryCityCode : null,
        })
      }
      showToast(`Mandado #${result.order.orderNumber} recibido`, 'success')
      navigate(`/pedido/${result.order.id}`, { replace: true })
      return
    }
    showToast(`No pudimos confirmar tu mandado. ${result.message}`, 'error')
  }

  const stepIndex = step === 'pickup' ? 1 : step === 'delivery' ? 2 : 3
  const titles: Record<Step, string> = {
    pickup: '¿Qué hay que recoger?',
    delivery: 'Entrega y cobro',
    review: 'Revisar y confirmar',
  }

  return (
    <>
      <FlowHeader
        title={titles[step]}
        stepLabel={`Paso ${stepIndex} de 3`}
        onBack={() => {
          if (step === 'delivery') return setStep('pickup')
          if (step === 'review') return setStep('delivery')
          navigate(-1)
        }}
      />

      <div className="px-4 lg:px-0 pb-10 space-y-5">
        {step === 'pickup' && (
          <>
            <section className="space-y-3">
              <TextField
                label="¿Qué hay que buscar o recoger?"
                placeholder="ej.: Un cake de cumpleaños que ya encargué"
                value={pickupDescription}
                onChange={(e) => setPickupDescription(e.target.value)}
              />

              <h2 className="text-h3 text-text-primary">¿Dónde?</h2>
              {!showPickupFreeForm ? (
                <>
                  <div role="radiogroup" aria-label="Direcciones guardadas para la recogida" className="space-y-2">
                    {savedAddresses.map((saved) => {
                      const selected = effectivePickupId === saved.id
                      return (
                        <button
                          key={saved.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setPickupAddressId(saved.id)}
                          className={`w-full text-left rounded-r-md bg-surface p-3 transition ${
                            selected ? 'border-2 border-primary' : 'border border-border hover:border-primary/40'
                          }`}
                        >
                          <span className="block text-[15px] font-semibold text-text-primary">{saved.label}</span>
                          <span className="block text-caption text-text-secondary">{saved.address}</span>
                        </button>
                      )
                    })}
                  </div>
                  <button type="button" onClick={() => setUseNewPickupPlace(true)} className={SWITCH_ADDRESS_MODE_CLASS}>
                    Es otro lugar: escribir la dirección
                  </button>
                </>
              ) : (
                <>
                  <TextField
                    label="Lugar de recogida"
                    placeholder="ej.: Dulcería de 23 y 12, o 'no sé bien, hay que preguntar'"
                    value={pickupPlace}
                    onChange={(e) => setPickupPlace(e.target.value)}
                  />
                  {savedAddresses.length > 0 && (
                    <button type="button" onClick={() => setUseNewPickupPlace(false)} className={SWITCH_ADDRESS_MODE_CLASS}>
                      Elegir una dirección guardada
                    </button>
                  )}
                </>
              )}
            </section>

            <section className="space-y-2">
              <h2 className="text-h3 text-text-primary">¿Qué tan clara es la recogida?</h2>
              <div className="flex flex-col gap-2">
                {CLARITY_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    role="radio"
                    aria-checked={pickupClarity === option.key}
                    onClick={() => setPickupClarity(option.key)}
                    className={`w-full text-left rounded-r-md p-3 transition ${
                      pickupClarity === option.key
                        ? 'border-2 border-primary bg-primary/5'
                        : 'border border-border bg-surface hover:border-primary/40'
                    }`}
                  >
                    <span className="block text-[15px] font-semibold text-text-primary">{option.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {pickupMissingText && <p className="text-caption text-text-secondary">{pickupMissingText}</p>}
            <Button fullWidth disabled={!pickupValid} onClick={() => pickupValid && setStep('delivery')}>
              Continuar
            </Button>
          </>
        )}

        {step === 'delivery' && (
          <>
            <section className="space-y-3">
              <h2 className="text-h3 text-text-primary">Tus datos</h2>
              <TextField label="Nombre completo" autoComplete="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              <PhoneField value={customerPhone} onChange={setCustomerPhone} />
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-h3 text-text-primary">¿A quién se entrega?</h2>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isForMe}
                  onClick={() => setIsForMe((v) => !v)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                    isForMe ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-text-primary hover:border-primary/40'
                  }`}
                >
                  Es para mí
                </button>
              </div>
              {!isForMe && (
                <>
                  <TextField label="Nombre de quien recibe" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
                  <PhoneField label="Teléfono de quien recibe" value={recipientPhone} onChange={setRecipientPhone} />
                </>
              )}
            </section>

            {showSelector && (
              <DeliveryCityPicker
                cities={cities}
                value={elsewhere ? ELSEWHERE_CODE : deliveryCityCode}
                buyingCityName={activeCity?.name ?? ''}
                onChange={(code) => {
                  setDeliveryCityOverride(code)
                  // Elegir "Otra ubicación" es el gesto que pide la ubicación (nunca se pide antes).
                  if (code === ELSEWHERE_CODE && deviceLocation.state === 'idle') deviceLocation.request()
                }}
                preview={crossCity}
                locationState={deviceLocation.state}
                onRequestLocation={deviceLocation.request}
              />
            )}

            <section className="space-y-3">
              <h2 className="text-h3 text-text-primary">Dirección de entrega</h2>
              {!showFreeForm ? (
                <>
                  <div role="radiogroup" aria-label="Direcciones guardadas" className="space-y-2">
                    {savedAddresses.map((saved) => {
                      const selected = effectiveAddressId === saved.id
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
                        </button>
                      )
                    })}
                  </div>
                  <button type="button" onClick={() => setUseNewAddress(true)} className={SWITCH_ADDRESS_MODE_CLASS}>
                    Usar otra dirección: escribirla
                  </button>
                </>
              ) : (
                <>
                  <TextField label="Dirección (calle, número, entre calles...)" autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} />
                  <TextField label="Referencia (opcional)" value={addressReference} onChange={(e) => setAddressReference(e.target.value)} />
                  {savedAddresses.length > 0 && (
                    <button type="button" onClick={() => setUseNewAddress(false)} className={SWITCH_ADDRESS_MODE_CLASS}>
                      Usar una dirección guardada
                    </button>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={deviceLocation.request}
                disabled={deviceLocation.state === 'loading'}
                className="flex items-center gap-1.5 text-caption font-semibold text-primary-text hover:underline disabled:opacity-60"
              >
                <Icon name="location" size={14} />
                {deviceLocation.state === 'granted' ? 'Ubicación usada ✓' : deviceLocation.state === 'loading' ? 'Buscando tu ubicación…' : 'Usar mi ubicación actual'}
              </button>
              {deviceLocation.state === 'denied' && (
                <p className="text-caption text-text-secondary">No pudimos usar tu ubicación — sigue con la dirección escrita.</p>
              )}
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-h3 text-text-primary">¿Hay que cobrar dinero?</h2>
                <button
                  type="button"
                  role="switch"
                  aria-checked={collectEnabled}
                  onClick={() => setCollectEnabled((v) => !v)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                    collectEnabled ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-text-primary hover:border-primary/40'
                  }`}
                >
                  {collectEnabled ? 'Sí' : 'No'}
                </button>
              </div>
              {collectEnabled && (
                <div className="space-y-3">
                  <TextField
                    label="Monto a cobrar (CUP)"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                  />
                  <ChipRow
                    label="Dónde cobrar"
                    items={[
                      { key: 'DELIVERY', label: 'Al entregar', selected: collectAt === 'DELIVERY' },
                      { key: 'OTHER', label: 'En otro lugar', selected: collectAt === 'OTHER' },
                    ]}
                    onPress={(key) => setCollectAt(key as 'DELIVERY' | 'OTHER')}
                  />
                  {collectAt === 'OTHER' && (
                    <TextField label="¿Dónde?" value={collectPlace} onChange={(e) => setCollectPlace(e.target.value)} />
                  )}
                </div>
              )}
            </section>

            {deliveryMissingText && <p className="text-caption text-text-secondary">{deliveryMissingText}</p>}
            <Button fullWidth disabled={!deliveryValid} onClick={() => deliveryValid && setStep('review')}>
              Continuar
            </Button>
          </>
        )}

        {step === 'review' && (
          <ReviewStep
            pickupDescription={pickupDescription.trim()}
            pickupPlace={reviewPickupPlace}
            recipientName={effectiveRecipientName.trim()}
            recipientPhone={toCubanE164(effectiveRecipientPhone)}
            address={reviewAddress}
            reference={reviewReference}
            collectSummary={collectEnabled ? `Cobrar ${collectAmount || 0} CUP ${collectAt === 'OTHER' ? `en ${collectPlace}` : 'al entregar'}` : null}
            deliveryNote={
              elsewhere
                ? `Entrega en otra ubicación${quote?.elsewhereDelivery ? ` · a ${quote.elsewhereDelivery.distanceKm.toLocaleString('es')} km del centro de ${activeCity?.name ?? ''}` : ''}`
                : crossCityDelivery
                  ? `Entrega en ${findCity(deliveryCityCode, cities)?.name ?? ''} (entre localidades)`
                  : null
            }
            quote={quote}
            quoteLoading={quoteLoading}
            online={online}
            submitting={submitting}
            onBack={() => setStep('delivery')}
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

function ReviewStep(props: {
  pickupDescription: string
  pickupPlace: string
  recipientName: string
  recipientPhone: string
  address: string
  reference: string
  collectSummary: string | null
  /** "Entrega en San Antonio (entre localidades)" / "Entrega en otra ubicación · a 5 km…" (null = misma localidad). */
  deliveryNote: string | null
  quote: MandadoQuote | null
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
        <h2 className="text-h3 text-text-primary">Recogida</h2>
        <p className="text-body text-text-primary">{props.pickupDescription}</p>
        <p className="text-caption text-text-secondary">{props.pickupPlace}</p>
      </section>

      <section className="rounded-r-md bg-surface border border-border p-3 space-y-1">
        <h2 className="text-h3 text-text-primary">Entrega</h2>
        <p className="text-body text-text-primary">
          {props.recipientName} · {props.recipientPhone}
        </p>
        <p className="text-body text-text-primary">{props.address}</p>
        {props.reference && <p className="text-caption text-text-secondary">{props.reference}</p>}
        {props.deliveryNote && <p className="text-caption font-semibold text-primary-text">{props.deliveryNote}</p>}
        {props.collectSummary && <p className="text-caption font-semibold text-warning-text">{props.collectSummary}</p>}
      </section>

      {quote ? (
        <section aria-label="Total del mandado" className="rounded-r-md bg-surface border border-border p-3 space-y-1">
          <QuoteRow
            label={quote.elsewhereDelivery ? 'Mensajería por kilómetro' : quote.crossCityDelivery ? 'Mensajería entre localidades' : 'Mensajería'}
            value={formatCup(quote.deliveryFee)}
          />
          <QuoteRow label="Total a pagar" value={formatCup(quote.total)} strong />
          <p className="text-caption text-text-secondary">Calculado por Tráelo — el servidor lo vuelve a confirmar al crear el mandado.</p>
        </section>
      ) : (
        <p className="text-caption text-text-secondary" aria-live="polite">
          {props.quoteLoading ? 'Calculando el total…' : 'El total lo calcula el backend al confirmar.'}
        </p>
      )}

      {!props.online && (
        <p className="text-caption font-semibold text-danger-text">
          Sin conexión — no podemos confirmar tu mandado ahora. Conéctate a Internet para continuar.
        </p>
      )}

      <div className="space-y-2">
        <Button fullWidth loading={props.submitting} disabled={!props.online} onClick={props.onConfirm}>
          Confirmar mandado
        </Button>
        <Button fullWidth variant="outline" disabled={props.submitting} onClick={props.onBack}>
          Cambiar datos
        </Button>
      </div>
    </>
  )
}
