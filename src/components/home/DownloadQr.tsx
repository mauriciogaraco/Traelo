import { QRCodeSVG } from 'qrcode.react'

/** QR para bajar la app desde el teléfono cuando el flyer se ve en una computadora. Carga diferida. */
export default function DownloadQr({ url }: { url: string }) {
  return (
    <figure className="flex flex-col items-center gap-2">
      <div className="rounded-r-lg bg-white p-3 shadow-float">
        <QRCodeSVG value={url} size={124} fgColor="#1F1A16" level="M" />
      </div>
      <figcaption className="max-w-[170px] text-center text-caption text-white/90">Escanéalo con tu Android para descargarla</figcaption>
    </figure>
  )
}
