import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0a2540',
          50: '#f4f7fa',
          100: '#e6edf4',
          200: '#c9d9e8',
          300: '#9db9d3',
          400: '#6a92b8',
          500: '#47739f',
          600: '#365b83',
          700: '#2d4a6b',
          800: '#28405a',
          900: '#0a2540',
          950: '#071426',
        },
        paper: {
          DEFAULT: '#fdfcfa',
          shade: '#f6f4f0',
          line: '#e6e2db',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        // `ch` measures the zero glyph, which is wider than the average letter,
        // so 68ch rendered as ~90 real characters per line. 52ch lands in the
        // 65-75 range that actually reads well.
        prose: '52ch',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
      },
    },
  },
  plugins: [],
}

export default config
