export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#276351',      // Emerald Green
        secondary: '#D4B483',    // Arabic Beige
        accent: '#E3B23C',       // Warm Gold
        background: '#F7F3EB',   // Cream White
        text: '#3C2F2F',         // Dark Brown
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        arabic: ['Tajawal', 'sans-serif'],
      },
    },
  },
  plugins: [],
}