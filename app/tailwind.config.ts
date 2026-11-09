import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#EEF1F4",
        wash: "#E1E7EC",
        line: "#C7D0D8",
        ink: "#14202B",
        slate: "#566676",
        ledger: "#0F6B66",
        alarm: "#C4361F",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
