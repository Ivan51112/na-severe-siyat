import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        polar: {
          950: '#030712',
          900: '#070f1e',
          850: '#0a1628',
          800: '#0f1f38',
          700: '#172c4c',
          600: '#233f6b',
        },
        aurora: {
          green: '#00ff87',
          cyan: '#60efff',
          teal: '#1dd1a1',
          violet: '#a855f7',
          pink: '#f43f5e',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'aurora-glow': 'aurora 10s ease infinite alternate',
      },
      keyframes: {
        aurora: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
      },
      boxShadow: {
        'glow-green': '0 0 25px -5px rgba(0, 255, 135, 0.35)',
        'glow-cyan': '0 0 25px -5px rgba(96, 239, 255, 0.35)',
        'glow-violet': '0 0 25px -5px rgba(168, 85, 247, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
