/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#fcf9f0',
          dim: '#dddad1',
          bright: '#fcf9f0',
          container: '#f1eee5',
        },
        primary: {
          DEFAULT: '#552c00', // Sepia
          container: '#704214',
        },
        secondary: {
          DEFAULT: '#4c5f7c', // Faded Navy
        },
        tertiary: {
          DEFAULT: '#5a2627', // Dusty Rose
        },
        on: {
          surface: '#1c1c17',
          'surface-variant': '#51443a',
        },
        outline: {
          DEFAULT: '#847469',
          variant: '#d6c3b6',
        },
      },
      fontFamily: {
        heading: ['Newsreader', 'serif'],
        body: ['Work Sans', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px rgba(112, 66, 20, 0.08)',
        inset: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        sm: '0.125rem',
        md: '0.25rem',
        lg: '0.5rem',
      },
    },
  },
  plugins: [],
}
