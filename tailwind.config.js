/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f8f3f1',
          100: '#f0e4df',
          200: '#e0c8bf',
          300: '#c79a8c',
          400: '#a86b5b',
          500: '#8d4a3b',
          600: '#7a382c',
          700: '#642e25',
          800: '#522820',
          900: '#44241e',
          950: '#26110d',
        },
        ink: {
          50:  '#f6f4f0',
          100: '#ece8e1',
          200: '#ddd6cb',
          300: '#c4baac',
          400: '#8f867a',
          500: '#6b6358',
          600: '#524c43',
          700: '#3c3731',
          800: '#29251f',
          900: '#1c1915',
          950: '#100e0c',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: 'none',
        'card-hover': 'none',
        modal: '0 16px 40px rgb(28 25 21 / 0.16)',
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
