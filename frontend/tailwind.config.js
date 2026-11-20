/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#DE0E86',
          'pink-hover': '#C50B75',
          'pink-light': '#FDF2F8',
          navy: '#004582',
          'navy-dark': '#003362',
          'navy-light': '#F0F6FB',
          white: '#FFFFFF',
        },
        status: {
          success: '#16A34A',
          'success-bg': '#F0FDF4',
          danger: '#DC2626',
          'danger-bg': '#FEF2F2',
          warning: '#D97706',
          'warning-bg': '#FFFBEB',
          info: '#004582',
          'info-bg': '#F0F6FB',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        'card': '32px',
        '32': '32px',
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 69, 130, 0.08), 0 2px 6px -1px rgba(0, 69, 130, 0.04)',
        'card-hover': '0 12px 30px -4px rgba(0, 69, 130, 0.14), 0 4px 12px -2px rgba(0, 69, 130, 0.08)',
        'input': '0 2px 8px rgba(0, 69, 130, 0.05)',
        'input-focus': '0 4px 16px rgba(222, 14, 134, 0.18)',
        'modal': '0 20px 50px -10px rgba(0, 69, 130, 0.25)',
      }
    },
  },
  plugins: [],
}
