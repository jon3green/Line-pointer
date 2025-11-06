/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Line Pointer brand colors - Modern dark theme
        'dark-bg': '#060a1c',
        'dark-surface': '#0E1429',
        'dark-card': '#141B33',
        'dark-border': '#21253B',
        'dark-hover': '#1A2038',

        // Primary brand colors (Blue-Purple gradient)
        'brand-blue': '#3461FF',
        'brand-blue-light': '#567BFF',
        'brand-purple': '#7C3AED',
        'brand-purple-light': '#9F7AEA',

        // Accent colors (Green for success/money/pointer)
        'accent-green': '#10B981',
        'accent-green-light': '#34D399',
        'accent-teal': '#14B8A6',
        'accent-orange': '#F59E0B',
        'accent-red': '#EF4444',

        // Text colors
        'text-primary': '#FFFFFF',
        'text-secondary': '#AFB2C0',
        'text-muted': '#6F7280',
        'text-dim': '#4B5563',
      },
      maxWidth: {
        '8xl': '1440px',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #567BFF 0%, #3461FF 100%)',
        'gradient-brand-hover': 'linear-gradient(135deg, #3461FF 0%, #2651E6 100%)',
        'gradient-success': 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
        'gradient-purple': 'linear-gradient(135deg, #9F7AEA 0%, #7C3AED 100%)',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(52, 97, 255, 0.3)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.3)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
}
