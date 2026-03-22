/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fintech_blue: '#111827', // O azul-escuro profundo da interface
        fintech_yellow: '#F59E0B', // O amarelo 'Q' da QI Tech
        fintech_panel: '#1F2937', // O cinza-escuro dos painéis
      }
    },
  },
  plugins: [],
}