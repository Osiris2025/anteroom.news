/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tech: { DEFAULT: '#3b82f6', light: '#60a5fa', dark: '#2563eb' },
        poli: { DEFAULT: '#ef4444', light: '#f87171', dark: '#dc2626' },
        weird: { DEFAULT: '#a855f7', light: '#c084fc', dark: '#9333ea' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
