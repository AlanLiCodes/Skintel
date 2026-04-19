import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-gothic-a1)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Heading scale
        "h1": ["2.5rem", { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "700" }],
        "h2": ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
        "h3": ["1.25rem", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        "h4": ["1.0625rem", { lineHeight: "1.4", fontWeight: "600" }],
      },
      colors: {
        brand: {
          50:  "#F5F9F7",
          100: "#DCEFE7",
          200: "#B8D9CC",
          300: "#C0D2D3",
          400: "#7CB6C6",
          500: "#4A90A4",
          600: "#3a7d91",
          700: "#2d6070",
          800: "#1f4550",
          900: "#162f38",
        },
      },
    },
  },
  plugins: [],
};

export default config;
