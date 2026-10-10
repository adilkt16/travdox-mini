/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Completely replace default Tailwind colors with project palette
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      paper: {
        DEFAULT: '#F1E8D2',
        shadow: '#E4D7B8',
        light: '#F7F1E1',
        dark: '#DCCEA5',
      },
      ink: {
        DEFAULT: '#1C2B4B',
        light: '#31446B',
        faded: '#56668B',
      },
      cover: {
        DEFAULT: '#5A1F26',
        dark: '#3F1419',
        light: '#722830',
      },
      gold: {
        DEFAULT: '#C9A24B',
        dark: '#A57F2C',
        light: '#F2DC8A',
        base: '#C9A24B',
      },
      stamp: {
        blue: '#2A4B9B',
        red: '#B23A2B',
        green: '#2F6B4F',
        violet: '#5B3F8C',
      },
    },
    fontFamily: {
      // Default font stack is Source Serif 4 (body), IM Fell English (headings), Special Elite (typewriter), Big Shoulders Display (stamps)
      sans: ['"Source Serif 4"', 'Georgia', 'serif'],
      serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      heading: ['"IM Fell English"', 'Georgia', 'serif'],
      typewriter: ['"Special Elite"', '"Courier New"', 'monospace'],
      stamp: ['"Big Shoulders Display"', 'sans-serif'],
    },
    extend: {
      boxShadow: {
        'passport': '0 20px 40px -15px rgba(28, 43, 75, 0.4), 0 0 0 1px rgba(28, 43, 75, 0.1)',
        'emboss': 'inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.6)',
      },
      animation: {
        'shimmer-slow': 'shimmer 4s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { filter: 'brightness(1) contrast(1)' },
          '50%': { filter: 'brightness(1.25) contrast(1.1)' },
        },
      },
    },
  },
  plugins: [],
}
