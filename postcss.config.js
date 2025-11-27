// postcss.config.js is used by Vite (which uses PostCSS internally)
// to process and optimize CSS. It is essential for integrating Tailwind CSS.
export default {
  plugins: {
    // 1. tailwindcss: This plugin runs first, processing the Tailwind directives 
    //    (@tailwind base, components, utilities) and generating the actual CSS.
    tailwindcss: {},
    
    // 2. autoprefixer: This plugin runs second, adding vendor prefixes 
    //    (-webkit-, -moz-, etc.) to your CSS to ensure compatibility across
    //    different browsers (Chrome, Firefox, Safari, Edge).
    autoprefixer: {},
  },
}