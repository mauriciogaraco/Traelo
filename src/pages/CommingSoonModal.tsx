export function ComingSoonModal() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

        <div className="p-8 text-center">
          <div className="mb-6 text-6xl">🚀</div>

          <h1
            className="text-4xl text-orange-600 mb-3"
            style={{ fontFamily: "Kaushan Script" }}
          >
            Próximamente
          </h1>

          <p className="text-lg font-semibold text-text-primary">
            Estamos preparando algo especial para ti.
          </p>

          <div className="my-6 h-px bg-stone-200" />

          <p className="text-stone-600">Apertura oficial</p>

          <p className="mt-2 text-3xl font-extrabold text-orange-600">
            10 de Junio
          </p>

          <p className="mt-6 text-sm text-stone-500">
            Muy pronto podrás realizar tus pedidos directamente desde nuestra
            plataforma.
          </p>
        </div>
      </div>
    </div>
  );
}
