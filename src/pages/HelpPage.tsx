import { Link, useNavigate } from "react-router-dom";

function BackButton() {
  const navigate = useNavigate();
  function goBack() {
    const idx = (window.history.state?.idx as number | undefined) ?? 0;
    if (idx > 0) navigate(-1);
    else navigate("/");
  }
  return (
    <button
      onClick={goBack}
      className="h-10 pl-2.5 pr-3.5 rounded-full bg-surface border border-border shadow-soft flex items-center gap-1.5 text-text-primary font-bold text-sm active:scale-95 transition-transform"
      aria-label="Volver"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Volver
    </button>
  );
}

function HelpLink({
  to,
  icon,
  title,
  description,
}: {
  to: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-4 shadow-soft active:scale-[0.99] transition-transform"
    >
      <span className="text-2xl">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-text-primary">{title}</p>
        <p className="text-xs text-text-secondary mt-0.5">{description}</p>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="text-text-secondary shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
      </svg>
    </Link>
  );
}

export function HelpPage() {
  return (
    <div className="animate-fade-in">
      <header className="px-4 pt-4 pb-4 flex items-center gap-3">
        <BackButton />
        <h1 className="text-lg font-extrabold text-text-primary">Ayuda</h1>
      </header>

      <div className="px-4 pb-10 space-y-3">
        <HelpLink
          to="/privacidad"
          icon="🔒"
          title="Política de privacidad"
          description="Cómo recopilamos, usamos y protegemos tu información."
        />
        <HelpLink
          to="/borrarusuario"
          icon="🗑️"
          title="Solicitar eliminar mis datos"
          description="Pide la eliminación de tu cuenta y tu información personal."
        />
      </div>
    </div>
  );
}
