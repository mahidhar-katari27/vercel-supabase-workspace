import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(var(--bg) / <alpha-value>)',
        surface: 'hsl(var(--surface) / <alpha-value>)',
        raised: 'hsl(var(--raised) / <alpha-value>)',
        line: 'hsl(var(--line) / <alpha-value>)',
        ink: 'hsl(var(--ink) / <alpha-value>)',
        muted: 'hsl(var(--muted) / <alpha-value>)',
        faint: 'hsl(var(--faint) / <alpha-value>)',

        leaf: {
          50: 'hsl(var(--leaf-50) / <alpha-value>)',
          100: '#dcf2e4',
          200: '#b6e5c9',
          300: '#7fcfa4',
          400: '#4bb37c',
          500: '#22965c',
          600: '#157a48',
          700: '#11603a',
          800: '#0e4b30',
          900: '#0b3a26',
          950: '#062417',
        },
        earth: {
          100: '#f0e5d6',
          200: '#e0cdb4',
          300: '#c9ab86',
          400: '#b18c62',
          500: '#8d6a45',
          600: '#6f5235',
          700: '#553e29',
          800: '#3b2b1d',
          900: '#241a12',
        },
        gold: {
          300: '#f2d68a',
          400: '#e6bf5c',
          500: '#d4a537',
          600: '#b3862a',
        },
        sky: {
          400: '#5aa9e6',
          500: '#3b8fd4',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        soft: '0 1px 2px hsl(var(--shadow) / 0.04), 0 8px 24px -12px hsl(var(--shadow) / 0.18)',
        lift: '0 2px 4px hsl(var(--shadow) / 0.05), 0 18px 40px -16px hsl(var(--shadow) / 0.28)',
        glow: '0 0 0 1px hsl(var(--leaf-400) / 0.25), 0 8px 32px -8px hsl(var(--leaf-500) / 0.45)',
        inset: 'inset 0 1px 0 0 hsl(0 0% 100% / 0.06)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, hsl(var(--line) / 0.5) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--line) / 0.5) 1px, transparent 1px)',
        'leaf-gradient': 'linear-gradient(135deg, #22965c 0%, #157a48 55%, #0e4b30 100%)',
        'gold-gradient': 'linear-gradient(135deg, #e6bf5c 0%, #d4a537 60%, #b3862a 100%)',
        'hero-glow':
          'radial-gradient(60% 50% at 20% 10%, hsl(var(--leaf-400) / 0.18) 0%, transparent 60%), radial-gradient(50% 45% at 85% 25%, hsl(var(--gold-400) / 0.14) 0%, transparent 60%)',
      },
      backgroundSize: { grid: '56px 56px' },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-16px) rotate(1.5deg)' },
        },
        sway: {
          '0%, 100%': { transform: 'rotate(-2.5deg)' },
          '50%': { transform: 'rotate(2.5deg)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.85)', opacity: '0.7' },
          '70%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        scanline: {
          '0%': { top: '0%', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { top: '100%', opacity: '0' },
        },
        growUp: {
          '0%': { transform: 'scaleY(0)', opacity: '0' },
          '100%': { transform: 'scaleY(1)', opacity: '1' },
        },
        driftUp: {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '15%': { opacity: '0.5' },
          '100%': { transform: 'translateY(-120px) translateX(20px)', opacity: '0' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        sway: 'sway 5s ease-in-out infinite',
        shimmer: 'shimmer 2.2s infinite',
        pulseRing: 'pulseRing 2.4s cubic-bezier(0.24,0.46,0.45,0.94) infinite',
        scanline: 'scanline 2s ease-in-out infinite',
        growUp: 'growUp 0.9s cubic-bezier(0.22,1,0.36,1) forwards',
        driftUp: 'driftUp 9s linear infinite',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}

export default config
