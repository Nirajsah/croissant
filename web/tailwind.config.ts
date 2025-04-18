/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ['Montserrat'],
        russo: ['Russo One'],
      },

      keyframes: {
        'fade-slide': {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-slide': 'fade-slide 300ms ease-out',
      },
    },
  },
  plugins: [],
}
