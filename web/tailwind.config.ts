/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ['Montserrat'],
        russo: ['Russo One'],
        ubuntu: ['Ubuntu'],
        exo2: ['"Exo 2"', 'sans-serif'],
        acorn: ['Acorn', 'sans-serif'],
        sansation: ['Sansation', 'sans-serif'],
        ancizar: ['Ancizar Sans', 'sans-serif'],
      },
      // colors: {
      //   cream: '#d9d7d5',
      //   dark: '#121212',
      //   textprimary: '#0b0907',
      //   textsecondary: '#8b8991',
      //   secondarycard: '#9AAB63',
      //   card: '#e0acd2',
      //   newyellow: '#eac854',
      //   newpink: '#deadd2',
      // },
      colors: {
        // Backgrounds
        background: {
          light: '#ffffff', // formerly 'cream'
          dark: '#121212',
          card: '#e0acd2',
          cardSecondary: '#9AAB63',
          accentYellow: '#eac854',
          accentPink: '#deadd2',
        },

        // Text
        text: {
          primary: '#0b0907',
          secondary: '#8b8991',
          inverted: '#ffffff',
          darkred: '#cf1322',
          lightred: '#ffa39e',
        },

        // Standalone shorthand aliases (optional for convenience)
        cream: '#d9d7d5',
        dark: '#121212',
        yellow: '#eac854',
        pink: '#deadd2',
        greenish: '#9AAB63',
        lavender: '#e0acd2',
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

// #faf4e4
// #121212
