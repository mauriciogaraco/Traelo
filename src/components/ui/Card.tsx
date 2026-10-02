import type { HTMLAttributes } from 'react'

/** Superficie base de tarjetas (radio lg = 16 px, como las cards de mobile). */
export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-r-lg bg-surface border border-border shadow-card ${className}`} {...props} />
}
