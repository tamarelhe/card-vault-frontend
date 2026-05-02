import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8B5CF6',
          light: '#A78BFA',
          dark: '#7C3AED',
        },
        secondary: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#059669',
        },
        tertiary: {
          DEFAULT: '#B06B00',
          light: '#D97706',
        },
        cv: {
          neutral: '#7A7580',
          deep: '#0F0F18',
          base: '#131320',
          raised: '#1A1A28',
          surface: '#1E1E2E',
          overlay: '#252535',
          border: '#2A2A3D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Noto Serif', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
