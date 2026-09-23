import { useNavigate } from "react-router-dom";

const CONTACT_EMAIL = "traeloofficial@gmail.com";
const MAILTO_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  "Solicitud de eliminación de datos - Tráelo",
)}&body=${encodeURIComponent(
  "Hola equipo de Tráelo,\n\nSolicito la eliminación de mi cuenta y mis datos personales.\n\nNombre completo:\nNúmero de teléfono asociado a la cuenta:\n\nGracias.",
)}`;

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

export function DeleteAccountPage() {
  return (
    <div className="animate-fade-in">
      <header className="px-4 pt-4 pb-4 flex items-center gap-3">
        <BackButton />
        <h1 className="text-lg font-extrabold text-text-primary">
          Eliminar mis datos
        </h1>
      </header>

      <div className="px-4 pb-10">
        <p className="text-sm text-text-secondary leading-relaxed">
          Puedes solicitar la eliminación de tu cuenta y de los datos
          personales asociados a ella en cualquier momento.
        </p>
        <p className="mt-3 text-sm text-text-secondary leading-relaxed">
          Para procesar tu solicitud, envíanos un correo a{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary underline">
            {CONTACT_EMAIL}
          </a>{" "}
          incluyendo la siguiente información para identificar tu cuenta:
        </p>
        <ul className="list-disc pl-5 mt-3 space-y-1 text-sm text-text-secondary">
          <li>Nombre completo.</li>
          <li>Número de teléfono asociado a la cuenta.</li>
        </ul>
        <p className="mt-3 text-sm text-text-secondary leading-relaxed">
          Una vez recibida tu solicitud, eliminaremos o anonimizaremos tu
          información personal, salvo aquella que debamos conservar por una
          razón legal o legítima (por ejemplo, registros de pedidos ya
          entregados). Puedes ver más detalles en nuestra{" "}
          <a href="/privacidad" className="font-semibold text-primary underline">
            Política de privacidad
          </a>
          .
        </p>

        <a
          href={MAILTO_HREF}
          className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 font-bold text-white shadow-soft transition-transform hover:scale-[1.02]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6" />
          </svg>
          Enviar solicitud por correo
        </a>
      </div>
    </div>
  );
}
