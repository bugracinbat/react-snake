/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "vercel-blue": "#0070F3",
        "vercel-purple": "#7928CA",
        "vercel-cyan": "#50E3C2",
        "vercel-pink": "#FF0080",
      },
      animation: {
        "snake-move": "snake-move 0.2s linear",
      },
      keyframes: {
        "snake-move": {
          "0%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
