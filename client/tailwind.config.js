/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Графитовая шкала
        graphite: {
          950: '#0a0b0d',
          900: '#0d0f12',
          850: '#111418',
          800: '#15181d',
          750: '#1b1f25',
          700: '#232830',
          600: '#2e343d',
          500: '#3a414c',
          400: '#525b68',
          300: '#7a8290',
          200: '#a8aeb8',
          100: '#d2d6dc',
        },
        // Неоновый лайм — акцент
        lime: {
          DEFAULT: '#d4ff3a',
          400: '#e0ff6e',
          500: '#d4ff3a',
          600: '#b8e62b',
          700: '#94b81f',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(212,255,58,0.25), 0 8px 40px -8px rgba(212,255,58,0.35)',
        'glow-sm': '0 0 24px -6px rgba(212,255,58,0.4)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glowpulse: {
          '0%,100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        glowpulse: 'glowpulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
