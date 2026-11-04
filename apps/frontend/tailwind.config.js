/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#054A29',
          600: '#0A723D',
          700: '#064E3B',
          900: '#022c22',
        },
        accent: {
          500: '#B8860B',
          600: '#D4AF37',
        },
        surface: '#FFFFFF',
        'surface-2': '#FAFCFA',
        border: '#E1E8E3',
        muted: '#64746B',
        faint: '#94A3A0',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      borderRadius: {
        sm: '10px',
        DEFAULT: '16px',
        lg: '24px',
        full: '9999px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
