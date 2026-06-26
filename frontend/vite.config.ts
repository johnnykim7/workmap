import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3186, // 전역 포트 레지스트리: WorkMap FE
    // 실 BE 연동 시 /api/v1 → BE(8186) 프록시. MSW를 끄려면 VITE_USE_MOCK=false.
    proxy: {
      '/api': {
        target: process.env.VITE_BE_URL ?? 'http://localhost:8186',
        changeOrigin: true,
      },
    },
  },
});
