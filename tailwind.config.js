/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#a3242f',
          ink: '#7d1a23',
          light: '#fdf6f4',
          border: '#ecd3cf',
          hover: '#8e1f29'
        },
        paper: '#fbfaf7',
        ink: {
          DEFAULT: '#1c1a17',
          2: '#4a4640',
          3: '#59554e', // WCAG AA compliant (6.2:1 contrast)
          4: '#767066', // WCAG AA compliant (4.5:1 contrast)
        },
        line: '#e8e3da',
        sunk: '#f2eee7',
        gold: '#e09f0b',
        saffron: {
          DEFAULT: '#e8871e',
          light: '#fff4e6',
          ink: '#9a4f05',
        },
        apneyyGreen: {
          DEFAULT: '#166534', // Dark green WCAG AA (6.4:1 contrast)
          tint: '#dcfce7',
        },
        amberTint: '#fef3c7'
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: [
          '"Plus Jakarta Sans"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"Segoe UI"',
          'Roboto',
          '"Noto Sans"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif'
        ]
      },
      boxShadow: {
        card: '0 1px 2px rgba(28,26,23,.04), 0 8px 24px -12px rgba(28,26,23,.12)',
        lift: '0 2px 4px rgba(28,26,23,.06), 0 24px 48px -16px rgba(125,26,35,.22)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'none' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'scale-in': { '0%': { opacity: '0', transform: 'scale(.94)' }, '100%': { opacity: '1', transform: 'none' } },
        'slide-up': { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'none' } },
        'slide-in-right': { '0%': { opacity: '0', transform: 'translateX(24px)' }, '100%': { opacity: '1', transform: 'none' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        'word-in': { '0%': { opacity: '0', transform: 'translateY(60%)', filter: 'blur(4px)' }, '100%': { opacity: '1', transform: 'none', filter: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        pop: { '0%': { transform: 'scale(1)' }, '35%': { transform: 'scale(1.35)' }, '70%': { transform: 'scale(.9)' }, '100%': { transform: 'scale(1)' } },
        burst: { '0%': { opacity: '1', transform: 'translate(0,0) scale(.6)' }, '100%': { opacity: '0', transform: 'translate(var(--bx), var(--by)) scale(1)' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        'pulse-dot': { '0%,100%': { boxShadow: '0 0 0 0 rgba(22,163,74,.55)' }, '70%': { boxShadow: '0 0 0 6px rgba(22,163,74,0)' } },
      },
      animation: {
        'fade-up': 'fade-up .6s cubic-bezier(.2,.7,.2,1) both',
        'fade-in': 'fade-in .3s ease-out both',
        'scale-in': 'scale-in .25s cubic-bezier(.2,.7,.2,1) both',
        'slide-up': 'slide-up .32s cubic-bezier(.2,.7,.2,1) both',
        'slide-in-right': 'slide-in-right .35s cubic-bezier(.2,.7,.2,1) both',
        float: 'float 6s ease-in-out infinite',
        'word-in': 'word-in .55s cubic-bezier(.2,.7,.2,1) both',
        pop: 'pop .45s cubic-bezier(.2,.7,.2,1)',
        burst: 'burst .6s ease-out forwards',
        marquee: 'marquee 40s linear infinite',
        'pulse-dot': 'pulse-dot 2s infinite',
      },
    },
  },
  plugins: [],
};
