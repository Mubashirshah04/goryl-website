import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: { xs: '475px' },
      colors: { 
        primary: '#FF006E',
        coral: '#FF6868', // Vibrant coral primary color
        lavender: '#A29BFE', // Soft lavender accent color
        muted: '#F5F5F5',
        premium: {
          coral: '#FF6868',
          'coral-light': '#FF7A7A',
          'coral-dark': '#FF5757',
          purple: '#A29BFE',
          'purple-light': '#B8B2FF',
          'purple-dark': '#938EFF',
          gradient: 'linear-gradient(135deg, #FF6868 0%, #A29BFE 100%)',
        }
      },
      backgroundImage: {
        'gradient-premium': 'linear-gradient(135deg, #FF6868 0%, #A29BFE 50%, #FF6868 100%)',
        'gradient-premium-vertical': 'linear-gradient(180deg, #FF6868 0%, #A29BFE 100%)',
        'gradient-shimmer': 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
      },
      boxShadow: {
        'premium': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'premium-lg': '0 12px 48px rgba(0, 0, 0, 0.15)',
        'premium-coral': '0 8px 32px rgba(255, 104, 104, 0.4)',
        'premium-purple': '0 8px 32px rgba(162, 155, 254, 0.4)',
        'glow-coral': '0 0 20px rgba(255, 104, 104, 0.4), 0 0 40px rgba(255, 104, 104, 0.2)',
        'glow-purple': '0 0 20px rgba(162, 155, 254, 0.4), 0 0 40px rgba(162, 155, 254, 0.2)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.5s ease-out forwards',
        'rotate-gradient': 'rotate-gradient 10s linear infinite',
      },
      keyframes: {
        fadeIn: { 
          '0%': { opacity: '0' }, 
          '100%': { opacity: '1' } 
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 104, 104, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 104, 104, 0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'rotate-gradient': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    function({ addBase }: any) {
      addBase({
        'input, textarea, select': {
          color: '#000000 !important',
        },
        'input::placeholder, textarea::placeholder': {
          color: '#9ca3af !important',
        },
        'input:focus, textarea:focus, select:focus': {
          color: '#000000 !important',
        },
        '@media (prefers-color-scheme: dark)': {
          'input, textarea, select': {
            color: '#ffffff !important',
          },
          'input:focus, textarea:focus, select:focus': {
            color: '#ffffff !important',
          },
        },
      })
    },
  ],
}
export default config
