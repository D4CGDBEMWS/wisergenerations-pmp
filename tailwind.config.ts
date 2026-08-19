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
        // Brand palette drawn from the logo + Practice Studio:
        'brand-blue': '#166497',      // logo blue — primary surfaces/headings
        'brand-blue-dark': '#114F7A', // darker blue for hovers/depth
        leaf: '#4A9A5E',              // logo leaf green — secondary accent
        'leaf-soft': '#DCEFE1',       // soft green tint for chips/success
        paper: '#F4F8FA',             // light blue-tinted section background
        line: '#DBE6EC',              // soft blue-gray border
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [],
}
export default config
