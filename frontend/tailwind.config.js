/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        'slate-dark': '#0F172A',
        'slate-light': '#F8FAFC',
        'accent-blue': '#3B82F6',
      }
    },
  },
  plugins: [],
}