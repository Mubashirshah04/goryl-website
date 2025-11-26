const config = {
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
                muted: '#F5F5F5'
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' }
                },
            },
        },
    },
    plugins: [
        function ({ addBase }) {
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
            });
        },
    ],
};
export default config;
