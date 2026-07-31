import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        inky: {
          teal: '#4ca6a4',
          darkTeal: '#2b6f6d',
          cream: '#fcfbf7',
        },
        cherry: {
          50: '#fef2f3',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#d2042d', // Bright Cherry Red
          700: '#b50326', // Hover Cherry Red
          800: '#96021f',
          900: '#79041b',
          950: '#47000d',
          DEFAULT: '#d2042d',
        },
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
