import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { SUPPORT_PHONE_LABEL, SUPPORT_WHATSAPP, SUPPORT_WHATSAPP_URL } from '../lib/config'
import { usePointsStore } from '../store/pointsStore'

function BackButton() {
  const navigate = useNavigate()
  function goBack() {
    const idx = (window.history.state?.idx as number | undefined) ?? 0
    if (idx > 0) navigate(-1)
    else navigate('/')
  }
  return (
    <button
      onClick={goBack}
      className="h-10 pl-2.5 pr-3.5 rounded-full bg-surface border border-border shadow-soft flex items-center gap-1.5 text-text-primary font-bold text-sm active:scale-95 transition-transform"
      aria-label="Volver"
    >
      <Icon name="chevron-left" size={20} />
      Volver
    </button>
  )
}

type Faq = { question: string; answer: string }
type FaqGroup = { title: string; icon: 'cart' | 'storefront' | 'star' | 'person' } & { faqs: Faq[] }

/** Preguntas frecuentes por tema — mismo contenido que `HelpScreen` de mobile. Las de puntos dependen de la regla vigente. */
function buildGroups(divisor: number, bonusPoints: number): FaqGroup[] {
  return [
    {
      title: 'Tu pedido',
      icon: 'cart',
      faqs: [
        {
          question: '¿Necesito una cuenta para comprar?',
          answer:
            'No. Puedes pedir como invitado con tu nombre, teléfono y dirección. Crear una cuenta es opcional y te da puntos, notificaciones, favoritos y poder valorar tus pedidos.',
        },
        {
          question: '¿Cómo sé si mi pedido fue recibido?',
          answer: 'En cuanto confirmas verás el número de pedido y su estado, con el detalle siempre disponible en "Mis pedidos".',
        },
        {
          question: '¿Cómo sigo mi pedido?',
          answer:
            'En el detalle del pedido ves el recorrido: Confirmado, Marchando, Recogiendo y En camino. Cuando el mensajero recoge tu pedido puedes verlo en el mapa.',
        },
        {
          question: '¿Puedo cambiar mi pedido después de confirmarlo?',
          answer: 'No directamente en la web. Escríbenos por WhatsApp cuanto antes y te ayudamos.',
        },
        {
          question: 'Hice otro pedido a los pocos minutos, ¿se cobra todo por separado?',
          answer:
            'Si haces dos pedidos seguidos con el mismo teléfono, nuestro equipo puede unirlos en uno solo para que el mensajero haga un único viaje. Se recalcula la mensajería y te avisamos.',
        },
      ],
    },
    {
      title: 'Productos y horarios',
      icon: 'storefront',
      faqs: [
        {
          question: '¿Qué pasa si un producto está agotado o el local cerrado?',
          answer:
            'Los productos agotados se ven con la etiqueta "Agotado" y no se pueden agregar. Si un local cierra o algo cambia de precio o disponibilidad, te avisamos en el carrito, antes de confirmar.',
        },
        {
          question: '¿Puedo elegir para cuándo quiero el pedido?',
          answer:
            'Sí: "Lo antes posible" o una hora de hoy. Cada negocio tiene su propio horario: si está cerrado o no acepta pedidos, te lo diremos en el carrito antes de confirmar.',
        },
        {
          question: '¿Qué es el sabor/tipo, el agrego y el envase?',
          answer:
            'Algunos productos piden elegir un tipo o sabor. El agrego es un extra opcional (uno por producto) y el envase tiene su propio costo. El mismo producto con otro agrego o envase cuenta como una línea distinta del carrito.',
        },
      ],
    },
    {
      title: 'Puntos',
      icon: 'star',
      faqs: [
        {
          question: '¿Cómo gano puntos?',
          answer:
            `Con cuenta, ganas 1 punto por cada ${divisor} CUP del Servicio Tráelo de tus pedidos, y se acreditan cuando el pedido se entrega.` +
            (bonusPoints > 0 ? ` Además, tu primer pedido desde la web te da ${bonusPoints} puntos de regalo.` : '') +
            ' Los pedidos de invitado no suman puntos.',
        },
        {
          question: '¿En qué puedo usar mis puntos?',
          answer: 'Canjeando una recompensa: un producto que se paga en puntos en vez de dinero. Se elige desde el carrito, en "Usa tus puntos".',
        },
        {
          question: '¿Los puntos cubren la mensajería?',
          answer: 'No. Los puntos solo pagan el producto canjeado; la mensajería, el Servicio Tráelo y el envase se pagan aparte.',
        },
        {
          question: 'Cancelaron mi pedido, ¿qué pasa con los puntos que usé?',
          answer: 'Se te devuelven completos a tu saldo, porque no llegaste a usarlos.',
        },
        {
          question: '¿Dónde veo mis movimientos de puntos?',
          answer: 'En "Puntos", dentro de tu cuenta: ahí ves tu saldo y cada movimiento — lo que ganaste, lo que usaste y lo que se te devolvió.',
        },
      ],
    },
    {
      title: 'Cuenta y datos',
      icon: 'person',
      faqs: [
        {
          question: '¿Dónde se guardan mis direcciones?',
          answer: 'En este navegador. Puedes guardar varias y elegirlas al pedir; cerrar sesión no las borra.',
        },
        {
          question: 'Olvidé mi contraseña',
          answer: 'Desde "Iniciar sesión" toca "Olvidé mi contraseña" y te ayudamos por WhatsApp a recuperarla.',
        },
        {
          question: '¿Cómo valoro un pedido?',
          answer: 'Con cuenta, cuando tu pedido se entrega puedes valorarlo desde el detalle del pedido. Los pedidos de invitado no se pueden valorar.',
        },
      ],
    },
  ]
}

