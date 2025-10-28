
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        headline: ['var(--font-headline)', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'background-pan': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'gradient-pan': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'create-logo': {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1) rotate(-15deg)' },
          '50%': { opacity: '1', transform: 'scale(1.1) rotate(5deg)' },
        },
        typing: {
          '0%, 100%': { transform: 'scale(0.8)', opacity: '0.7' },
          '50%': { transform: 'scale(1.2)', opacity: '1' },
        },
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'float-shard': {
            '0%, 100%': {
                transform: 'translate3d(0, 0, 0) rotate3d(1, 1, 1, 0deg)',
                opacity: '0.8'
            },
            '50%': {
                transform: 'translate3d(20px, -30px, 50px) rotate3d(0.5, 1, 0.8, 180deg)',
                opacity: '1'
            },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'button-pulse': {
          '0%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 hsl(var(--primary) / 0.7)',
          },
          '70%': {
            transform: 'scale(1.1)',
            boxShadow: '0 0 0 15px hsl(var(--primary) / 0)',
          },
          '100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 hsl(var(--primary) / 0)',
          },
        },
        'google-loader': {
          '0%': {
            backgroundPosition: '0% 50%',
            backgroundSize: '400% 400%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
            backgroundSize: '200% 200%',
          },
          '100%': {
            backgroundPosition: '0% 50%',
            backgroundSize: '400% 400%',
          },
        },
        'scale-in-pop': {
          '0%': {
            opacity: '0',
            transform: 'scale(1.5)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'background-pan': 'background-pan 30s linear infinite',
        'gradient-pan': 'gradient-pan 8s linear infinite',
        'create-logo': 'create-logo 3s ease-in-out infinite',
        typing: 'typing 1.4s infinite ease-in-out',
        'fade-in-up': 'fade-in-up 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'float-shard': 'float-shard 20s infinite ease-in-out',
        marquee: 'marquee 60s linear infinite',
        'button-pulse': 'button-pulse 1s ease-in-out',
        'google-loader': 'google-loader 2.5s ease-in-out infinite',
        'scale-in-pop': 'scale-in-pop 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
