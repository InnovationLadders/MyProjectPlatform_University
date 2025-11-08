import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        // target: 'http://localhost:3001',
        target: 'https://api.myprojectplatform.com/',
        changeOrigin: true
      },
      '/lti/launch': {
        // target: 'http://localhost:3001',
        target: 'https://api.myprojectplatform.com/',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          ui: ['framer-motion', 'lucide-react'],
        }
      }
    }
  }
});