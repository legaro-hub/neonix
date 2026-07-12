/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
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
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(212,255,58,0.25), 0 8px 40px -8px rgba(212,255,58,0.35)',
        'glow-sm': '0 0 24px -6px rgba(212,255,58,0.4)',
        'glow-lg': '0 0 60px -12px rgba(212,255,58,0.5)',
        'glow-cyan': '0 0 24px -6px rgba(0,229,255,0.4)',
        'glow-purple': '0 0 24px -6px rgba(139,92,246,0.4)',
        'neon': '0 0 5px rgba(212,255,58,0.3), 0 0 10px rgba(212,255,58,0.2), 0 0 20px rgba(212,255,58,0.1)',
        'neon-strong': '0 0 5px rgba(212,255,58,0.4), 0 0 15px rgba(212,255,58,0.3), 0 0 30px rgba(212,255,58,0.2), 0 0 60px rgba(212,255,58,0.1)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        'mesh-1':
          'radial-gradient(at 40% 20%, rgba(212,255,58,0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(0,229,255,0.06) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(139,92,246,0.04) 0px, transparent 50%)',
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glowpulse: {
          '0%,100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-out-right': {
          from: { transform: 'translateX(0)', opacity: '1' },
          to: { transform: 'translateX(100%)', opacity: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'active-dot': {
          '0%,100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.5)' },
        },
        'gradient-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'orbit': {
          from: { transform: 'rotate(0deg) translateX(100px) rotate(0deg)' },
          to: { transform: 'rotate(360deg) translateX(100px) rotate(-360deg)' },
        },
        'morph': {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
        'neon-pulse': {
          '0%, 100%': { boxShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
          '50%': { boxShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 40px currentColor' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        glowpulse: 'glowpulse 3s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-out-right': 'slide-out-right 0.2s ease-in',
        'fade-in': 'fade-in 0.4s ease-out',
        'fade-in-up': 'fade-in-up 0.6s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        'active-dot': 'active-dot 2s ease-in-out infinite',
        'gradient-flow': 'gradient-flow 4s linear infinite',
        'spin-slow': 'spin-slow 20s linear infinite',
        orbit: 'orbit 20s linear infinite',
        morph: 'morph 8s ease-in-out infinite',
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
