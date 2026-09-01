import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base — fundo e superfícies
        base: {
          950: '#0B0E12', // fundo principal (quase preto, levemente azulado)
          900: '#12161C', // fundo de página
          800: '#181D25', // cards
          700: '#212832', // cards elevados / hover
          600: '#2B3340', // bordas
          500: '#3A4453', // bordas em hover
        },
        // Texto
        ink: {
          100: '#F4F6F8', // texto principal
          300: '#B8C0CC', // texto secundário
          500: '#93A0B0', // texto terciário / placeholders (contraste ajustado p/ AA)
        },
        // Acento — ação principal (discreto, azul petróleo)
        accent: {
          400: '#5AA9E6',
          500: '#3D8BD1',
          600: '#2E6EAD',
        },
        // Positivo (lucro, receita)
        positive: {
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
        },
        // Negativo (gastos, prejuízo, alertas)
        negative: {
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
        },
        warning: {
          400: '#FBBF24',
          500: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        control: '10px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.24), 0 8px 24px -12px rgba(0,0,0,0.45)',
      },
    },
  },
  plugins: [],
};

export default config;
