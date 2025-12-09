import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        "creix-black": "#0a0a0a",
        "creix-blue": "#048B9A",
        "creix-blueDark": "#026f7a"
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        "slide-in-from-top": {
          "0%": { transform: "translateY(-8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        }
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in-from-top-2": "slide-in-from-top 0.2s ease-out"
      }
    }
  },
  plugins: []
};

export default config;












