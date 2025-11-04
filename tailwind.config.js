/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nfl-primary': '#013369',
        'nfl-secondary': '#D50A0A',
        'ncaaf-primary': '#1B1F23',
        'ncaaf-secondary': '#FFA500',
      },
    },
  },
  plugins: [],
}
