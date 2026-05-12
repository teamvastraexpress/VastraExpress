/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#1A6FC4",
          sky: "#4EAEE5",
          bubble: "#A8D8F0",
          hero: "#E8F4FB",
          section: "#F0F8FF",
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        accent: {
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          gold: "#F5A623",
        },
        text: {
          dark: "#1B2A3B",
          mid: "#4A5A6B",
          light: "#8FA3B1",
        },
        offwhite: "#F7FBFF",
        success: '#16a34a',
        warning: '#d97706',
        danger:  '#dc2626',
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
      },
    },
  },
  plugins: [],
};
