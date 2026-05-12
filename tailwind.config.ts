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
          bg: '#0a1628',
          card: '#1a2942',
          border: '#2a3952',
          accent: '#00d4ff',
          'accent-hover': '#00bdeb',
        },
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
