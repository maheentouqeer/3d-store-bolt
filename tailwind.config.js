/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        deep: '#0B2A6F',
        signal: '#E5322D',
        paper: '#F6F4EE',
        ink: '#14213D',
        shelf: '#FFFFFF',
      },
      fontFamily: {
        sign: ['Bricolage Grotesque', 'sans-serif'],
        ui: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '12px',
      },
    },
  },
  plugins: [],
}
