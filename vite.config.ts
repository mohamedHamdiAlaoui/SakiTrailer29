import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

function getManualChunk(id: string) {
  if (!id.includes('node_modules')) {
    return undefined;
  }

  if (id.includes('i18next') || id.includes('react-i18next')) {
    return 'i18n-vendor';
  }

  if (id.includes('firebase')) {
    return 'firebase-vendor';
  }

  if (
    id.includes('@hookform') ||
    id.includes('react-hook-form') ||
    id.includes('/zod/') ||
    id.includes('\\zod\\')
  ) {
    return 'form-vendor';
  }

  if (id.includes('leaflet') || id.includes('react-leaflet')) {
    return 'map-vendor';
  }

  if (
    id.includes('@radix-ui') ||
    id.includes('lucide-react') ||
    id.includes('class-variance-authority') ||
    id.includes('clsx') ||
    id.includes('tailwind-merge') ||
    id.includes('sonner')
  ) {
    return 'ui-vendor';
  }

  return undefined;
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/',
    plugins: [inspectAttr(), react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: getManualChunk,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_AUTH_API_TARGET || 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
  };
});
