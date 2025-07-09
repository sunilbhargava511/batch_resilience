/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-ring': 'pulseRing 2s infinite',
        'gradient-shift': 'gradientShift 3s ease infinite',
        'slide-in': 'slideIn 0.8s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
      },
      backgroundSize: {
        '200': '200% 200%',
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}