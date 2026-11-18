import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          DEFAULT: "#FBF9F5",
          soft: "#F5F1E8",
          deep: "#EFE9DD",
        },
        forest: {
          DEFAULT: "#1B382B",
          hover: "#142B21",
          light: "#E9EFEA",
          muted: "#2C4C3D",
        },
        terracotta: {
          DEFAULT: "#B85D38",
          hover: "#9E4E2E",
          soft: "#F6ECE7",
        },
        ochre: {
          DEFAULT: "#C58B35",
          soft: "#FAF2E4",
        },
        charcoal: {
          DEFAULT: "#232723",
          muted: "#666D66",
          subtle: "#8D948D",
          border: "#E4DFD5",
        },
        hairline: "#E6E1D7",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Fraunces", "Georgia", "serif"],
        sans: ["var(--font-sans)", "DM Sans", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(27, 56, 43, 0.04), 0 1px 2px -1px rgba(27, 56, 43, 0.04)",
        card: "0 2px 8px -2px rgba(27, 56, 43, 0.06)",
        dropdown: "0 10px 25px -5px rgba(27, 56, 43, 0.08)",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
