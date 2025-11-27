/** @type {import('tailwindcss').Config} */
export default {
  // The 'content' array specifies the file paths where Tailwind should look for utility classes.
  // This setup ensures it scans your main HTML file and all JavaScript/React files in the src directory.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // You can customize fonts, colors, spacing, etc., here.
    extend: {
      // Example:
      // colors: {
      //   'custom-indigo': '#4f46e5',
      // }
    },
  },
  plugins: [],
}