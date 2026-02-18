import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    reactRouter(),
    tsconfigPaths(),
  ],
  server: {
    port: 3000,
    strictPort: false,
    // Proxy configuration to avoid CORS issues
    proxy: {
      '/auth': {
        target: 'http://localhost:5010',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/auth/, ''),
      },
      '/api/orders': {
        target: 'http://localhost:5011',
        changeOrigin: true,
      },
      '/api/payments': {
        target: 'http://localhost:5012',
        changeOrigin: true,
      },
    },
  },
  // Optimize deps for faster dev server startup
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime'],
  },
});
