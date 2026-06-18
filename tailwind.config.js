/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FAF8F5',
        surface: '#FFFFFF',
        secondary: '#F5E6D3',
        primary: {
          DEFAULT: '#C96A3D',
          hover: '#B05A30',
        },
        text: {
          primary: '#4A2C1A',
          secondary: '#8B6E5A',
        },
        border: '#E8DDD5',
        accent: '#7A8F5A',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        brand: ['Kaushan Script', 'cursive'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #D8794A 0%, #C96A3D 55%, #B05A30 100%)',
        'gradient-warm': 'linear-gradient(160deg, #F5E6D3 0%, #FAF8F5 100%)',
        'gradient-hero': 'linear-gradient(160deg, #F5E6D3 0%, #FDF6EE 60%, #FAF8F5 100%)',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(74,44,26,0.04), 0 6px 18px -8px rgba(74,44,26,0.10)',
        'card-hover': '0 8px 28px -10px rgba(201,106,61,0.35)',
        soft: '0 2px 10px -2px rgba(74,44,26,0.08)',
        'btn-primary': '0 6px 16px -6px rgba(201,106,61,0.55)',
        nav: '0 -2px 16px -6px rgba(74,44,26,0.12)',
      },
      borderRadius: {
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
