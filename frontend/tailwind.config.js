/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hirelens: {
          sage: "#DBE2DE",
          peach: "#F9E5DD",
          blush: "#F5CED5",
          rose: "#E9AFB7",
          cream: "#FDFEFD",
          ink: "#2F3432",
          muted: "#737A76",
        },
      },

      boxShadow: {
        soft: "0 10px 30px rgba(47, 52, 50, 0.08)",
        card: "0 6px 20px rgba(47, 52, 50, 0.06)",
      },

      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};