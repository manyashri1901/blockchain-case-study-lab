/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 950: "#050b1a", 900: "#0a1428", 800: "#101e3a", 700: "#1a2d52", 600: "#2a4170" },
      },
    },
  },
  plugins: [],
};
