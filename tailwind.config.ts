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
      }
    }
  },
  plugins: []
};

export default config;












