/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sakura: {
          light: '#FFF5F7',
          DEFAULT: '#FFB7C5',
          deep: '#FF91A4',
          accent: '#FF85A2',
        },
      },
    },
  },
  plugins: [],
}
