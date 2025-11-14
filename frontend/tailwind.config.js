/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme colors
        'bg-primary': '#0f1a1f',
        'bg-secondary': '#1b2429',
        'bg-tertiary': '#303030',
        'border-primary': '#2a3439',
        'text-primary': '#f6fefd',
        'text-secondary': '#949e9c',
        'text-tertiary': '#626e6c',
        // Trading colors
        'buy': '#1fa67d',
        'buy-hover': '#22c393',
        'buy-bg': '#0e3333',
        'sell': '#f24a67',
        'sell-hover': '#ff5c78',
        'sell-bg': '#3d1f25',
        // Accent colors
        'accent-primary': '#50d2c1',
        'accent-hover': '#5fe0cf',
        'warning': '#ffb648',
      },
      fontFamily: {
        sans: ['-apple-system', 'system-ui', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Ubuntu', 'Helvetica Neue', 'sans-serif'],
        mono: ['Monaco', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
