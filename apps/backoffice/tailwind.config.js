/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        tablet: '1024px',
        desktop: '1280px',
      },
      fontFamily: {
        sans: ['NexonLv1Gothic', 'Pretendard', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#061F40',
          light: '#062540',
          dark: '#051326',
        },
        secondary: {
          DEFAULT: '#979DA6',
          light: '#F2F2F2',
          dark: '#6B7280',
        },
        'samsung-light': '#F8FAFC',
      },
    },
  },
  plugins: [],
}

