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
        // The blue-and-green tree logo is retired. brand-blue is no longer the
        // logo's blue: it is navy lightened — same hue (216) and saturation, so
        // it reads as part of the navy/gold identity instead of against it.
        // Kept at the old lightness so section rhythm is unchanged, and it
        // clears 4.5:1 with white text and 2:1 against navy so adjacent
        // sections stay distinct.
        'brand-blue': '#244D89',      // navy, lightened — large CTA surfaces
        paper: '#F4F8FA',             // light section background
        line: '#DBE6EC',              // soft hairline border
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [],
}
export default config
