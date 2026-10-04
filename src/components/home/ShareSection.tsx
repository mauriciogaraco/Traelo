import { Link } from "react-router-dom";
import { Icon } from "../ui/Icon";

/**
 * Invitación del Home a "Invita y gana": lleva directo a /referidos (con cuenta, el código y el
 * enlace para compartir; sin cuenta, la invitación a crearla).
 */
export function ShareSection() {
  return (
    <Link
      to="/referidos"
      className="w-full flex items-center gap-3 bg-gradient-warm border border-border rounded-3xl p-4 active:scale-[0.99] transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
    >
      <span className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
        <Icon name="gift" size={22} />
      </span>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-bold text-text-primary">Invita amigos y gana puntos</p>
        <p className="text-xs text-text-secondary">
          Ganas puntos cuando tus amigos hagan su primer pedido
        </p>
      </div>
      <Icon name="chevron-right" size={18} className="text-text-secondary flex-shrink-0" />
    </Link>
  );
}
