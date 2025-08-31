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
        'dancho-red': '#C73E3A',
        'chung-blue': '#2E5B8A',
        'hwang-yellow': '#E8B838',
        'nok-green': '#3A7D4A',
        'baek-white': '#F5F0E6',
        'heuk-black': '#2D2926',
        'ja-purple': '#6B4E71',
        'hong-pink': '#E87B7B',
        'chung-cyan': '#5EAEB8',
        'soil-brown': '#8B7355',
      },
      fontFamily: {
        korean: ['var(--font-noto-serif)', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;

