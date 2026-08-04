/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: "#14151A",
        panel: "#1E2028",
        amber: "#F2B705",
        flarepink: "#E62058",
        steel: "#8B93A7",
      },
      fontFamily: {
        mono: ["IBM Plex Mono", "monospace"],
        grotesk: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
