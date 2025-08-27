import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET,
          changeOrigin: true,
        },
      },
    },
    build: {
      // Generate source maps for better debugging in production
      sourcemap: true,
      // Keep function and variable names for easier debugging
      minify: 'terser',
      terserOptions: {
        mangle: false, // Don't mangle names
        keep_fnames: true, // Keep function names
        keep_classnames: true, // Keep class names
      },
    },
  }
})