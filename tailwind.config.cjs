/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        phase: {
          explore: "#38bdf8",
          define: "#22c55e",
          concept: "#a855f7",
          validate: "#f97316",
          deliver: "#eab308",
          improve: "#ec4899"
        }
      }
    }
  },
  plugins: []
};

