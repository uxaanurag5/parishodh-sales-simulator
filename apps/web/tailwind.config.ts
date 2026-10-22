import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        "navy-950": "#061428",
        "navy-900": "#0B1F3A",
        "navy-800": "#0F2A4D",
        brand: "#0B4AA2",
        primary: "#1450A3",
        teal: "#1BB6C9",
        "teal-glow": "#22D3EE",
        green: "#16A34A",
        "green-soft": "#DCFCE7",
        amber: "#F59E0B",
        highlight: "#FDE68A",
        panel: "#F4F7FB",
        border: "#E2E8F0",
      },
    },
  },
  plugins: [],
} satisfies Config;
