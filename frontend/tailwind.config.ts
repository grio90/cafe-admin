import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dbe4ff',
          500: '#4f46e5',
          600: '#4338ca',
          700: '#3730a3',
        },
        surface: {
          DEFAULT: '#1e1e2e',
          card: '#2a2a3e',
          input: '#16162a',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
