import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        graphite: "#0A0D12",
        panel: "#111722",
        signal: "#70E1C8",
        ember: "#FFB86B",
        violet: "#A78BFA"
      }
    }
  },
  plugins: []
};

export default config;
