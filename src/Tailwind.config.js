/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom Colors
      colors: {
        'navy-dark': '#0a1428',
        'navy-light': '#1a2332',
        'navy-accent': '#2d3e52',
        'gold-primary': '#d4af37',
        'gold-light': '#e8c547',
        'gold-dark': '#9d8c2e',
      },

      // Custom Fonts
      fontFamily: {
        'display': ['Georgia', 'Garamond', 'serif'],
        'body': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Inter', 'Roboto', 'sans-serif'],
      },

      // Custom Shadows (3D effects)
      boxShadow: {
        'sm': '0 2px 8px rgba(0, 0, 0, 0.15)',
        'md': '0 8px 24px rgba(0, 0, 0, 0.25)',
        'lg': '0 16px 48px rgba(0, 0, 0, 0.35)',
        '3d': '0 20px 60px rgba(0, 0, 0, 0.4)',
        'inset': 'inset 0 1px 2px rgba(255, 255, 255, 0.1)',
      },

      // Custom Animations
      animation: {
        'gradient-shift': 'gradientShift 6s linear infinite',
        'subtitle-glow': 'subtitleGlow 4s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },

      // Custom Keyframes
      keyframes: {
        gradientShift: {
          '0%': { backgroundPosition: '0% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        subtitleGlow: {
          '0%': { backgroundPosition: '0% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },

      // Custom Backdrop Blur
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '20px',
      },

      // Custom Transitions
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'quick': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}