import { Link, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
//import { WHATSAPP_NUMBER } from "../../lib/whatsapp";

{
  /*const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hola 👋, tengo una consulta sobre Tráelo.",
)}`; */
}

const navItems = [
  {
    to: "/",
    label: "Inicio",
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 11.5 12 4l9 7.5M5.5 10v9a1 1 0 0 0 1 1H10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5h3.5a1 1 0 0 0 1-1v-9"
        />
      </svg>
    ),
  },
  {
    to: "/categorias",
    label: "Categorías",
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.8}
      >
        <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.8" />
        <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.8" />
        <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.8" />
        <rect x="13" y="13" width="7.5" height="7.5" rx="1.8" />
      </svg>
    ),
  },
  {
    to: "/pedidos",
    label: "Pedidos",
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
        />
        {!active && (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 10h8M8 14h6"
          />
        )}
      </svg>
    ),
  },
  {
    to: "/carrito",
    label: "Carrito",
    badge: true,
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 5h2l1.5 10.5a1 1 0 0 0 1 .9h7.8a1 1 0 0 0 1-.8L19 8H7"
        />
        <circle cx="9.5" cy="20" r="1.4" />
        <circle cx="17" cy="20" r="1.4" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const location = useLocation();
  const { itemCount } = useCart();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] z-50 bg-surface/95 backdrop-blur-md border-t border-border shadow-nav pb-safe">
      <div className="flex items-stretch justify-around px-1 py-1.5">
        {navItems.map((item) => {
          const active =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              id={item.to === "/carrito" ? "cart-fly-target" : undefined}
              className={`relative flex flex-col items-center gap-1 flex-1 py-2 rounded-2xl transition-colors ${
                active ? "text-primary" : "text-text-secondary"
              }`}
            >
              <span className="relative">
                {item.icon(active)}
                {item.badge && itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-bold">{item.label}</span>
            </Link>
          );
        })}

        {/* WhatsApp — contacto directo 
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex flex-col items-center gap-1 flex-1 py-2 rounded-2xl text-text-secondary hover:text-[#16A34A] transition-colors"
        >
          <span className="text-[#25D366]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.5 14.4c-.3-.1-1.7-.9-2-1s-.5-.1-.7.1-.7.9-.9 1.1-.3.2-.6.1a8 8 0 0 1-2.4-1.5 9 9 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.4-.5.3-.5v-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.5a1 1 0 0 0-.8.4 3 3 0 0 0-1 2.2 5.3 5.3 0 0 0 1.2 2.8 12 12 0 0 0 4.6 4c.6.3 1.1.4 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.2-.2-.5-.3Z" />
              <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.4A10 10 0 1 0 12 2Zm0 18.3a8.3 8.3 0 0 1-4.2-1.2l-.3-.2-2.9.8.8-2.8-.2-.3A8.3 8.3 0 1 1 12 20.3Z" />
            </svg>
          </span>
          <span className="text-[11px] font-bold">WhatsApp</span>
        </a>
        */}
      </div>
    </nav>
  );
}
