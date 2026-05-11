/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17212b",
        line: "#d8e0e8",
        panel: "#f6f8fa"
      }
    }
  },
  plugins: []
};

