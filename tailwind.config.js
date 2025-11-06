/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern dark theme palette
        'dark-bg': '#060a1c',
        'dark-surface': '#0E1429',
        'dark-border': '#21253B',
        'accent-blue': '#3461FF',
        'accent-blue-light': '#567BFF',
        'accent-green': '#10b981',
        'text-primary': '#FFFFFF',
        'text-secondary': '#AFB2C0',
        'text-muted': '#6F7280',
      },
      maxWidth: {
        '8xl': '1440px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
