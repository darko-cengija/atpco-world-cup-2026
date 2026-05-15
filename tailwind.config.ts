import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#e6dcc5',
          card: '#f6efdb',
          border: 'rgba(15,58,53,0.2)',
          accent: '#0f3a35',
          'accent-hover': '#0a2723',
          ink: '#0f3a35',
          paper: '#e6dcc5',
          ticket: '#f6efdb',
          stamp: '#a8392b',
          'stamp-hover': '#7a2b20',
          gold: '#b3892e',
          muted: 'rgba(15,58,53,0.7)',
          faint: 'rgba(15,58,53,0.5)',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', '"Times New Roman"', 'serif'],
        sans: ['"Inter Tight"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ addVariant }: { addVariant: (name: string, definition: string) => void }) => {
      addVariant('landscape', '@media (orientation: landscape)')
    },
  ],
} satisfies Config
