/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ── Premium Light Blue Design System ──────────────────────
        primary: {
          50:  '#F0F7FF',
          100: '#E0EFFF',
          200: '#BAD8FE',
          300: '#7DB8FC',
          400: '#4DA6FF',   // Main brand
          500: '#2B93F5',
          600: '#1A7DE0',
          700: '#1466B8',
          800: '#155197',
          900: '#16437A',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F5FAFF',
          tertiary: '#EDF4FB',
          elevated: '#FFFFFF',
        },
        text: {
          primary: '#111827',
          secondary: '#6B7280',
          tertiary: '#9CA3AF',
          inverse: '#FFFFFF',
          brand: '#4DA6FF',
        },
        border: {
          DEFAULT: '#F0F0F0',
          light: '#F5F5F5',
          focus: '#4DA6FF',
        },
        status: {
          success:    '#10B981',
          'success-bg': '#ECFDF5',
          warning:    '#F59E0B',
          'warning-bg': '#FFFBEB',
          error:      '#EF4444',
          'error-bg': '#FEF2F2',
          info:       '#4DA6FF',
          'info-bg':  '#F0F7FF',
        },
      },
      borderRadius: {
        'xs':  '6px',
        'sm':  '8px',
        'md':  '12px',
        'lg':  '16px',
        'xl':  '20px',
        '2xl': '24px',
        '3xl': '28px',
      },
      spacing: {
        '18': '72px',
        '22': '88px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
        'elevated': '0 4px 12px rgba(0,0,0,0.06)',
        'float': '0 8px 24px rgba(0,0,0,0.08)',
        'brand': '0 4px 16px rgba(77,166,255,0.20)',
      },
    },
  },
  plugins: [],
};
