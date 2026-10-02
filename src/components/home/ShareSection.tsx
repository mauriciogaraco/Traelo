import { lazy, Suspense, useState } from "react";

const ShareModal = lazy(() => import("./ShareModal"));

/** Sección compacta "Compartir" que abre un modal con el QR de la web. */
export function ShareSection() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 bg-gradient-warm border border-border rounded-3xl p-4 active:scale-[0.99] transition-transform"
      >
        <span className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.9}
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path strokeLinecap="round" d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
          </svg>
        </span>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-bold text-text-primary">Comparte Tráelo</p>
          <p className="text-xs text-text-secondary">
            Muestra el QR o envíalo a tus amigos
          </p>
        </div>
        <svg
          className="text-text-secondary flex-shrink-0"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
        </svg>
      </button>

      {open && (
        <Suspense fallback={null}>
          <ShareModal onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}

