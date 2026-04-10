/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#EEEEEE",
        "surface": "#FFFFFF",
        "muted": "#686D76",
        "text-primary": "#373A40",
        "text-secondary": "#686D76",
        "accent": "#DC5F00",
        "accent-light": "#F08C3A",
        "accent-dark": "#B54E00",
        "card": "#FFFFFF",
        "border": "#E0E0E0",
      },
    },
  },
  plugins: [],
};
