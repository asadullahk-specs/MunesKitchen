/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    darkMode: 'class',
    theme: {
        borderRadius: {
            'none': '0px',
            'sm': '7px',
            'DEFAULT': '7px',
            'md': '7px',
            'lg': '7px',
            'xl': '7px',
            '2xl': '7px',
            '3xl': '7px',
            'full': '7px',
        },
        extend: {
            fontFamily: {
                display: ['"Poppins"', 'sans-serif'],
                body: ['"Poppins"', 'sans-serif'],
                // body: ['"DM Sans"', 'sans-serif'],
            },
        },
    },
    plugins: [],
}