/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Open Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'nunito': ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'ripple': 'ripple 0.6s linear',
        'status-pulse': 'statusPulse 2s ease-in-out infinite',
        'status-pulse-fast': 'statusPulse 1s ease-in-out infinite',
        'dot-pulse': 'dotPulse 1.5s ease-in-out infinite',
        'marquee-scroll': 'marquee-scroll 90s linear infinite',
        'scroll-left': 'scroll-left 25s linear infinite',
        'beach-gradient-shift': 'beach-gradient-shift 4s ease infinite',
        'sunset-glow': 'sunset-glow 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          'from': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        ripple: {
          '0%': {
            transform: 'scale(0)',
            opacity: '1',
          },
          '100%': {
            transform: 'scale(4)',
            opacity: '0',
          },
        },
        statusPulse: {
          '0%': {
            opacity: '1',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '0.7',
            transform: 'scale(1.05)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        dotPulse: {
          '0%': {
            opacity: '1',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '0.5',
            transform: 'scale(1.2)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        'marquee-scroll': {
          '0%': {
            transform: 'translateX(0)',
          },
          '100%': {
            transform: 'translateX(-50%)',
          },
        },
        'scroll-left': {
          '0%': {
            transform: 'translateX(0)',
          },
          '100%': {
            transform: 'translateX(-50%)',
          },
        },
        'beach-gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'sunset-glow': {
          '0%, 100%': { 
            background: 'linear-gradient(45deg, #ec4899, #eab308, #0ea5e9)',
          },
          '50%': { 
            background: 'linear-gradient(45deg, #db2777, #ec4899, #eab308)',
          },
        },
      },
    },
  },
  plugins: [],
}
