import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0A1628',
        gold: '#C9A84C',
        'light-navy': '#E8EDF5',
        'light-gold': '#FBF5E8',
        teal: '#156082',
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [],
}
export default config
