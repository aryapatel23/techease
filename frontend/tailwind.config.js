export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 16px 40px rgba(15, 23, 42, 0.06)',
        premium: '0 10px 30px rgba(79, 70, 229, 0.10)',
        lifted: '0 18px 50px rgba(15, 23, 42, 0.10)',
      },
      backgroundImage: {
        'dot-grid': 'radial-gradient(circle at 1px 1px, rgba(79, 70, 229, 0.08) 1px, transparent 0)',
      },
    },
  },
  plugins: [],
}
