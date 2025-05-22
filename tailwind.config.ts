import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        lightBlack: "var(--lightBlack)",
        lighterBlack: "var(--lighterBlack)",
        purple: "var(--purple)",
        rosyBrown: "var(--rosyBrown)",
        green: "var(--green)",
        yellow: "var(--yellow)",
        red: "var(--red)",
      },
      gridTemplateColumns: {
        layout: "var(--layout-cols)",
      },
      gridTemplateRows: {
        layout: "var(--layout-rows)",
      },
    },
  },
  plugins: [],
} satisfies Config;
