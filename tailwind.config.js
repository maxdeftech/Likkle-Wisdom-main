/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                "primary": "#13ec5b",
                "jamaican-gold": "#f4d125",
                "background-dark": "#0a1a0f",
                "accent-gold": "#FFD700",
                // Keeping these as fallbacks/utilities if used
                'card-dark': '#1a1a1a',
            },
            fontFamily: {
                "heading": ['"Plus Jakarta Sans"', 'sans-serif'],
                "body": ['"Plus Jakarta Sans"', 'sans-serif'],
                "display": ['"Plus Jakarta Sans"', 'sans-serif'],
                "grotesk": ['"Space Grotesk"', 'sans-serif']
            },
            zIndex: {
                'negative': '-1',
                '0': '0',
                'dropdown': '50',
                'sticky': '100',
                'overlay': '200',
                'modal': '300',
                'notification': '400',
                'tooltip': '500',
            },
            animation: {
                'fade-in': 'fade-in 0.6s ease-out forwards',
                'float': 'float 3s ease-in-out infinite',
                'slow-spin': 'slow-spin 12s linear infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'pop': 'pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            },
            keyframes: {
                'fade-in': {
                    'from': { opacity: '0', transform: 'translateY(10px)' },
                    'to': { opacity: '1', transform: 'translateY(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                'slow-spin': {
                    'from': { transform: 'rotate(0deg)' },
                    'to': { transform: 'rotate(360deg)' },
                },
                'pulse-glow': {
                    '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 5px rgba(19, 236, 91, 0.4))' },
                    '50%': { opacity: '0.7', filter: 'drop-shadow(0 0 20px rgba(19, 236, 91, 0.8))' },
                },
                pop: {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.4)' },
                    '100%': { transform: 'scale(1)' },
                }
            },
        },
    },
    plugins: [],
}
