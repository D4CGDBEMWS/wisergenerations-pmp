import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0A1628',
        gold: '#C9A84C',
        // Functional gold. Same hue and saturation as the brand gold, taken
        // from 62% lightness down to 32%, for gold used as TEXT or a CONTROL
        // on a light surface -- where #C9A84C reads at 2.28:1 and fails AA.
        // It clears 4.5:1 on every light background in the palette: white
        // 5.43, navy/5 4.90, paper 5.08, slate-50 5.19, gold/20 4.68,
        // light-gold 5.00, light-navy 4.62.
        //
        // Brand gold is unchanged and stays exactly where it carries the
        // brand: fills, borders, rules, and text on navy, which already
        // reads at 7.93:1.
        'gold-text': '#7C6827',
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
