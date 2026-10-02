/** Color de un token de src/index.css con soporte de opacidad de Tailwind. */
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Colores = variables CSS de src/index.css (espejo de theme.ts de la app móvil), así el
      // modo oscuro cambia solo con `data-theme` y Tailwind sigue admitiendo opacidad (`/10`).
      colors: {
        background: token('background'),
        surface: {
          DEFAULT: token('surface'),
          muted: token('surface-muted'),
        },
        border: token('border'),
        primary: {
          DEFAULT: token('primary'),
          hover: token('primary-pressed'),
          text: token('primary-text'),
          soft: token('primary-soft'),
          on: token('on-primary'),
        },
        text: {
          primary: token('text'),
          secondary: token('text-secondary'),
          tertiary: token('text-tertiary'),
          disabled: token('text-disabled'),
        },
        success: { DEFAULT: token('success'), text: token('success-text') },
        warning: { DEFAULT: token('warning'), text: token('warning-text') },
        danger: { DEFAULT: token('danger'), text: token('danger-text'), soft: token('danger-soft') },
        info: { DEFAULT: token('info'), soft: token('info-soft') },
        gold: {
          DEFAULT: token('gold'),
          light: token('gold-light'),
          soft: token('gold-soft'),
          text: token('gold-text'),
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      // Jerarquía tipográfica de la app (theme.ts `typography`): [tamaño, interlineado].
      fontSize: {
        display: ['30px', { lineHeight: '38px', letterSpacing: '-0.4px', fontWeight: '800' }],
        h1: ['26px', { lineHeight: '34px', letterSpacing: '-0.3px', fontWeight: '700' }],
        h2: ['21px', { lineHeight: '28px', letterSpacing: '-0.2px', fontWeight: '700' }],
        h3: ['17px', { lineHeight: '24px', fontWeight: '600' }],
        body: ['15px', '22px'],
        'body-sm': ['13px', '19px'],
        caption: ['13px', '18px'],
        label: ['12px', { lineHeight: '16px', letterSpacing: '0.2px', fontWeight: '600' }],
      },
      // Degradados de marca (theme.ts `gradients`); el naranja no cambia entre temas.
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #FB923C 0%, #F97316 55%, #EA580C 100%)',
        'gradient-hero': 'linear-gradient(135deg, #F97316 0%, #EA580C 55%, #C2410C 100%)',
        'gradient-warm': 'linear-gradient(160deg, rgb(var(--c-primary-soft)) 0%, rgb(var(--c-background)) 100%)',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(var(--shadow-color) / 0.04), 0 6px 18px -8px rgb(var(--shadow-color) / 0.10)',
        'card-hover': '0 8px 28px -10px rgba(249,115,22,0.35)',
        soft: '0 2px 10px -2px rgb(var(--shadow-color) / 0.08)',
        float: '0 4px 12px 0 rgb(var(--shadow-color) / 0.12)',
        'btn-primary': '0 6px 16px -6px rgba(249,115,22,0.55)',
        nav: '0 -2px 16px -6px rgb(var(--shadow-color) / 0.12)',
      },
      // Ancho de la columna de contenido en escritorio (ver AppShell).
      maxWidth: {
        content: '48rem',
      },
      // Radios de la app (theme.ts `radii`: sm 6 · md 10 · lg 16) + los que ya usaba la web.
      borderRadius: {
        'r-sm': '6px',
        'r-md': '10px',
        'r-lg': '16px',
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'slide-up': 'slide-up 0.28s cubic-bezier(0.16,1,0.3,1)',
        'scale-in': 'scale-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
