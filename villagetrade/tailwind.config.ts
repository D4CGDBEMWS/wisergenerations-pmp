import type { Config } from 'tailwindcss'

// ---------------------------------------------------------------------------
// The VillageTrade palette, taken from the approved prototype.
//
// `gold` is the brand fill. `gold-text` is the same hue dropped to a lightness
// that clears WCAG AA as TEXT on white — brand golds almost never do, and a
// safety notice nobody can read is not a safety notice. A test asserts the
// contrast rather than trusting the eye.
// ---------------------------------------------------------------------------
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1B2F4E',
        'navy-soft': '#2A4A78',
        gold: '#C9920A',
        'gold-text': '#8A5A0C',
        'gold-pale': '#F7EDD4',
        green: '#2E5C3A',
        'green-pale': '#DFF0E8',
        warm: '#FAF8F4',
        'warm-2': '#F3EDE3',
        line: '#E4D9C8',
        ink: '#1A1612',
        muted: '#6B5F52',
        danger: '#B3261E',
        'danger-pale': '#FDECEA',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config
