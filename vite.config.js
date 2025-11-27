import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// This is the configuration file for the Vite build tool.
// It defines how the project is compiled and bundled for production.
// https://vitejs.dev/config/
export default defineConfig({
  // The 'plugins' array tells Vite to use specific extensions.
  // We include 'react()' to enable JSX support and React Fast Refresh during development.
  plugins: [react()],

  // Define the base URL path for deployment. 
  // '/' is the standard default and works for Vercel.
  base: '/', 
  
  build: {
    // Defines the output directory for the compiled, production-ready files.
    // Vercel automatically looks for this 'dist' folder.
    outDir: 'dist', 
    
    // Optional: Enables small, useful log output during the build process.
    sourcemap: false,
    
    // Optional: Sets the code-splitting strategy (recommended for production).
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})