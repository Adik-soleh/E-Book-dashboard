/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1C1A38',
          dark: '#111028',
          light: '#312F5E',
        },
        accent: '#38bdf8',
        highlight: '#fdb235',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 10px 45px rgba(56, 189, 248, 0.35)',
      },
    },
  },
  plugins: [],
};