function FaqAccordion({ faq }: { faq: Faq }) {
  return (
    <details className="group border-b border-border last:border-b-0">
      <summary className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer list-none font-semibold text-[15px] text-text-primary marker:content-none">
        <span>{faq.question}</span>
        <Icon name="chevron-down" size={18} className="shrink-0 text-text-tertiary transition-transform group-open:rotate-180" />
      </summary>
      <p className="px-4 pb-4 text-body text-text-secondary">{faq.answer}</p>
    </details>
  )
}

/** "Ayuda" — `HelpScreen` de mobile: contacto (WhatsApp/llamar), cómo funcionan los puntos y preguntas frecuentes por tema. */
export function HelpPage() {
  const navigate = useNavigate()
  const divisor = usePointsStore((state) => state.divisor)
  const bonus = usePointsStore((state) => state.firstOrderBonus)
  const groups = useMemo(() => buildGroups(divisor, bonus.points), [divisor, bonus.points])

  return (
    <div className="animate-fade-in px-4 lg:px-0 pb-10">
      <header className="pt-4 pb-4 flex items-center gap-3">
        <BackButton />
        <h1 className="text-lg font-extrabold text-text-primary">Ayuda</h1>
      </header>

      <div className="space-y-4">
        <div className="rounded-2xl bg-gradient-hero p-5 text-white shadow-card space-y-1">
          <h2 className="text-h2">¿Necesitas ayuda?</h2>
          <p className="text-body opacity-95">Escríbenos o llámanos, estamos para ayudarte con tu pedido.</p>
          <div className="flex gap-3 pt-3">
            <a
              href={SUPPORT_WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="flex-1 min-h-12 inline-flex items-center justify-center gap-2 rounded-r-md bg-white px-4 font-semibold text-[#1F1A16]"
            >
              <Icon name="whatsapp" size={18} className="text-success" />
              WhatsApp
            </a>
            <a
              href={`tel:+${SUPPORT_WHATSAPP}`}
              className="flex-1 min-h-12 inline-flex items-center justify-center gap-2 rounded-r-md bg-white px-4 font-semibold text-[#1F1A16]"
            >
              <Icon name="phone" size={18} className="text-primary-text" />
              Llamar
            </a>
          </div>
          <p className="text-caption opacity-90 pt-1">{SUPPORT_PHONE_LABEL}</p>
        </div>

        <div className="rounded-2xl bg-gold-soft p-5 space-y-3" data-testid="help-points-summary">
          <h2 className="text-h3 text-text-primary">⭐ Así funcionan tus puntos</h2>
          <div className="flex items-start gap-3">
            <Icon name="cart" size={20} className="text-primary shrink-0 mt-0.5" />
            <p className="text-body text-text-primary">
              <span className="font-semibold">Ganas</span> con cada pedido entregado (con cuenta).
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Icon name="gift" size={20} className="text-primary shrink-0 mt-0.5" />
            <p className="text-body text-text-primary">
              <span className="font-semibold">Usas</span> tus puntos para canjear recompensas desde el carrito.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Icon name="refresh" size={20} className="text-primary shrink-0 mt-0.5" />
            <p className="text-body text-text-primary">
              <span className="font-semibold">Recuperas</span> los puntos si cancelan el pedido. No cubren mensajería ni Servicio Tráelo.
            </p>
          </div>
        </div>

        {groups.map((group) => (
          <section key={group.title} className="space-y-2" data-testid={`help-group-${group.title}`}>
            <div className="flex items-center gap-2">
              <Icon name={group.icon} size={20} className="text-primary" />
              <h2 className="text-h3 text-text-primary">{group.title}</h2>
            </div>
            <div className="rounded-2xl bg-surface border border-border/60 overflow-hidden">
              {group.faqs.map((faq) => (
                <FaqAccordion key={faq.question} faq={faq} />
              ))}
            </div>
          </section>
        ))}

        <section className="space-y-2">
          <h2 className="text-h3 text-text-primary">Legal</h2>
          <nav className="rounded-2xl bg-surface border border-border/60 divide-y divide-border">
            <button
              onClick={() => navigate('/privacidad')}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-muted transition"
            >
              <span className="text-xl" aria-hidden="true">🔒</span>
              <span className="flex-1 font-semibold text-text-primary">Política de privacidad</span>
              <Icon name="chevron-right" size={18} className="text-text-tertiary" />
            </button>
            <button
              onClick={() => navigate('/borrarusuario')}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-muted transition"
            >
              <span className="text-xl" aria-hidden="true">🗑️</span>
              <span className="flex-1 font-semibold text-text-primary">Solicitar eliminar mis datos</span>
              <Icon name="chevron-right" size={18} className="text-text-tertiary" />
            </button>
          </nav>
        </section>

        <p className="text-center text-caption text-text-tertiary pt-2">¿No encuentras lo que buscas? Escríbenos por WhatsApp.</p>
      </div>
    </div>
  )
}
