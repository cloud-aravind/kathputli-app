/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],

  theme: {
    extend: {
      colors: {
        kathputli: {
          maroon: '#7B1E1E',
          'maroon-dark': '#641717',
          red: '#A03232',
          gold: '#D4AF37',
          beige: '#F1E6D6',
          ivory: '#FAF7F2',
          charcoal: '#3A2E2A',
          gray: '#6B6B6B',
        },
      },

      fontFamily: {
        display: [
          'Playfair Display',
          'Georgia',
          'serif',
        ],
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },

      boxShadow: {
        soft: '0 2px 12px -2px rgba(58,46,42,0.06), 0 4px 24px -6px rgba(58,46,42,0.04)',
        card: '0 4px 20px -4px rgba(58,46,42,0.08), 0 8px 40px -12px rgba(58,46,42,0.06)',
        maroon: '0 8px 24px -8px rgba(123,30,30,0.22)',
      },

      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },

      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },

        'slide-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(16px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },

        shimmer: {
          '0%': {
            backgroundPosition: '-200% 0',
          },
          '100%': {
            backgroundPosition: '200% 0',
          },
        },

        float: {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-8px)',
          },
        },
      },

      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.45s cubic-bezier(0.16,1,0.3,1)',
        shimmer: 'shimmer 1.5s linear infinite',
        float: 'float 4s ease-in-out infinite',
      },
    },
  },

  plugins: [],
}