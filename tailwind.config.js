/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Beach Sunset Color Scheme
        'beach': {
          50: '#fdf2f8',   // Light coral pink
          100: '#fce7f3',  // Very light coral pink
          200: '#fbcfe8',  // Light coral pink
          300: '#f9a8d4',  // Medium coral pink
          400: '#f472b6',  // Coral pink
          500: '#ec4899',  // Primary coral pink
          600: '#db2777',  // Dark coral pink
          700: '#be185d',  // Deeper coral pink
          800: '#9d174d',  // Very deep coral pink
          900: '#831843',  // Darkest coral pink
        },
        'sunset': {
          50: '#fefce8',   // Light golden yellow
          100: '#fef9c3',  // Very light golden yellow
          200: '#fef08a',  // Light golden yellow
          300: '#fde047',  // Medium golden yellow
          400: '#facc15',  // Golden yellow
          500: '#eab308',  // Primary golden yellow
          600: '#ca8a04',  // Dark golden yellow
          700: '#a16207',  // Deeper golden yellow
          800: '#854d0e',  // Very deep golden yellow
          900: '#713f12',  // Darkest golden yellow
        },
        'ocean': {
          50: '#f0f9ff',   // Light ocean blue
          100: '#e0f2fe',  // Very light ocean blue
          200: '#bae6fd',  // Light ocean blue
          300: '#7dd3fc',  // Medium ocean blue
          400: '#38bdf8',  // Ocean blue
          500: '#0ea5e9',  // Primary ocean blue
          600: '#0284c7',  // Dark ocean blue
          700: '#0369a1',  // Deeper ocean blue
          800: '#075985',  // Very deep ocean blue
          900: '#0c4a6e',  // Darkest ocean blue
        },
        'sand': {
          50: '#fafaf9',   // Light sand gray
          100: '#f5f5f4',  // Very light sand gray
          200: '#e7e5e4',  // Light sand gray
          300: '#d6d3d1',  // Medium sand gray
          400: '#a8a29e',  // Sand gray
          500: '#78716c',  // Primary sand gray
          600: '#57534e',  // Dark sand gray
          700: '#44403c',  // Deeper sand gray
          800: '#292524',  // Very deep sand gray
          900: '#1c1917',  // Darkest sand gray
        }
      },
      fontFamily: {
        'sans': ['Open Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'display': ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'heading': ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
