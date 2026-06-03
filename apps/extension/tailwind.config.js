/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        graphite: "#0A0D12",
        signal: "#70E1C8",
        ember: "#FFB86B"
      }
    }
  },
  plugins: []
};
