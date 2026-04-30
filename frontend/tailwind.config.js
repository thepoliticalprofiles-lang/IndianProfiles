/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
        extend: {
                fontFamily: {
                    sans: ['Work Sans', 'Inter', 'system-ui', 'sans-serif'],
                    display: ['Inter', 'Work Sans', 'sans-serif'],
                },
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)'
                },
                colors: {
                        // Brand palette from logo
                        brand: {
                            navy: '#1a1b5c',
                            'navy-dark': '#0d0e3a',
                            'navy-light': '#2a2c86',
                            orange: '#f57c00',
                            'orange-dark': '#e26a00',
                            'orange-light': '#ff9a2e',
                            magenta: '#e91e63',
                            'magenta-dark': '#c2185b',
                            'magenta-light': '#f06292',
                            cream: '#faf7f2',
                        },
                        // Remap tailwind's blue -> navy palette so existing blue-* classes
                        // render as the brand navy
                        blue: {
                            50:  '#eef0fb',
                            100: '#d7d9f2',
                            200: '#b2b6e4',
                            300: '#8c92d5',
                            400: '#676fc7',
                            500: '#414bb8',
                            600: '#2d3a9c',
                            700: '#232c86',
                            800: '#1a2170',
                            900: '#1a1b5c',
                            950: '#0d0e3a',
                        },
                        // Remap emerald & green -> orange so existing emerald-*/green-*
                        // classes render as brand orange
                        emerald: {
                            50:  '#fff6e8',
                            100: '#ffe6c2',
                            200: '#ffd28f',
                            300: '#ffbd5c',
                            400: '#ffa92e',
                            500: '#ff9500',
                            600: '#f57c00',
                            700: '#d86c00',
                            800: '#b55800',
                            900: '#8a4200',
                            950: '#4d2400',
                        },
                        green: {
                            50:  '#fff6e8',
                            100: '#ffe6c2',
                            200: '#ffd28f',
                            300: '#ffbd5c',
                            400: '#ffa92e',
                            500: '#ff9500',
                            600: '#f57c00',
                            700: '#d86c00',
                            800: '#b55800',
                            900: '#8a4200',
                            950: '#4d2400',
                        },
                        // Keep teal distinct-ish but leaning orange
                        teal: {
                            50:  '#fff4e5',
                            100: '#ffe0b8',
                            600: '#f57c00',
                            700: '#d86c00',
                        },
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        card: {
                                DEFAULT: 'hsl(var(--card))',
                                foreground: 'hsl(var(--card-foreground))'
                        },
                        popover: {
                                DEFAULT: 'hsl(var(--popover))',
                                foreground: 'hsl(var(--popover-foreground))'
                        },
                        primary: {
                                DEFAULT: 'hsl(var(--primary))',
                                foreground: 'hsl(var(--primary-foreground))'
                        },
                        secondary: {
                                DEFAULT: 'hsl(var(--secondary))',
                                foreground: 'hsl(var(--secondary-foreground))'
                        },
                        muted: {
                                DEFAULT: 'hsl(var(--muted))',
                                foreground: 'hsl(var(--muted-foreground))'
                        },
                        accent: {
                                DEFAULT: 'hsl(var(--accent))',
                                foreground: 'hsl(var(--accent-foreground))'
                        },
                        destructive: {
                                DEFAULT: 'hsl(var(--destructive))',
                                foreground: 'hsl(var(--destructive-foreground))'
                        },
                        border: 'hsl(var(--border))',
                        input: 'hsl(var(--input))',
                        ring: 'hsl(var(--ring))',
                        chart: {
                                '1': 'hsl(var(--chart-1))',
                                '2': 'hsl(var(--chart-2))',
                                '3': 'hsl(var(--chart-3))',
                                '4': 'hsl(var(--chart-4))',
                                '5': 'hsl(var(--chart-5))'
                        }
                },
                keyframes: {
                        'accordion-down': {
                                from: { height: '0' },
                                to: { height: 'var(--radix-accordion-content-height)' }
                        },
                        'accordion-up': {
                                from: { height: 'var(--radix-accordion-content-height)' },
                                to: { height: '0' }
                        },
                        'fade-in-up': {
                                from: { opacity: '0', transform: 'translateY(20px)' },
                                to: { opacity: '1', transform: 'translateY(0)' }
                        }
                },
                animation: {
                        'accordion-down': 'accordion-down 0.2s ease-out',
                        'accordion-up': 'accordion-up 0.2s ease-out',
                        'fade-in-up': 'fade-in-up 0.5s ease-out forwards'
                }
        }
  },
  plugins: [require("tailwindcss-animate")],
};
