/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f6f7f9",
          100: "#eceff3",
          200: "#cfd6e1",
          300: "#a8b4c8",
          400: "#7a8ea9",
          500: "#5b6f8b",
          600: "#47586f",
          700: "#3a475b",
          800: "#2f3a4a",
          900: "#273140",
        },
      },
      animation: {
        'float': 'float 20s infinite linear',
        'fadeIn': 'fadeIn 0.6s ease-out',
        'slideInLeft': 'slideInLeft 0.8s ease-out',
        'slideInRight': 'slideInRight 0.8s ease-out',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};


